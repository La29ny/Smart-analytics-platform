import pandas as pd


def detect_column_types(df):
    numeric_cols = []
    categorical_cols = []

    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            numeric_cols.append(col)
        else:
            categorical_cols.append(col)

    return numeric_cols, categorical_cols


def generate_suggestions(df):
    numeric_cols, categorical_cols = detect_column_types(df)

    suggestions = []

    # 📊 Visualization suggestions
    if len(numeric_cols) >= 1:
        suggestions.append({
            "type": "chart",
            "label": f"Plot distribution of {numeric_cols[0]}",
            "query": f"plot histogram of {numeric_cols[0]}"
        })

    if len(categorical_cols) >= 1 and len(numeric_cols) >= 1:
        suggestions.append({
            "type": "chart",
            "label": f"Compare {numeric_cols[0]} by {categorical_cols[0]}",
            "query": f"plot bar chart of {categorical_cols[0]} vs {numeric_cols[0]}"
        })

    # 🧠 ML suggestion
    if len(numeric_cols) >= 2:
        target = numeric_cols[-1]

        suggestions.append({
            "type": "train",
            "label": f"Train prediction model for {target}",
            "query": f"predict {target}"
        })

    # 🔍 Analysis suggestion
    if len(numeric_cols) >= 1:
        suggestions.append({
            "type": "analysis",
            "label": f"Find high values in {numeric_cols[0]}",
            "query": f"find all where {numeric_cols[0]} > average"
        })

    return suggestions