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

def get_stock_info(symbol):
    """Fetch fundamental data and recent news for sentiment analysis"""
    logger.info(f"Fetching fundamental data for {symbol}")
    ticker = yf.Ticker(symbol)
    info = ticker.info
    news = ticker.news
    
    # Process news to extract headlines for potential sentiment analysis
    processed_news = []
    for item in news[:5]: # Take top 5 news items
        processed_news.append({
            "title": item.get('title'),
            "publisher": item.get('publisher'),
            "link": item.get('link'),
            "published": item.get('providerPublishTime')
        })

    return {
        "symbol": symbol,
        "name": info.get('longName', symbol),
        "sector": info.get('sector', 'N/A'),
        "marketCap": info.get('marketCap', 0),
        "peRatio": info.get('forwardPE', info.get('trailingPE', 0)),
        "dividendYield": info.get('dividendYield', 0),
        "fiftyTwoWeekHigh": info.get('fiftyTwoWeekHigh', 0),
        "fiftyTwoWeekLow": info.get('fiftyTwoWeekLow', 0),
        "summary": info.get('longBusinessSummary', ''),
        "news": processed_news
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
