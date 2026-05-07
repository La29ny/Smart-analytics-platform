from flask import Blueprint
import time
import platform
import os
from config import MODEL_FOLDER

main = Blueprint("main", __name__)

START_TIME = time.time()


@main.route("/")
def health():
    uptime = round(time.time() - START_TIME, 2)

    return {
        "system": {
            "python_version": platform.python_version(),
            "platform": platform.system()
        },
        "status": "OK",
        "service": "Smart Analytics Backend 🚀",
        "version": "1.0.0",
        "uptime": f"{uptime} seconds",
        "features": [
            "CSV Upload",
            "Data Preview",
            "Dynamic Visualization",
            "Machine Learning",
            "Neural Networks",
            "NLP Interface"
        ]
    }


@main.route("/system-status")
def system_status():
    """Dynamic system status with model training check"""
    model_path = os.path.join(MODEL_FOLDER, "model.pkl")
    model_exists = os.path.exists(model_path)

    return {
        "status": "running",
        "models_trained": model_exists,
        "modules": {
            "upload": True,
            "preview": True,
            "model": True,
            "nlp": True,
            "visualization": True
        }
    }


@main.route("/docs")
def docs():
    return {
        "endpoints": {
            "/upload": "Upload CSV",
            "/preview": "Preview dataset",
            "/visualize": "Generate charts",
            "/train": "Train models",
            "/predict": "Run prediction",
            "/nlp": "Natural language processing",
            "/system-status": "System health",
        }
    }