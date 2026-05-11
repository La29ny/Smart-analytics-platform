# backend/routes/visualize.py

from flask import Blueprint, request, jsonify
import pandas as pd
import os
import matplotlib.pyplot as plt
import seaborn as sns
from config import UPLOAD_FOLDER
from routes.nlp import extract_multiple_conditions, detect_columns



visualize_bp = Blueprint("visualize", __name__)

@visualize_bp.route("/visualize", methods=["POST"])
def visualize():
    data = request.json
    filename = data.get("filename")

    query = data.get("query")
    chart_type = data.get("chart_type")
    x_col = data.get("x")
    y_col = data.get("y")

    filter_data = data.get("filter")

    file_path = os.path.join(UPLOAD_FOLDER, filename)
    df = pd.read_csv(file_path)

    # 🔥 NLP QUERY MODE
    if query:
        text = query.lower()
        actual_columns = list(df.columns)

        # detect chart type
        if "bar" in text:
            chart_type = "bar"
        elif "scatter" in text:
            chart_type = "scatter"
        elif "pie" in text:
            chart_type = "pie"
        else:
            chart_type = "histogram"

        # detect column
        cols_detected = detect_columns(text, [c.lower() for c in actual_columns])

        if cols_detected:
            for col in actual_columns:
                if col.lower() == cols_detected[0]:
                    x_col = col
                    break

        # 🔥 apply conditions using YOUR NLP logic
        if "where" in text:
            condition_text = text.split("where", 1)[1]
            conditions = extract_multiple_conditions(condition_text, [c.lower() for c in actual_columns])

            for column, operator, value in conditions:
                real_col = None
                for col in actual_columns:
                    if col.lower() == column:
                        real_col = col
                        break

                if not real_col:
                    continue

                series = pd.to_numeric(df[real_col], errors="coerce")

                if operator == ">":
                    df = df[series > value]
                elif operator == "<":
                    df = df[series < value]
                elif operator == "==":
                    df = df[series == value]    


    # 🔥 apply frontend filter
    if filter_data:

        column = filter_data.get("column")
        operator = filter_data.get("operator")
        value = filter_data.get("value")

        if column in df.columns:

            series = pd.to_numeric(
                df[column],
                errors="coerce"
            )

            if operator == ">":
                df = df[series > value]

            elif operator == "<":
                df = df[series < value]

            elif operator == "=":
                df = df[series == value]

    # 🔥 PREPARE DATA FOR FRONTEND CHART


   
    if chart_type == "histogram":
        values = pd.to_numeric(df[x_col], errors="coerce").dropna()

        return jsonify({
            "chartType": "bar",
            "labels": [str(v) for v in values.index.tolist()],
            "datasets": [
                {
                    "label": x_col,
                    "data": values.tolist()
                }
            ]
        })

    elif chart_type == "scatter":
        return jsonify({
            "chartType": "scatter",
            "datasets": [
                {
                    "label": f"{y_col} vs {x_col}",
                    "data": [
                        {
                            "x": float(x),
                            "y": float(y)
                        }
                        for x, y in zip(
                            pd.to_numeric(df[x_col], errors="coerce"),
                            pd.to_numeric(df[y_col], errors="coerce")
                        )
                        if pd.notnull(x) and pd.notnull(y)
                    ]
                }
            ]
        })

    elif chart_type == "bar":
        grouped = df.groupby(x_col)[y_col].mean().reset_index()

        return jsonify({
            "chartType": "bar",
            "labels": grouped[x_col].astype(str).tolist(),
            "datasets": [
                {
                    "label": y_col,
                    "data": grouped[y_col].tolist() 
                }
            ]
        })

    elif chart_type == "pie":
        counts = df[x_col].value_counts()

        return jsonify({
            "chartType": "pie",
            "labels": counts.index.astype(str).tolist(),
            "datasets": [
                {
                    "label": x_col,
                    "data": counts.values.tolist()
                }
            ]
        })

    return jsonify({
        "error": "Unsupported chart type"
    }), 400