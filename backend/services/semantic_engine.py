SEMANTIC_SYNONYMS = {

    "sales": [
        "revenue",
        "income",
        "earnings",
        "turnover"
    ],

    "profit": [
        "gain",
        "margin",
        "net income"
    ],

    "price": [
        "cost",
        "value",
        "amount"
    ],

    "date": [
        "time",
        "timestamp",
        "day",
        "month",
        "year"
    ],

    "region": [
        "location",
        "area",
        "zone",
        "territory"
    ]
}


def semantic_match(word, columns):

    word = word.lower()

    # direct match
    if word in columns:
        return word

    # synonym match
    for real_col in columns:

        real_lower = real_col.lower()

        for canonical, synonyms in SEMANTIC_SYNONYMS.items():

            if word == canonical or word in synonyms:

                if canonical in real_lower:
                    return real_col

    return None