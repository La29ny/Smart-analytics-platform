from flask import Blueprint, request, jsonify
from config import UPLOAD_FOLDER
import pandas as pd
import os
from config import UPLOAD_FOLDER 

data_edit_bp = Blueprint("data_edit", __name__)

@data_edit_bp.route("/update-data", methods=["POST"])
def update_data():
    
    data = request.json
    filename = data.get("filename")
    rows = data.get("data")

    if not filename or rows is None:
        return jsonify({"error": "Invalid request"}), 400

    try:
        
        file_path = os.path.abspath(os.path.join(UPLOAD_FOLDER, filename))

        os.makedirs(UPLOAD_FOLDER, exist_ok=True)

        print("Saving to:", file_path)
        print("Exists before save:", os.path.exists(file_path))

        print("Saving to:", file_path)

        df = pd.DataFrame(rows).apply(pd.to_numeric, errors="ignore")

        df.to_csv(file_path, index=False)

        return jsonify({"message": "Data updated successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500