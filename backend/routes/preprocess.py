# backend/routes/preprocess.py

from flask import Blueprint, request, jsonify
from services.column_intelligence import generate_column_profiles
import pandas as pd
import os
from config import UPLOAD_FOLDER
from utils.response import error
from utils.response import success

from services.column_intelligence import (
    generate_column_profiles,
    generate_dataset_profile,
    generate_auto_insights
)

from services.column_intelligence import (
    generate_column_profiles,
    generate_dataset_profile
)

preprocess_bp = Blueprint("preprocess", __name__)

@preprocess_bp.route("/preview", methods=["GET"])
def preview_data():
    filename = request.args.get("filename")

    if not filename:
        return jsonify({"error": "Filename is required"}), 400

    file_path = os.path.join(UPLOAD_FOLDER, filename)

    if not os.path.exists(file_path):
        return jsonify(error("File not found", 404)), 404

    try:
        df = pd.read_csv(file_path)

        column_profiles = generate_column_profiles(df)

        dataset_profile = generate_dataset_profile(df)

        auto_insights = generate_auto_insights(df)

        preview = df.head(100).to_dict(orient="records")

        return jsonify(success({
            "columns": list(df.columns[:100]),
            "preview": preview,
            "rows": len(df),
            "column_profiles": column_profiles,
            "dataset_profile": dataset_profile,
            "auto_insights": auto_insights
            
        }))

    except Exception as e:
        return jsonify({"error": str(e)}), 500