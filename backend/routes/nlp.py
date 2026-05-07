from flask import Blueprint, request, jsonify
import os
import re
import pandas as pd
from rapidfuzz import process
from services.insight_engine import generate_suggestions

from services.semantic_engine import semantic_match

nlp_bp = Blueprint("nlp", __name__)

# Known target/column keywords for fuzzy matching
COLUMNS = ["marks", "sales", "price", "attendance", "study_hours", "area", "revenue", "profit"]

# Intent keywords
INTENTS = {
    "select_where": [
        "find", "get", "show me", "give me", "retrieve", "display",
        "list", "fetch", "pull", "show", "view"
    ],

    "filter": [
        "where", "greater", "less", "above", "below", "equal",
        "greater than", "less than", "more than", "under", "over",
        "between", "not equal", "equals", "==", ">", "<", ">=", "<="
    ],

    "aggregate": [
        "sum", "total", "average", "avg", "mean",
        "maximum", "max", "minimum", "min",
        "count", "how many", "total number"
    ],

    "predict": [
        "predict", "estimate", "forecast", "project",
        "what will be", "future value", "prediction",
        "expected", "calculate outcome"
    ],

    "train": [
        "train", "build model", "fit model", "train model",
        "learn", "train the model", "start training",
        "run training", "create model"
    ],

    "visualize": [
        "show", "plot", "graph", "visualize", "chart",
        "histogram", "scatter", "bar chart", "line chart",
        "pie chart", "draw", "display chart", "generate graph"
    ]
}


def detect_dataset_type(columns):
    """Detect dataset type and default target based on column names"""
    cols = [c.lower() for c in columns]

    if any(x in cols for x in ["marks", "study_hours", "studytime", "attendance"]):
        return "student", "marks"
    
    if any(x in cols for x in ["price", "area", "sqft", "square_feet"]):
        return "housing", "price"
    
    if any(x in cols for x in ["sales", "revenue", "profit"]):
        return "sales", "sales"
    
    # Default: last column is usually the target
    return "generic", columns[-1] if columns else None


def detect_intent(text):
    text = text.lower()

    all_keywords = []
    for intent, words in INTENTS.items():
        for w in words:
            all_keywords.append((intent, w))

    matches = []

    for intent, keyword in all_keywords:
        _, score, _ = process.extractOne(text, [keyword])
        if score > 70:
            matches.append((intent, score))

    if matches:
        return sorted(matches, key=lambda x: x[1], reverse=True)[0][0]

    return "unknown"

def detect_operation(text):
    operations = ["sum", "average", "mean", "max", "min", "total"]

    match, score, _ = process.extractOne(text, operations)

    if score > 70:
        if match in ["average", "mean"]:
            return "mean"
        if match in ["sum", "total"]:
            return "sum"
        return match

    return None

def detect_columns(text, known_columns):

    text = text.lower()

    detected = []

    words = text.split()

    # 🔥 semantic matching first
    for word in words:

        semantic = semantic_match(word, known_columns)

        if semantic:
            detected.append(semantic)
            continue

        # 🔥 fuzzy fallback
        match, score, _ = process.extractOne(word, known_columns)

        if score > 80:
            detected.append(match)

    return list(set(detected))

def extract_condition(text, columns):
    text = text.lower()

    ops = {
        ">": ">",
        "<": "<",
        "=": "==",
        "greater than": ">",
        "less than": "<",
        "above": ">",
        "below": "<",
        "equal": "=="
    }

    col_match = detect_columns(text, columns)
    column = col_match[0] if col_match else None

    operator = None
    best_op = None
    best_score = 0

    for key in ops:
        match, score, _ = process.extractOne(text, [key])
        if score > best_score:
            best_score = score
            best_op = key

    if best_score > 70:
        operator = ops[best_op]

    numbers = re.findall(r"\d+\.?\d*", text)
    value = float(numbers[0]) if numbers else None

    return column, operator, value

def extract_select_where(text, columns):
    text = text.lower()

    # Split using "where"
    if "where" not in text:
        return None, None, None, None

    parts = text.split("where")

    select_part = parts[0]
    condition_part = parts[1]

    # 🔥 target column
    target_cols = detect_columns(select_part, columns)
    target = target_cols[0] if target_cols else None

    # 🔥 condition (reuse existing logic)
    cond_col, operator, value = extract_condition(condition_part, columns)

    return target, cond_col, operator, value

def extract_multiple_conditions(text, columns):
    text = text.lower()

    conditions = []

    # Split by AND / OR
    parts = re.split(r"\band\b|\bor\b|,", text)

    for part in parts:
        col, op, val = extract_condition(part, columns)
        if col and op and val is not None:
            conditions.append((col, op, val))

    return conditions

@nlp_bp.route("/nlp", methods=["POST"])
def handle_nlp():
    data = request.json
    text = data.get("text", "").strip()
    filename = data.get("filename")  # We now expect filename from frontend

    if not filename:
        return jsonify({"error": "Filename is required"}), 400

    if not text:
        return jsonify({"error": "Text input is required"}), 400

    try:
        # Load the actual dataset to get real columns
        upload_folder = os.getenv("UPLOAD_FOLDER", "uploads")
        file_path = os.path.join(upload_folder, filename)
        
        if not os.path.exists(file_path):
            return jsonify({"error": "Dataset file not found"}), 404

        df = pd.read_csv(file_path)
        actual_columns = list(df.columns)

        # Detect dataset type and default target
        dataset_type, default_target = detect_dataset_type(actual_columns)

        # Detect intent
        intent = detect_intent(text)

        # 🔥 Override intent if "where" present
        where_match, score, _ = process.extractOne(text, ["where"])

        if score > 70:
            intent = "select_where"
        operation = detect_operation(text)

        # Detect columns mentioned by user (fuzzy matching)
        columns_detected = detect_columns(text, [c.lower() for c in actual_columns])

        # If no columns detected from text, fall back to default target
        if not columns_detected and default_target:
            columns_detected = [default_target]

        # 🔥 NEW: Handle aggregation
        if intent == "aggregate" and columns_detected:
            col = columns_detected[0]

            if col not in df.columns:
                return jsonify({"error": "Column not found"}), 400

            try:
                series = pd.to_numeric(df[col], errors="coerce")

                if operation == "sum":
                    result = series.sum()
                elif operation == "mean":
                    result = series.mean()
                elif operation == "max":
                    result = series.max()
                elif operation == "min":
                    result = series.min()
                else:
                    return jsonify({"error": "Invalid operation"}), 400

                return jsonify({
                    "intent": "aggregate",
                    "operation": operation,
                    "column": col,
                    "result": float(result)
                })

            except Exception as e:
                return jsonify({"error": str(e)}), 500
            
        # 🔥 NEW: Handle filtering
        if intent == "filter":
            column, operator, value = extract_condition(text, actual_columns)

            if not column or not operator or value is None:
                return jsonify({"error": "Could not understand filter condition"}), 400

            try:
                series = pd.to_numeric(df[column], errors="coerce")

                if operator == ">":
                    filtered = df[series > value]
                elif operator == "<":
                    filtered = df[series < value]
                elif operator == "==":
                    filtered = df[series == value]
                else:
                    return jsonify({"error": "Invalid operator"}), 400

                return jsonify({
                    "intent": "filter",
                    "column": column,
                    "operator": operator,
                    "value": value,
                    "rows": filtered.head(50).to_dict(orient="records")  # limit results
                })

            except Exception as e:
                return jsonify({"error": str(e)}), 500


        # 🔥 NEW: Handle SELECT + WHERE
        if intent == "select_where":
            # 🔥 detect SELECT ALL
            if any(word in text.lower() for word in ["select *", "find all", "show all", "everything"]):
                target = "__all__"
            else:
                target_cols = detect_columns(text, [c.lower() for c in actual_columns])

                target = None
                if target_cols:
                    for col in actual_columns:
                        if col.lower() == target_cols[0]:
                            target = col
                            break

                if not target:
                    target = actual_columns[0]

            # 🔥 Extract only condition part after "where"
            if "where" in text.lower():
                condition_text = text.lower().split("where", 1)[1]
            else:
                condition_text = text.lower()

            conditions = extract_multiple_conditions(condition_text, [c.lower() for c in actual_columns])

            if not conditions:
                return jsonify({"error": "Could not understand conditions"}), 400

            filtered = df.copy()

            for column, operator, value in conditions:
                # map back to actual column
                real_col = None
                for col in actual_columns:
                    if col.lower() == column:
                        real_col = col
                        break

                if not real_col:
                    continue

                series = pd.to_numeric(filtered[real_col], errors="coerce")

                if operator == ">":
                    filtered = filtered[series > value]
                elif operator == "<":
                    filtered = filtered[series < value]
                elif operator == "==":
                    filtered = filtered[series == value]

            result = filtered.head(50)

            # 🔥 SELECT * support
            if target == "__all__":
                result = result
            else:
                result = result

            return jsonify({
                "intent": "select_where",
                "target": target,
                "conditions": conditions,
                "rows": result.to_dict(orient="records")
            })

        return jsonify({
            "intent": intent,
            "columns": columns_detected,
            "dataset_type": dataset_type,
            "target": columns_detected[0] if columns_detected else default_target,
            "all_columns": actual_columns,
            "message": f"Understood as {intent} on {dataset_type} dataset"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@nlp_bp.route("/suggestions", methods=["POST"])
def get_suggestions():
    data = request.json
    filename = data.get("filename")

    if not filename:
        return jsonify({"error": "Filename required"}), 400

    try:
        upload_folder = os.getenv("UPLOAD_FOLDER", "uploads")
        file_path = os.path.join(upload_folder, filename)

        df = pd.read_csv(file_path)

        suggestions = generate_suggestions(df)

        return jsonify({
            "suggestions": suggestions
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500