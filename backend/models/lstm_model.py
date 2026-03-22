from keras.models import Sequential
from keras.layers import LSTM, Dense, Input

def build_lstm_model(input_shape=(60, 1)):
    """
    Architecture as per report Figure 5.7:
    - Input: sequences of 60 time steps
    - LSTM layer (128 units)
    - LSTM layer (128 units)
    - Dense layer (25 units)
    - Dense layer (1 unit)
    Optimizer: Adam
    Loss: MSE
    """
    model = Sequential([
        Input(shape=input_shape),
        LSTM(128, return_sequences=True),
        LSTM(128, return_sequences=False),
        Dense(25),
        Dense(1)
    ])
    model.compile(optimizer='adam', loss='mse')
    return model
