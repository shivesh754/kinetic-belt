from flask import Blueprint, request, jsonify, current_app
from models.user import db, User
import jwt
import datetime
import logging
from functools import wraps

logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth_bp', __name__)


from utils.auth import generate_token, token_required


# ─── Registration ───────────────────────────────────────────────────────────────

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user with email & password"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body must be JSON'}), 400

    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    # Validation
    if not name or not email or not password:
        return jsonify({'error': 'Name, email, and password are required'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    # Check if user already exists
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        if existing_user.provider != 'local':
            return jsonify({
                'error': f'This email is already registered via {existing_user.provider.title()}. Please sign in with {existing_user.provider.title()} instead.'
            }), 409
        return jsonify({'error': 'An account with this email already exists'}), 409

    try:
        user = User(
            name=name,
            email=email,
            avatar=name[0].upper() if name else 'U',
            provider='local'
        )
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        token = generate_token(user)

        logger.info(f"New user registered: {email}")
        return jsonify({
            'message': 'Account created successfully',
            'token': token,
            'user': user.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Registration error: {str(e)}")
        return jsonify({'error': 'Failed to create account. Please try again.'}), 500


# ─── Login ──────────────────────────────────────────────────────────────────────

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login with email & password"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body must be JSON'}), 400

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({'error': 'No account found with this email'}), 401

    if user.provider != 'local' and not user.password_hash:
        return jsonify({
            'error': f'This account was created with {user.provider.title()}. Please sign in with {user.provider.title()} instead.'
        }), 401

    if not user.check_password(password):
        return jsonify({'error': 'Incorrect password'}), 401

    token = generate_token(user)

    logger.info(f"User logged in: {email}")
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict()
    }), 200


# ─── Google OAuth ───────────────────────────────────────────────────────────────

@auth_bp.route('/google', methods=['POST'])
@auth_bp.route('/google-login', methods=['POST'])
def google_auth():
    """Authenticate using a Google OAuth credential (ID token from Google Identity Services)"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body must be JSON'}), 400

    credential = data.get('credential')  # The ID token from Google
    if not credential:
        return jsonify({'error': 'Google credential is required'}), 400

    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests

        # Verify the Google ID token
        google_client_id = current_app.config.get('GOOGLE_CLIENT_ID')
        idinfo = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            google_client_id
        )

        # Extract user info from the verified token
        google_user_id = idinfo['sub']
        email = idinfo.get('email', '').lower()
        name = idinfo.get('name', email.split('@')[0])
        picture = idinfo.get('picture', '')

        if not email:
            return jsonify({'error': 'Could not retrieve email from Google'}), 400

        # Check if user exists
        user = User.query.filter_by(email=email).first()

        if user:
            # Update existing user's Google info if needed
            if user.provider == 'local':
                # Link Google to existing local account
                user.provider_id = google_user_id
                user.provider = 'google'
                user.google_user = True
                if picture:
                    user.avatar = picture
            elif user.provider_id != google_user_id:
                user.provider_id = google_user_id
                user.google_user = True

            if picture and not user.avatar:
                user.avatar = picture
            db.session.commit()
        else:
            # Create new user
            user = User(
                name=name,
                email=email,
                avatar=picture or name[0].upper(),
                provider='google',
                provider_id=google_user_id,
                google_user=True
            )
            db.session.add(user)
            db.session.commit()
            logger.info(f"New Google user created: {email}")

        token = generate_token(user)

        return jsonify({
            'message': 'Google authentication successful',
            'token': token,
            'user': user.to_dict()
        }), 200

    except ValueError as e:
        logger.error(f"Google token verification failed: {str(e)}")
        return jsonify({'error': 'Invalid Google credential. Please try again.'}), 401
    except Exception as e:
        db.session.rollback()
        logger.error(f"Google auth error: {str(e)}")
        return jsonify({'error': 'Google authentication failed'}), 500


# ─── GitHub OAuth ───────────────────────────────────────────────────────────────

@auth_bp.route('/github', methods=['POST'])
def github_auth():
    """Authenticate using GitHub (token from GitHub OAuth flow)"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body must be JSON'}), 400

    access_token = data.get('access_token')
    if not access_token:
        return jsonify({'error': 'GitHub access token is required'}), 400

    try:
        import requests as http_requests

        # Fetch user info from GitHub API
        headers = {'Authorization': f'token {access_token}'}
        resp = http_requests.get('https://api.github.com/user', headers=headers)

        if resp.status_code != 200:
            return jsonify({'error': 'Invalid GitHub token'}), 401

        github_user = resp.json()

        # Fetch email if not public
        email = github_user.get('email')
        if not email:
            email_resp = http_requests.get('https://api.github.com/user/emails', headers=headers)
            if email_resp.status_code == 200:
                emails = email_resp.json()
                primary = next((e for e in emails if e.get('primary')), None)
                email = primary['email'] if primary else emails[0]['email']

        if not email:
            return jsonify({'error': 'Could not retrieve email from GitHub'}), 400

        email = email.lower()
        name = github_user.get('name') or github_user.get('login', email.split('@')[0])
        avatar = github_user.get('avatar_url', '')
        github_id = str(github_user.get('id', ''))

        # Check if user exists
        user = User.query.filter_by(email=email).first()

        if user:
            if user.provider == 'local':
                user.provider = 'github'
                user.provider_id = github_id
                if avatar:
                    user.avatar = avatar
            db.session.commit()
        else:
            user = User(
                name=name,
                email=email,
                avatar=avatar or name[0].upper(),
                provider='github',
                provider_id=github_id
            )
            db.session.add(user)
            db.session.commit()
            logger.info(f"New GitHub user created: {email}")

        token = generate_token(user)

        return jsonify({
            'message': 'GitHub authentication successful',
            'token': token,
            'user': user.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"GitHub auth error: {str(e)}")
        return jsonify({'error': 'GitHub authentication failed'}), 500


# ─── Get Current User ───────────────────────────────────────────────────────────

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    """Get the currently authenticated user"""
    return jsonify({'user': current_user.to_dict()}), 200


# ─── Update Profile ─────────────────────────────────────────────────────────────

@auth_bp.route('/me', methods=['PUT'])
@token_required
def update_profile(current_user):
    """Update user profile"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body must be JSON'}), 400

    name = data.get('name', '').strip()
    if name:
        current_user.name = name
        if not current_user.avatar or len(current_user.avatar) == 1:
            current_user.avatar = name[0].upper()

    try:
        db.session.commit()
        return jsonify({
            'message': 'Profile updated',
            'user': current_user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Profile update error: {str(e)}")
        return jsonify({'error': 'Failed to update profile'}), 500
