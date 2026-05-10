# backend/routes/model.py

from flask import Blueprint, request, jsonify
import pandas as pd
import os
import pickle
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense

from config import UPLOAD_FOLDER, MODEL_FOLDER
from utils.logger import logger
from utils.response import success, error

model_bp = Blueprint("model", __name__)


@model_bp.route("/train", methods=["POST"])
def train_model():
    data = request.json
    filename = data.get("filename")
    target = data.get("target")

    logger.info("Training started")
    logger.info(f"Training on file: {filename}, target: {target}")

    if not filename or not target:
        return jsonify(error("filename and target required", 400)), 400

    file_path = os.path.join(UPLOAD_FOLDER, filename)

    if not os.path.exists(file_path):
        return jsonify(error("File not found", 404)), 404

    try:
        df = pd.read_csv(file_path)

        if target not in df.columns:
            return jsonify(error("Invalid target column", 400)), 400

        # Keep only numeric columns
        df = df.select_dtypes(include=["number"])

        drop_cols = [
            col for col in df.columns
            if "id" in col.lower()
        ]

        df = df.drop(columns=drop_cols, errors="ignore")

        X = df.drop(target, axis=1)

        # Keep only useful correlated features

        correlations = X.corrwith(df[target]).abs()

        useful_cols = correlations[correlations > 0.1].index

        X = X[useful_cols]

        y = df[target]

        y_mean = y.mean()
        y_std = y.std()

        y = (y - y_mean) / y_std

        # Early validation
        if len(X) < 5:
            return jsonify(error("Not enough data to train model", 400)), 400

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        # Scaling
        scaler = StandardScaler()
        X_train = scaler.fit_transform(X_train)
        X_test = scaler.transform(X_test)

        # Save scaler
        scaler_path = os.path.join(MODEL_FOLDER, "scaler.pkl")
        with open(scaler_path, "wb") as f:
            pickle.dump(scaler, f)

        # Linear Regression
        model = LinearRegression()
        model.fit(X_train, y_train)

        if len(X_test) > 0:
            score = model.score(X_test, y_test)
        else:
            score = 0.0

        # Neural Network
        nn_model = Sequential([
            Dense(32, activation='relu', input_shape=(X_train.shape[1],)),
            Dense(16, activation='relu'),
            Dense(1)
        ])

        nn_model.compile(optimizer='adam', loss='mse')
        nn_model.fit(X_train, y_train, epochs=20, verbose=0)

        # Evaluate NN
        nn_score = nn_model.evaluate(X_test, y_test, verbose=0)

        # Save model
        model_path = os.path.join(MODEL_FOLDER, "model.pkl")
        with open(model_path, "wb") as f:
            pickle.dump(model, f)

        logger.info("Training completed successfully")
        logger.info(f"Linear R² Score: {score:.4f}, NN Loss: {nn_score:.4f}")

        return jsonify(success({
            "linear_accuracy": score,
            "nn_loss": float(nn_score)
        }, "Models trained successfully"))

    except Exception as e:
        logger.error(f"Training error: {str(e)}")
        return jsonify(error(str(e), 500)), 500


@model_bp.route("/predict", methods=["POST"])
def predict():
    data = request.json
    input_data = data.get("input")

    if not input_data:
        return jsonify(error("Input data required", 400)), 400

    model_path = os.path.join(MODEL_FOLDER, "model.pkl")
    scaler_path = os.path.join(MODEL_FOLDER, "scaler.pkl")

    if not os.path.exists(model_path):
        return jsonify(error("Model not trained yet", 400)), 400

    if not os.path.exists(scaler_path):
        return jsonify(error("Scaler not found", 400)), 400

    try:
        # Load model and scaler
        with open(model_path, "rb") as f:
            model = pickle.load(f)

        with open(scaler_path, "rb") as f:
            scaler = pickle.load(f)

        # Convert input to DataFrame
        df = pd.DataFrame([input_data])

        # Scale input
        df_scaled = scaler.transform(df)

        # Make prediction
        prediction = model.predict(df_scaled)

        logger.info(f"Prediction made: {prediction.tolist()}")

        return jsonify(success({
            "prediction": prediction.tolist()[0]   # Return single value, not list
        }))

    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify(error(str(e), 500)), 500