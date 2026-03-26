from flask import Blueprint, request, jsonify
import logging
from services.data_service import get_historical_data, get_stock_info
from services.model_service import predict_stock
from models.user import db, Watchlist, Portfolio
from utils.auth import token_required

stock_bp = Blueprint('stock_bp', __name__)
logger = logging.getLogger(__name__)

# ─── Portfolio Routes ─────────────────────────────────────────────────────────

@stock_bp.route('/portfolio', methods=['GET'])
@token_required
def get_portfolio(current_user):
    """Get all items in user's portfolio"""
    items = Portfolio.query.filter_by(user_id=current_user.id).all()
    return jsonify([i.to_dict() for i in items]), 200

@stock_bp.route('/portfolio', methods=['POST'])
@token_required
def add_portfolio_item(current_user):
    """Add a trade to portfolio"""
    data = request.get_json()
    if not data or not data.get('symbol') or not data.get('shares'):
        return jsonify({'error': 'Symbol and shares are required'}), 400
    
    symbol = data.get('symbol').upper().strip()
    shares = float(data.get('shares'))
    price = float(data.get('price')) if data.get('price') else 0.0
    
    # Simple logic: add to existing or create new
    existing = Portfolio.query.filter_by(user_id=current_user.id, symbol=symbol).first()
    if existing:
        # Weighted average price
        total_cost = (existing.shares * existing.purchase_price) + (shares * price)
        existing.shares += shares
        existing.purchase_price = total_cost / existing.shares if existing.shares > 0 else 0
    else:
        new_item = Portfolio(user_id=current_user.id, symbol=symbol, shares=shares, purchase_price=price)
        db.session.add(new_item)
        
    try:
        db.session.commit()
        return jsonify({'message': 'Portfolio updated'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@stock_bp.route('/portfolio/<int:item_id>', methods=['DELETE'])
@token_required
def delete_portfolio_item(current_user, item_id):
    """Sell/remove item from portfolio"""
    item = Portfolio.query.filter_by(id=item_id, user_id=current_user.id).first()
    if not item:
        return jsonify({'error': 'Item not found'}), 404
        
    try:
        db.session.delete(item)
        db.session.commit()
        return jsonify({'message': 'Item removed'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@stock_bp.route('/info', methods=['GET'])
def get_info():
    symbol = request.args.get('symbol')
    if not symbol:
        return jsonify({"error": "Symbol is required"}), 400
    try:
        info = get_stock_info(symbol.upper())
        return jsonify(info), 200
    except Exception as e:
        logger.error(f"Error fetching stock info: {str(e)}")
        return jsonify({"error": str(e)}), 500

@stock_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"})

@stock_bp.route('/models', methods=['GET'])
def list_models():
    return jsonify({
        "models": ["Linear Regression", "Random Forest", "LSTM"]
    })

@stock_bp.route('/historical', methods=['GET'])
def get_historical():
    symbol = request.args.get('symbol')
    start = request.args.get('start')
    end = request.args.get('end')
    
    if not symbol:
        return jsonify({"error": "Symbol is required"}), 400
        
    try:
        data = get_historical_data(symbol, start, end)
        return jsonify(data)
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 404
    except Exception as e:
        logger.error(f"Error fetching historical data: {str(e)}")
        return jsonify({"error": str(e)}), 500

@stock_bp.route('/predict', methods=['POST'])
def predict():
    body = request.get_json()
    if not body:
        return jsonify({"error": "Request body must be JSON"}), 400
        
    symbol = body.get('symbol')
    days = body.get('days', 7)
    model_name = body.get('model')
    
    if not symbol or not model_name:
        return jsonify({"error": "Symbol and model are required"}), 400
        
    try:
        result = predict_stock(symbol, int(days), model_name)
        return jsonify(result)
    except ValueError as ve:
        logger.error(f"Validation Error: {str(ve)}")
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        logger.error(f"Prediction Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ─── Watchlist Routes ──────────────────────────────────────────────────────────

@stock_bp.route('/watchlist', methods=['GET'])
@token_required
def get_watchlist(current_user):
    """Get all stocks in user's watchlist"""
    watches = Watchlist.query.filter_by(user_id=current_user.id).all()
    return jsonify([w.to_dict() for w in watches]), 200

@stock_bp.route('/watchlist', methods=['POST'])
@token_required
def add_to_watchlist(current_user):
    """Add a stock to user's watchlist"""
    data = request.get_json()
    if not data or not data.get('symbol'):
        return jsonify({'error': 'Symbol is required'}), 400
    
    symbol = data.get('symbol').upper().strip()
    
    # Check if already exists
    existing = Watchlist.query.filter_by(user_id=current_user.id, symbol=symbol).first()
    if existing:
        return jsonify(existing.to_dict()), 200
        
    try:
        watch = Watchlist(user_id=current_user.id, symbol=symbol)
        db.session.add(watch)
        db.session.commit()
        return jsonify(watch.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Watchlist add error: {str(e)}")
        return jsonify({'error': 'Failed to add to watchlist'}), 500

@stock_bp.route('/watchlist/<symbol>', methods=['DELETE'])
@token_required
def remove_from_watchlist(current_user, symbol):
    """Remove a stock from user's watchlist"""
    watch = Watchlist.query.filter_by(user_id=current_user.id, symbol=symbol.upper()).first()
    if not watch:
        return jsonify({'error': 'Stock not found in watchlist'}), 404
        
    try:
        db.session.delete(watch)
        db.session.commit()
        return jsonify({'message': f'Removed {symbol} from watchlist'}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Watchlist delete error: {str(e)}")
        return jsonify({'error': 'Failed to remove from watchlist'}), 500
