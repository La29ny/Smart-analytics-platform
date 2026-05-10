import React, { useState, useEffect } from "react";
import { predict } from "../services/api";

function Predict({ filename, datasetInfo = {} }) {
  const [allColumns, setAllColumns] = useState([]);
  const [selectedCols, setSelectedCols] = useState([]);
  const [numInputs, setNumInputs] = useState(1);
  const [inputValues, setInputValues] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nlpText, setNlpText] = useState("");
  const [nlpResult, setNlpResult] = useState("");

  const targetName = datasetInfo.target || "Target";

  // Fetch columns
  useEffect(() => {
    if (!filename) return;

    fetch(`http://127.0.0.1:5000/preview?filename=${filename}`)
      .then(res => res.json())
      .then(data => {
        const cols = data.data?.columns || [];
        const features = cols.slice(0, -1); // remove target
        setAllColumns(features);
      });
  }, [filename]);

  // Handle dropdown change
  const handleColumnChange = (index, value) => {
    const updated = [...selectedCols];
    updated[index] = value;
    setSelectedCols(updated);
  };

  // Handle input change
  const handleInputChange = (col, value) => {
    setInputValues({ ...inputValues, [col]: value });
  };

  // Predict
  const handlePredict = async () => {

    if (!allColumns.length) {
      alert("⚠️ Please train the model first");
      return;
    }

    setLoading(true);

    // Build full input object (VERY IMPORTANT)
    const fullInput = {};
    allColumns.forEach(col => {
      fullInput[col] = Number(inputValues[col] || 0);
    });

    const res = await predict(fullInput);

    if (res.status === "error") {
      setResult(null);
      alert(res.message || "Model not trained yet");
    } else {
      setResult(res.data?.prediction ?? null);
    }
    setLoading(false);
  };

  // NLP (sum / avg)
  const handleNLP = async () => {
    const res = await fetch("http://127.0.0.1:5000/nlp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: nlpText, filename })
    });

    const data = await res.json();

    if (data.intent === "aggregate") {
      setNlpResult(
        `📊 ${data.operation.toUpperCase()} of ${data.column} = ${data.result.toFixed(2)}`
      );
    } 
    else {
      setNlpResult("Unsupported query");
    }
  };

  return (
    <div>

      {/* 🔥 SELECT NUMBER OF INPUTS */}
      <div className="form-group">
        <label>Number of Inputs</label>
        <select
          className="form-input"
          value={numInputs}
          onChange={(e) => setNumInputs(Number(e.target.value))}
        >
          {allColumns.map((_, i) => (
            <option key={i} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>
      </div>

      {/* 🔥 COLUMN SELECTION */}
      {Array.from({ length: numInputs }).map((_, i) => (
        <div key={i} className="form-group">
          <label>Select Column {i + 1}</label>
          <select
            className="form-input"
            onChange={(e) => handleColumnChange(i, e.target.value)}
          >
            <option value="">-- Select --</option>
            {allColumns.map(col => (
              <option key={col}>{col}</option>
            ))}
          </select>
        </div>
      ))}

      {/* 🔥 INPUT FIELDS */}
      {selectedCols.map(col => (
        col && (
          <div key={col} className="form-group">
            <label>{col}</label>
            <input
              type="number"
              className="form-input"
              placeholder={`Enter ${col}`}
              onChange={(e) => handleInputChange(col, e.target.value)}
            />
          </div>
        )
      ))}

      {/* 🔥 PREDICT BUTTON */}
      <button className="btn-primary" onClick={handlePredict}>
        {loading ? "⏳ Predicting..." : `🎯 Predict ${targetName}`}
      </button>

      {/* 🔥 RESULT */}
      {result !== null && result !== undefined && (
        <div className="result-card">
          <h3>Predicted {targetName}</h3>
          <div className="result-value">
            {typeof result === "number"
              ? result.toFixed(2)
              : "Invalid prediction"}
          </div>
        </div>
      )}

      {/* 🔥 NLP SECTION */}
      <div style={{ marginTop: "30px" }}>
        <h3>📊 Quick Analysis</h3>

        <input
          className="form-input"
          placeholder="e.g. average price, sum marks"
          value={nlpText}
          onChange={(e) => setNlpText(e.target.value)}
        />

        <button className="btn-primary" onClick={handleNLP}>
          Run Query
        </button>

        {nlpResult && <p>{nlpResult}</p>}
      </div>

    </div>
  );
}

export default Predict;