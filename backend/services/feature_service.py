import pandas as pd
import numpy as np

def add_features(df):
    """
    Adds required features to the DataFrame: SMA, EMA, RSI, MACD, lags
    """
    df = df.copy()
    
    # Simple Moving Average
    df['SMA_7'] = df['Close'].rolling(window=7).mean()
    df['SMA_14'] = df['Close'].rolling(window=14).mean()
    
    # Exponential Moving Average
    df['EMA_7'] = df['Close'].ewm(span=7, adjust=False).mean()
    
    # RSI (14-day)
    delta = df['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['RSI_14'] = 100 - (100 / (1 + rs))
    
    # MACD
    exp1 = df['Close'].ewm(span=12, adjust=False).mean()
    exp2 = df['Close'].ewm(span=26, adjust=False).mean()
    df['MACD'] = exp1 - exp2
    
    # Price changes
    df['Daily_Change'] = df['Close'].diff()
    df['Pct_Change'] = df['Close'].pct_change() * 100
    
    # Lag features
    df['lag_1'] = df['Close'].shift(1)
    df['lag_5'] = df['Close'].shift(5)
    df['lag_10'] = df['Close'].shift(10)
    
    # Drop NaNs introduced by rolling/shifts
    df.dropna(inplace=True)
    
    return df
