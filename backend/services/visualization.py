# backend/routes/visualize.py

from flask import Blueprint, request, jsonify
import pandas as pd
import os
import matplotlib.pyplot as plt
import seaborn as sns
from config import UPLOAD_FOLDER
from routes.nlp import extract_multiple_conditions, detect_columns

import matplotlib.pyplot as plt
import seaborn as sns

visualize_bp = Blueprint("visualize", __name__)

@visualize_bp.route("/visualize", methods=["POST"])
def visualize():
    data = request.json
    filename = data.get("filename")

    query = data.get("query")
    chart_type = data.get("chart_type")
    x_col = data.get("x")
    y_col = data.get("y")

    file_path = os.path.join(UPLOAD_FOLDER, filename)
    df = pd.read_csv(file_path)

    # 🔥 NLP QUERY MODE
    if query:
        text = query.lower()
        actual_columns = list(df.columns)

        # 🔥 Explicit user override first

        if "bar" in text:
            chart_type = "bar"

        elif "scatter" in text:
            chart_type = "scatter"

        elif "pie" in text:
            chart_type = "pie"

        elif "line" in text:
            chart_type = "line"

        else:
            chart_type = None

        # detect column
        cols_detected = detect_columns(
            text,
            [c.lower() for c in actual_columns]
        )

        mapped_cols = []

        for detected in cols_detected:
            for col in actual_columns:
                if col.lower() == detected:
                    mapped_cols.append(col)

        # assign intelligently
        if len(mapped_cols) >= 1:
            x_col = mapped_cols[0]

        if len(mapped_cols) >= 2:
            y_col = mapped_cols[1]

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

    # 🔥 AUTO-DETECT BEST CHART

    if not chart_type:
        chart_type = detect_best_chart(df, x_col, y_col)
    
    
    # 🔥 PREPARE DATA FOR FRONTEND CHART

    if chart_type == "histogram":
        values = pd.to_numeric(df[x_col], errors="coerce").dropna()
        return jsonify({
            "type": "histogram",
            "labels": values.tolist()
        })

    elif chart_type == "scatter":
        return jsonify({
            "type": "scatter",
            "labels": df[x_col].tolist(),
            "values": df[y_col].tolist()
        })

    elif chart_type == "bar":
        grouped = df.groupby(x_col)[y_col].mean().reset_index()
        return jsonify({
            "type": "bar",
            "labels": grouped[x_col].astype(str).tolist(),
            "values": grouped[y_col].tolist()
        })
    
    elif chart_type == "line":

        grouped = df.groupby(x_col)[y_col].mean().reset_index()

        return jsonify({
            "chartType": "line",
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
            "type": "pie",
            "labels": counts.index.astype(str).tolist(),
            "values": counts.values.tolist()
        })
    
def is_numeric(series):
    return pd.api.types.is_numeric_dtype(series)


def detect_best_chart(df, x_col=None, y_col=None):
    """
    Intelligent chart selection
    """

    # BOTH COLUMNS PROVIDED
    if x_col and y_col:

        x_numeric = is_numeric(df[x_col])
        y_numeric = is_numeric(df[y_col])

        # numeric vs numeric
        if x_numeric and y_numeric:
            return "scatter"

        # category vs numeric
        if not x_numeric and y_numeric:
            return "bar"

        # fallback
        return "bar"

    # SINGLE COLUMN
    if x_col:

        unique_count = df[x_col].nunique()

        # categorical low-cardinality
        if not is_numeric(df[x_col]):

            if unique_count <= 8:
                return "pie"

            return "bar"

        # numeric column
        return "histogram"

    return "bar"