import logging
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from .data_service import fetch_and_preprocess
from .feature_service import add_features
from .metrics_service import calculate_metrics
from models.lr_model import build_lr_model
from models.rf_model import build_rf_model
from models.lstm_model import build_lstm_model

logger = logging.getLogger(__name__)

# Model cache: symbol_modelname -> dict(model, scalers)
MODEL_CACHE = {}

def create_sequences(data, seq_length=60):
    X, y = [], []
    for i in range(seq_length, len(data)):
        X.append(data[i-seq_length:i])
        y.append(data[i, 0])
    return np.array(X), np.array(y)

def prepare_data_traditional(df, features):
    df = df.copy()
    df['Target'] = df['Close'].shift(-1)
    df.dropna(inplace=True)
    
    X = df[features].values
    y = df['Target'].values
    dates = df.index.strftime('%Y-%m-%d').values
    
    return X, y, dates

def predict_stock(symbol, days, model_name):
    cache_key = f"{symbol}_{model_name}"
    
    df_raw = fetch_and_preprocess(symbol)
    df_features = add_features(df_raw)
    
    logger.info(f"Processing prediction for {symbol} using {model_name}")
    
    if model_name == "Linear Regression":
        features = ['Open', 'High', 'Low', 'Volume', 'SMA_7', 'SMA_14', 'EMA_7']
        X, y, dates = prepare_data_traditional(df_features, features)
        
        scaler_X = MinMaxScaler()
        scaler_y = MinMaxScaler()
        
        X_scaled = scaler_X.fit_transform(X)
        y_scaled = scaler_y.fit_transform(y.reshape(-1, 1)).flatten()
        
        # 80/20 train/test split without shuffling
        split_idx = int(len(X) * 0.8)
        X_train, X_test = X_scaled[:split_idx], X_scaled[split_idx:]
        y_train, y_test = y_scaled[:split_idx], y_scaled[split_idx:]
        dates_test = dates[split_idx:]
        
        if cache_key in MODEL_CACHE:
            model = MODEL_CACHE[cache_key]['model']
        else:
            logger.info(f"Training LR model for {symbol}...")
            model = build_lr_model()
            model.fit(X_train, y_train)
            MODEL_CACHE[cache_key] = {'model': model, 'scaler_X': scaler_X, 'scaler_y': scaler_y}
        
        preds_scaled = model.predict(X_test)
        preds = scaler_y.inverse_transform(preds_scaled.reshape(-1, 1)).flatten()
        actuals = scaler_y.inverse_transform(y_test.reshape(-1, 1)).flatten()
        
        metrics = calculate_metrics(actuals, preds)
        
        last_row = df_features.iloc[-1][features].values.reshape(1, -1)
        future_forecast = []
        last_date = pd.to_datetime(dates[-1])
        
        current_features = scaler_X.transform(last_row)
        for i in range(days):
            next_pred_scaled = model.predict(current_features)
            next_pred = scaler_y.inverse_transform(next_pred_scaled.reshape(-1, 1)).flatten()[0]
            next_date = (last_date + pd.Timedelta(days=i+1)).strftime('%Y-%m-%d')
            future_forecast.append({"date": next_date, "price": float(next_pred)})
            current_features[0][0] = next_pred_scaled[0]
            
    elif model_name == "Random Forest":
        features = ['Open', 'High', 'Low', 'Volume', 'SMA_7', 'SMA_14', 'EMA_7', 'lag_1', 'lag_5', 'lag_10']
        X, y, dates = prepare_data_traditional(df_features, features)
        
        scaler_X = MinMaxScaler()
        scaler_y = MinMaxScaler()
        
        X_scaled = scaler_X.fit_transform(X)
        y_scaled = scaler_y.fit_transform(y.reshape(-1, 1)).flatten()
        
        split_idx = int(len(X) * 0.8)
        X_train, X_test = X_scaled[:split_idx], X_scaled[split_idx:]
        y_train, y_test = y_scaled[:split_idx], y_scaled[split_idx:]
        dates_test = dates[split_idx:]
        
        if cache_key in MODEL_CACHE:
            model = MODEL_CACHE[cache_key]['model']
        else:
            logger.info(f"Training RF model for {symbol}...")
            model = build_rf_model()
            model.fit(X_train, y_train)
            MODEL_CACHE[cache_key] = {'model': model, 'scaler_X': scaler_X, 'scaler_y': scaler_y}
            
        preds_scaled = model.predict(X_test)
        preds = scaler_y.inverse_transform(preds_scaled.reshape(-1, 1)).flatten()
        actuals = scaler_y.inverse_transform(y_test.reshape(-1, 1)).flatten()
        
        metrics = calculate_metrics(actuals, preds)
        
        last_row = df_features.iloc[-1][features].values.reshape(1, -1)
        future_forecast = []
        last_date = pd.to_datetime(dates[-1])
        current_features = scaler_X.transform(last_row)
        for i in range(days):
            next_pred_scaled = model.predict(current_features)
            next_pred = scaler_y.inverse_transform(next_pred_scaled.reshape(-1, 1)).flatten()[0]
            next_date = (last_date + pd.Timedelta(days=i+1)).strftime('%Y-%m-%d')
            future_forecast.append({"date": next_date, "price": float(next_pred)})
            current_features[0][0] = next_pred_scaled[0]
            
    elif model_name == "LSTM":
        df_lstm = df_features[['Close']].copy()
        scaler = MinMaxScaler(feature_range=(0, 1))
        scaled_data = scaler.fit_transform(df_lstm.values)
        
        seq_length = 60
        if len(scaled_data) <= seq_length:
            raise ValueError(f"Not enough data to create sequences of length {seq_length}")
            
        X, y = create_sequences(scaled_data, seq_length)
        valid_dates = df_features.index[seq_length:].strftime('%Y-%m-%d').values
        
        split_idx = int(len(X) * 0.8)
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]
        dates_test = valid_dates[split_idx:]
        
        if cache_key in MODEL_CACHE:
            model = MODEL_CACHE[cache_key]['model']
        else:
            logger.info(f"Training LSTM model for {symbol}...")
            model = build_lstm_model((seq_length, 1))
            # Just training 5 epochs for speed in API
            model.fit(X_train, y_train, batch_size=32, epochs=5, verbose=0)
            MODEL_CACHE[cache_key] = {'model': model, 'scaler': scaler}
            
        preds_scaled = model.predict(X_test, verbose=0)
        preds = scaler.inverse_transform(preds_scaled).flatten()
        actuals = scaler.inverse_transform(y_test.reshape(-1, 1)).flatten()
        
        metrics = calculate_metrics(actuals, preds)
        
        last_sequence = scaled_data[-seq_length:]
        future_forecast = []
        last_date_obj = pd.to_datetime(df_features.index[-1])
        
        current_seq = last_sequence.copy()
        for i in range(days):
            pred_next = model.predict(current_seq.reshape(1, seq_length, 1), verbose=0)
            precio = scaler.inverse_transform(pred_next)[0][0]
            next_date_str = (last_date_obj + pd.Timedelta(days=i+1)).strftime('%Y-%m-%d')
            future_forecast.append({"date": next_date_str, "price": float(precio)})
            current_seq = np.append(current_seq[1:], pred_next, axis=0)
            
    else:
        raise ValueError(f"Invalid model name: {model_name}. Allowed: Linear Regression, Random Forest, LSTM")
        
    actual_prices_list = [{"date": str(d), "price": float(p)} for d, p in zip(dates_test, actuals)]
    predicted_prices_list = [{"date": str(d), "price": float(p)} for d, p in zip(dates_test, preds)]
    
    return {
        "symbol": symbol,
        "model": model_name,
        "actual_prices": actual_prices_list[-100:], 
        "predicted_prices": predicted_prices_list[-100:],
        "future_forecast": future_forecast,
        "metrics": metrics
    }
