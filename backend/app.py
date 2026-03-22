from flask import Flask
from flask_cors import CORS
import logging
from routes.stock_routes import stock_bp

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__)
    CORS(app) # Enable CORS for all routes
    
    # Register blueprints
    app.register_blueprint(stock_bp, url_prefix='/api')
    
    logger.info("Flask app setup complete. Registered blueprints.")
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
