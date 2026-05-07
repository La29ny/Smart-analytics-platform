import React, { useEffect, useState } from "react";

function SmartSuggestions({ filename, onSelectSuggestion }) {

    const [suggestions, setSuggestions] = useState([]);

    useEffect(() => {

        if (!filename) return;

        fetch("http://127.0.0.1:5000/suggestions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ filename })
        })
        .then(res => res.json())
        .then(data => {
            setSuggestions(data.suggestions || []);
        })
        .catch(err => {
            console.error(err);
        });

    }, [filename]);

    if (!filename || suggestions.length === 0) {
        return null;
    }

    return (
        <div className="smart-suggestions">
            <h4>✨ Smart Suggestions</h4>

            <div className="suggestion-grid">
                {suggestions.map((s, i) => (
                    <button
                        key={i}
                        className="suggestion-card"
                        onClick={() => onSelectSuggestion(s.query)}
                    >
                        {s.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default SmartSuggestions;