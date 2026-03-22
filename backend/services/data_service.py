import yfinance as yf
import pandas as pd
import logging

logger = logging.getLogger(__name__)

def get_historical_data(symbol, start=None, end=None):
    logger.info(f"Fetching historical data for {symbol} from {start} to {end}")
    ticker = yf.Ticker(symbol)
    
    kwargs = {}
    if start: kwargs['start'] = start
    if end: kwargs['end'] = end
    if not kwargs: kwargs['period'] = '5y'
    
    df = ticker.history(**kwargs)
    
    if df.empty:
        raise ValueError(f"No data found for symbol {symbol}")
        
    df.reset_index(inplace=True)
    
    if 'Date' in df.columns:
        dates = df['Date'].dt.strftime('%Y-%m-%d').tolist()
    elif 'Datetime' in df.columns:
        dates = df['Datetime'].dt.strftime('%Y-%m-%d').tolist()
    else:
        dates = df.index.strftime('%Y-%m-%d').tolist()
    
    return {
        "symbol": symbol,
        "dates": dates,
        "open": df['Open'].tolist(),
        "close": df['Close'].tolist(),
        "high": df['High'].tolist(),
        "low": df['Low'].tolist(),
        "volume": df['Volume'].tolist()
    }

def fetch_and_preprocess(symbol):
    logger.info(f"Preprocessing data for model training: {symbol}")
    ticker = yf.Ticker(symbol)
    df = ticker.history(period='5y')
    
    if df.empty:
        raise ValueError(f"No data found for {symbol}")
        
    # Remove timezone
    if hasattr(df.index, 'tz_localize') and df.index.tz is not None:
        df.index = df.index.tz_localize(None)
    
    # 1. Handle missing values (forward fill)
    df = df.ffill()
    # 2. Remove duplicates
    df = df[~df.index.duplicated(keep='first')]
    
    return df
