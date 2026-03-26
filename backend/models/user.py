from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from datetime import datetime

db = SQLAlchemy()
bcrypt = Bcrypt()


class User(db.Model):
    """User model for authentication"""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=True)  # Nullable for OAuth-only users
    avatar = db.Column(db.String(500), nullable=True)  # URL or single character
    provider = db.Column(db.String(20), default='local')  # 'local', 'google', 'github'
    provider_id = db.Column(db.String(256), nullable=True)  # OAuth provider user ID
    google_user = db.Column(db.Boolean, default=False)  # Explicit flag requested by user
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        if not self.password_hash:
            return False
        return bcrypt.check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'avatar': self.avatar or self.name[0].upper() if self.name else 'U',
            'provider': self.provider,
            'joinedAt': self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f'<User {self.email}>'


class Watchlist(db.Model):
    """Users' favorite stocks for quick tracking"""
    __tablename__ = 'watchlists'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    symbol = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship
    user = db.relationship('User', backref=db.backref('watchlists', lazy=True))

    # Unique constraint per user/symbol
    __table_args__ = (db.UniqueConstraint('user_id', 'symbol', name='user_symbol_uc'),)

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'createdAt': self.created_at.isoformat()
        }

class Portfolio(db.Model):
    """Users' virtual stock holdings for simulation"""
    __tablename__ = 'portfolios'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    symbol = db.Column(db.String(20), nullable=False)
    shares = db.Column(db.Float, nullable=False, default=0.0)
    purchase_price = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship
    user_rel = db.relationship('User', backref=db.backref('portfolio_items', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'symbol': self.symbol,
            'shares': self.shares,
            'purchasePrice': self.purchase_price,
            'createdAt': self.created_at.isoformat()
        }

class PriceAlert(db.Model):
    """Users' price threshold alerts"""
    __tablename__ = 'price_alerts'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    symbol = db.Column(db.String(20), nullable=False)
    target_price = db.Column(db.Float, nullable=False)
    condition = db.Column(db.String(10), default='above') # above or below
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'symbol': self.symbol,
            'targetPrice': self.target_price,
            'condition': self.condition,
            'isActive': self.is_active
        }



