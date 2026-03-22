from flask import Blueprint, request, jsonify
import logging
from services.data_service import get_historical_data
from services.model_service import predict_stock

stock_bp = Blueprint('stock_bp', __name__)
logger = logging.getLogger(__name__)

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
