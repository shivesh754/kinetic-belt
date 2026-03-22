from sklearn.ensemble import RandomForestRegressor

def build_rf_model():
    return RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
