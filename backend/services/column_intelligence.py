import pandas as pd


def detect_semantic_type(col_name, series):
    name = col_name.lower()

    # 🔥 semantic keyword detection

    if "date" in name or "time" in name:
        return "date"

    if "price" in name or "revenue" in name or "sales" in name:
        return "currency"

    if "id" in name:
        return "identifier"

    if "percent" in name or "%" in name:
        return "percentage"

    if pd.api.types.is_numeric_dtype(series):
        return "numeric"

    return "categorical"


def profile_column(df, column):
    series = df[column]

    semantic_type = detect_semantic_type(column, series)

    profile = {
        "name": column,
        "dtype": str(series.dtype),
        "semantic_type": semantic_type,
        "missing": int(series.isna().sum()),
        "unique_values": int(series.nunique()),
        "is_numeric": bool(pd.api.types.is_numeric_dtype(series)),
        "profile_completeness": round(
            (1 - (series.isna().sum() / len(series))) * 100,
            2
        ),

        "sample_values": series.dropna().astype(str).head(3).tolist()
    }

    # 🔥 numeric stats
    if profile["is_numeric"]:
        profile["min"] = float(series.min())
        profile["max"] = float(series.max())
        profile["mean"] = float(series.mean())

    return profile


def generate_column_profiles(df):
    profiles = {}

    for col in df.columns:
        profiles[col] = profile_column(df, col)

    return profiles

def generate_dataset_profile(df):

    total_cells = df.shape[0] * df.shape[1]

    missing_cells = int(df.isna().sum().sum())

    duplicate_rows = int(df.duplicated().sum())

    return {
        "rows": int(df.shape[0]),
        "columns": int(df.shape[1]),
        "missing_cells": missing_cells,
        "duplicate_rows": duplicate_rows,
        "completeness": round(
            (1 - (missing_cells / total_cells)) * 100,
            2
        )
    }

def generate_auto_insights(df):

    insights = []

    # 🔥 Missing values
    missing = df.isna().sum()

    for col, val in missing.items():

        pct = (val / len(df)) * 100

        if pct > 20:
            insights.append({
                "type": "warning",
                "message": f"{col} has {pct:.1f}% missing values"
            })

    # 🔥 Duplicates
    dupes = int(df.duplicated().sum())

    if dupes > 0:
        insights.append({
            "type": "warning",
            "message": f"{dupes} duplicate rows detected"
        })

    # 🔥 Correlations
    numeric_df = df.select_dtypes(include="number")

    if numeric_df.shape[1] >= 2:

        corr = numeric_df.corr()

        for c1 in corr.columns:
            for c2 in corr.columns:

                if c1 == c2:
                    continue

                value = corr.loc[c1, c2]

                if abs(value) > 0.75:

                    insights.append({
                        "type": "insight",
                        "message":
                            f"{c1} strongly correlates with {c2} ({value:.2f})"
                    })

                    break

    # 🔥 Outliers
    for col in numeric_df.columns:

        series = numeric_df[col]

        q1 = series.quantile(0.25)
        q3 = series.quantile(0.75)

        iqr = q3 - q1

        outliers = series[
            (series < q1 - 1.5 * iqr) |
            (series > q3 + 1.5 * iqr)
        ]

        if len(outliers) > 0:

            insights.append({
                "type": "alert",
                "message":
                    f"{len(outliers)} potential outliers detected in {col}"
            })

    return insights[:8]