import React, { useState, useEffect } from "react";
import SmartSuggestions from "./SmartSuggestions";

function NLPInput({
  filename,
  onTrain,
  dashboardMode,
  onResponse,
  lastResult,

  dashboardWidgets = [],
  setDashboardWidgets,

  charts = []
}) {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detectedTarget, setDetectedTarget] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [highlightCol, setHighlightCol] = useState(null);
  const [filters, setFilters] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    column: null,
    direction: "asc"
  });

  const [height, setHeight] = useState(250);
  const [toast, setToast] = useState("");

  const startResize = (e) => {
    const startY = e.clientY;
    const startHeight = height;

    const onMove = (eMove) => {
      const newHeight = startHeight - (eMove.clientY - startY);

      setHeight(Math.max(150, Math.min(600, newHeight)));
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // 🔥 Dynamic examples
  const getDynamicExamples = (target) => [
    `Predict ${target}`,
    `Average ${target}`,
    `Sum ${target}`,
    "Show correlation",
    "Train model",
    "Data summary"
  ];

  const target = detectedTarget || "value";
  const EXAMPLES = getDynamicExamples(target);

  const handleNLP = async () => {
    if (!filename) {

      setToast(
        "⚠️ Please upload a dataset before using AI/NLP commands"
      );

      return;
    }
    if (!text.trim()) return;

    onResponse?.({
      role: "user",
      text
    });

    try {
      setLoading(true);
      await new Promise(resolve =>
        setTimeout(resolve, 500)
      );
      
      const lower = text.toLowerCase().trim();

      const chartKeywords = [
        "chart",
        "plot",
        "graph",
        "histogram",
        "scatter",
        "line",
        "bar",
        "pie",
        "visualize"
      ];

      const wantsChart =
        chartKeywords.some(k =>
          lower.includes(k)
        );

        
      if (wantsChart) {

        

        try {

          const words = lower.split(" ");

          let chartType = "histogram";

          if (lower.includes("scatter")) {
            chartType = "scatter";
          }

          else if (
            lower.includes("line")
          ) {
            chartType = "line";
          }

          else if (
            lower.includes("pie")
          ) {
            chartType = "pie";
          }

          else if (lower.includes("histogram")) {
            chartType = "histogram";
          }

          else if (lower.includes("bar")) {
            chartType = "bar";
          }

          const numericOnlyCharts = ["pie", "bar"];

          if (
            numericOnlyCharts.includes(chartType) &&
            !lower.includes("vs")
          ) {

            onResponse?.({
              role: "system",
              type: "text",
              text:
                `⚠️ ${chartType.toUpperCase()} charts require two columns.\nTry:\n"bar chart of area vs bedrooms"`
            });

            setTimeout(() => {
              setLoading(false);
            }, 10);

            return;
          }

          if (
            chartType === "bar" &&
            !lower.includes("vs")
          ) {
            chartType = "histogram";
          }

          const normalizeColumn = (col) => {

            if (!col) return col;

            if (col.endsWith("room")) {
              return col + "s";
            }

            return col;
          };


          const vsIndex =
            words.indexOf("vs");

          let x = null;
          let y = null;

          if (vsIndex !== -1) {

            x = normalizeColumn(
              words[vsIndex - 1]
            );

            y = normalizeColumn(
              words[vsIndex + 1]
            );
          }

          else {

            const ofIndex =
              words.indexOf("of");

            if (ofIndex !== -1) {
              x = normalizeColumn(
                words[ofIndex + 1]
              );
            }
          }

          if (!x) {

            onResponse?.({
              role: "system",
              type: "text",
              text:
                "⚠️ Could not detect chart columns"
            });

            setLoading(false);

            return;
          }

          // 🔥 detect where filters
          let filter = null;

          const whereMatch = lower.match(
            /where\s+(\w+)\s*(>|<|=)\s*(\d+)/i
          );

          if (whereMatch) {

            filter = {
              column: whereMatch[1],
              operator: whereMatch[2],
              value: Number(whereMatch[3])
            };
          }

          const res = await fetch(
            "http://127.0.0.1:5000/visualize",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                filename,
                chart_type: chartType,
                x,
                y
              })
            }
          );

          const chartData =
            await res.json();

          onResponse?.({
            role: "system",
            type: "chart",

            text:
              `📊 ${chartType.toUpperCase()} chart generated for ${x}${y ? ` vs ${y}` : ""}`,

            data: chartData,

            context: {
              lastChartType:
                chartType,

              lastColumns:
                [x, y].filter(Boolean)
            }
          });

          setLoading(false);

          return;

        } catch (err) {

          console.error(err);

          onResponse?.({
            role: "system",
            type: "text",

            text:
              "❌ Failed to generate chart"
          });

          setLoading(false);

          return;
        }
      }

      if (lower.includes("compare")) {
        onResponse?.({
          role: "system",
          type: "action",
          action: "compare_previous"
        });
        return;
      }

      const res = await fetch("http://127.0.0.1:5000/nlp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, filename })
      });

      const data = await res.json();
      setLoading(false);

      if (data.intent === "select_where") {

        setHighlightCol(data.target);

        const response = {
          role: "system",
          type: "table",
          text: `🔎 ${data.target}`,
          data: data.rows || [],

          context: {
            lastQuery: text,
            lastFilters: data.conditions || [],
            lastColumns: [data.target]
          }
        };

        onResponse?.(response);

        
      }

      else if (data.intent === "aggregate") {
        
        onResponse?.({
          role: "system",
          type: "text",
          text: `📊 ${data.operation.toUpperCase()} of ${data.column} = ${data.result.toFixed(2)}`
        });
      }

      else if (data.intent === "train" || data.intent === "predict") {
        
        const targetCol = data.target;
        setDetectedTarget(targetCol);
        onResponse?.({
          role: "system",
          type: "text",
          text: `Intent: ${data.intent} → Target: ${targetCol} (${data.dataset_type} dataset)`
        });
        if (onTrain) onTrain(targetCol);
      }

      else if (data.intent === "filter") {
        
        onResponse?.({
          role: "system",
          type: "text",
          text: `🔎 Showing results for: ${data.column} ${data.operator} ${data.value}`
        });
      }

      else {
        
        onResponse?.({
          role: "system",
          type: "text",
          text: "Unsupported action. Try: 'predict marks', 'sum marks', or 'find marks where study_hours > 2'"
        });
      }

    } catch (err) {
      console.error(err);
      setLoading(false);
      
      setToast("NLP request failed");
    }
  };

  const handleCellChange = (rowIndex, col, value) => {
    const updated = [...tableData];
    updated[rowIndex][col] = value;
    setTableData(updated);
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleNLP();
  };

  // 🔥 FIXED: Sorting Function
  const handleSortMenu = (col, forcedDirection = null) => {
    let direction = forcedDirection || "asc";

    if (!forcedDirection) {
      if (sortConfig.column === col && sortConfig.direction === "asc") {
        direction = "desc";
      }
    }

    setSortConfig({ column: col, direction });

    const sorted = [...tableData].sort((a, b) => {
      let valA = a[col];
      let valB = b[col];

      // Convert to number if possible
      const numA = parseFloat(valA);
      const numB = parseFloat(valB);

      if (!isNaN(numA) && !isNaN(numB)) {
        valA = numA;
        valB = numB;
      } else {
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
      }

      if (valA < valB) return direction === "asc" ? -1 : 1;
      if (valA > valB) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setTableData(sorted);
  };

  // 🔥 Filter Function
  const applyFilters = () => {
    let filtered = [...tableData];

    filters.forEach((f) => {
      filtered = filtered.filter((row) => {
        const val = parseFloat(row[f.col]);
        const target = parseFloat(f.val);
        if (isNaN(val) || isNaN(target)) return true;

        if (f.op === ">") return val > target;
        if (f.op === "<") return val < target;
        if (f.op === "=") return val === target;
        return true;
      });
    });

    setTableData(filtered);
  };

  // 🔥 Column Context Menu
  const openColumnMenu = (col) => {
    const action = prompt(`Column: ${col}\n1. Sort Asc\n2. Sort Desc\n3. Filter`);

    if (action === "1") {
      handleSortMenu(col, "asc");
    }
    if (action === "2") {
      handleSortMenu(col, "desc");
    }
    if (action === "3") {
      const val = prompt("Enter filter value:");
      if (val) {
        setFilters([...filters, { col, op: ">", val }]);
      }
    }
  };

  const addRow = () => {
    if (!tableData.length) return;

    const emptyRow = {};
    Object.keys(tableData[0]).forEach(col => {
      emptyRow[col] = "";
    });

    setTableData(prev => [...prev, emptyRow]);
  };

  const saveData = async () => {
    try {
      await fetch("http://127.0.0.1:5000/update-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          filename,
          data: tableData   // ✅ correct state
        })
      });

      setToast("Saved successfully");

    } catch (err) {
      console.error(err);
      setToast("Save failed");
    }
  };

  // Local Storage Persistence
  useEffect(() => {
  const saved = localStorage.getItem("nlp_state");

  if (saved && filename) {
    const parsed = JSON.parse(saved);
    setText(parsed.text || "");
  }
}, [filename]);

  
  useEffect(() => {
    localStorage.setItem(
      "nlp_state",
      JSON.stringify({ text })
    );
  }, [text, result, tableData]);

  useEffect(() => {
    if (!filename) {
      localStorage.removeItem("nlp_state");
    }
  }, [filename]);

  useEffect(() => {
    if (toast) {
      setTimeout(() => setToast(""), 2000);
    }
  }, [toast]);

  // ====================== JSX ======================

  // const tableJSX = tableData.length > 0 && (
  //   <div className="resizable-wrapper" style={{ marginTop: 16 }}>
  //     <div
  //       className="resize-handle-top"
  //       onMouseDown={startResize}
  //     />
  //     <div
  //       className="nlp-table resizable-box"
  //       style={{ height }}
  //     >
  //       <div style={{ marginBottom: 10 }}>
  //         <button onClick={addRow}>➕ Add Row</button>

  //         <button onClick={saveData} style={{ marginLeft: 10 }}>
  //           💾 Save
  //         </button>
  //       </div>
  //     <table className="preview-table">
  //       <thead>
  //         <tr>
  //           {Object.keys(tableData[0]).map((col) => (
  //             <th
  //               key={col}
  //               className={`sortable-header ${(col || "").toLowerCase() === (highlightCol || "") ? "highlight-header" : ""}`}

  //               onClick={() => handleSortMenu(col)}

  //               onContextMenu={(e) => {
  //                 e.preventDefault();
  //                 openColumnMenu(col);
  //               }}
  //             >
  //               {col} {sortConfig.column === col
  //                 ? (sortConfig.direction === "asc" ? "▲" : "▼")
  //                 : "⬍"}
  //             </th>
  //           ))}
  //         </tr>
  //       </thead>
  //       <tbody>
  //         {tableData.map((row, i) => (
  //           <tr key={i}>
  //             {Object.keys(row).map((col) => (
  //               <td
  //                 key={col}
  //                 className={(col || "").toLowerCase() === (highlightCol || "") ? "highlight-cell" : ""}
  //               >
  //                 <input
  //                   value={row[col] || ""}
  //                   onChange={(e) => handleCellChange(i, col, e.target.value)}
  //                   style={{
  //                     width: "100%",
  //                     background: "transparent",
  //                     border: "none",
  //                     color: "white",
  //                     outline: "none"
  //                   }}
  //                 />
  //               </td>
  //             ))}
  //           </tr>
  //         ))}
  //       </tbody>
  //     </table>
  //   </div>
  //   </div>    
  // );

  // 🔥 DASHBOARD VERSION
  if (dashboardMode) {
    return (
      <div className="ai-assistant-card">

        {toast && (
          <div className="toast">
            {toast}
          </div>
        )}
        <div className="ai-assistant-inner">
          <div className="ai-assistant-left">
            <h3>✨ AI Assistant</h3>
            <p>Natural language interface for data analysis</p>

            <div className="ai-input-row">
              <input
                className="ai-input"
                placeholder='Try: "predict marks", "average marks", or "find marks where study_hours > 2"'
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKey}
              />
              <button className="btn-send" onClick={handleNLP} disabled={loading}>
                {loading ? "⏳" : "➤"}
              </button>
            </div>

            <div className="ai-chip-row">
              <SmartSuggestions
                filename={filename}
                onSelectSuggestion={(query) => setText(query)}
            />
              {EXAMPLES.map((ex) => (
                <button key={ex} className="ai-chip" onClick={() => setText(ex)}>
                  {ex}
                </button>
              ))}

              <button
                className="ai-chip"
                onClick={() =>
                  setText("Build a sales dashboard")
                }
              >
                📊 Sales Dashboard
              </button>

              <button
                className="ai-chip"
                onClick={() =>
                  setText("Create performance workspace")
                }
              >
                🚀 Performance Workspace
              </button>

              <button
                className="ai-chip"
                onClick={() => setText("find marks where study_hours > 2")}
              >
                find marks where study_hours greater then 2
              </button>
            </div>

            {/* {result && <div className="nlp-result">{result}</div>} */}
            {/* {tableJSX} */}
          </div>
        </div>
      </div>
    );
  }

  // 🔥 STANDALONE VERSION
  return (
    <div>

      {loading && (
        <div className="training-overlay">

          <div className="training-modal">

            <div className="training-spinner"></div>

            <h2>Training AI Models...</h2>

            <p>
              Analyzing dataset patterns and
              optimizing machine learning models
            </p>

          </div>

        </div>
      )}
      {toast && (
        <div className="toast">
          {toast}
        </div>
      )}
      <div className="form-group">
        <label>Natural Language Command</label>
        <input
          className="form-input"
          placeholder='e.g. "predict marks", "average price", or "find marks where study_hours > 2"'
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
        />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {EXAMPLES.map((ex) => (
          <button key={ex} className="ai-chip" onClick={() => setText(ex)} style={{ borderRadius: 20 }}>
            {ex}
          </button>
        ))}
        <button
          className="ai-chip"
          onClick={() => setText("find marks where study_hours > 2")}
          style={{ borderRadius: 20 }}
        >
          find marks where study_hours > 2
        </button>
      </div>

      <button
        className="btn-primary"
        onClick={handleNLP}
        disabled={loading || !text.trim()}
      >
        {loading ? "⏳ Processing..." : "✨ Run NLP Command"}
      </button>

      {result && <div className="nlp-result" style={{ marginTop: 16 }}>{result}</div>}

      {/* Filter Bar */}
      {tableData.length > 0 && (
        <div className="filter-bar" style={{ margin: "12px 0" }}>
          <select
            onChange={(e) => {
              if (e.target.value) {
                setFilters([...filters, { col: e.target.value, op: ">", val: "" }]);
              }
            }}
          >
            <option value="">Add Filter...</option>
            {Object.keys(tableData[0] || {}).map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>

          <button onClick={applyFilters} style={{ marginLeft: 10 }}>
            Apply Filters
          </button>

          {filters.length > 0 && (
            <button onClick={() => setFilters([])} style={{ marginLeft: 8 }}>
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* {tableJSX} */}
    </div>
  );
}

export default NLPInput;