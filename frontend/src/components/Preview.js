import React, { useEffect, useState } from "react";
import { previewFile } from "../services/api";


const getColumnLabel = (index) => {
  let label = "";
  while (index >= 0) {
    label = String.fromCharCode((index % 26) + 65) + label;
    index = Math.floor(index / 26) - 1;
  }
  return label;
};



function Preview({ filename, inline = false }) {
  const [sortConfig, setSortConfig] = useState({
    column: null,
    direction: "asc"
  });
  const [allData, setAllData] = useState([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [selectedRow, setSelectedRow] = useState(null);

  const [showInsertMenu, setShowInsertMenu] = useState(false);

  const [toast, setToast] = useState("");

  const [columnProfiles, setColumnProfiles] = useState({});

  const [datasetProfile, setDatasetProfile] = useState(null);

  const [autoInsights, setAutoInsights] = useState([]);
  
  const handleCellChange = (rowIndex, col, value) => {
    const updated = [...allData];

    // 🔥 detect formula
    if (value.startsWith("=")) {
      updated[rowIndex][col] = evaluateFormula(value);
    } else {
      updated[rowIndex][col] = value;
    }

    setAllData(updated);
  };

  const evaluateFormula = (formula) => {
    try {
      const match = formula.match(/^=(SUM|AVG|MAX|MIN)\((.+)\)$/i);
      if (!match) return formula;

      const operation = match[1].toUpperCase();
      const column = match[2].trim();

      const values = allData
        .map(row => Number(row[column]))
        .filter(v => !isNaN(v));

      if (!values.length) return "0";

      switch (operation) {
        case "SUM":
          return values.reduce((a, b) => a + b, 0);
        case "AVG":
          return values.reduce((a, b) => a + b, 0) / values.length;
        case "MAX":
          return Math.max(...values);
        case "MIN":
          return Math.min(...values);
        default:
          return formula;
      }
    } catch {
      return "ERR";
    }
  };

  const addRow = () => {
    if (!allData.length) return;

    if (selectedRow === null) {
      setToast("⚠️ Please select a row first");
      return;
    }

    setShowInsertMenu(true);
  };

  const deleteRow = () => {
    if (!window.confirm("Delete this row?")) return;

    if (selectedRow === null) {
      setToast("⚠️ Select a row first");
      return;
    }

    const updated = [...allData];
    updated.splice(selectedRow, 1);

    setAllData(updated);
    setSelectedRow(null);
    setToast("Row deleted");
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
          data: allData
        })
      });

      // 🔥 reload updated data
      const res = await previewFile(filename, 1);
      setAllData(res.data?.preview || []);

      setToast("Saved successfully");

    } catch (err) {
      console.error(err);
      setToast("Save failed");
    }
  };

  const insertRow = (position) => {
    const emptyRow = {};

    Object.keys(allData[0]).forEach(col => {
      emptyRow[col] = "";
    });

    const updated = [...allData];

    if (position === "above") {
      updated.splice(selectedRow, 0, emptyRow);
    } else {
      updated.splice(selectedRow + 1, 0, emptyRow);
    }

    setAllData(updated);
    setShowInsertMenu(false);
  };

  useEffect(() => {
    if (toast) {
      setTimeout(() => setToast(""), 2000);
    }
  }, [toast]);

  

  // 🔥 Reset + initial load
  useEffect(() => {
    if (!filename) return;

    setAllData([]);
    setPage(1);
    setHasMore(true);

    previewFile(filename, 1).then((res) => {

      setAutoInsights(res.data?.auto_insights || []);

      setDatasetProfile(res.data?.dataset_profile || null);

      setColumnProfiles(res.data?.column_profiles || {});
      
      const newData = res.data?.preview || [];
      setAllData(newData);

      // Only enable load more if NOT inline
      if (!inline) {
        setHasMore(newData.length >= 50);
      } else {
        setHasMore(false);
      }
    });
  }, [filename, inline]);

  // 🔥 Load more (ONLY for full mode)
  const loadMore = async () => {
    if (loadingMore || !hasMore || inline) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await previewFile(filename, nextPage);
      const newData = res.data?.preview || [];

      if (newData.length > 0) {
        setAllData((prev) => [...prev, ...newData]);
        setPage(nextPage);
        setHasMore(newData.length >= 50);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error loading more data:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSort = (col) => {
    let direction = "asc";

    if (sortConfig.column === col && sortConfig.direction === "asc") {
      direction = "desc";
    }

    setSortConfig({ column: col, direction });

    const sorted = [...allData].sort((a, b) => {
      if (a[col] < b[col]) return direction === "asc" ? -1 : 1;
      if (a[col] > b[col]) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setAllData(sorted);
  };

  // 🔥 Loading state
  if (!allData || allData.length === 0) {
    return (
      <div className="empty-state">
        <span>📋</span>
        <p>Loading data...</p>
      </div>
    );
  }

  // 🔥 SAFE DISPLAY LIMITS
  const rows = inline
    ? allData.slice(0, 5)        // small preview
    : allData.slice(0, 100);     // prevent UI explosion

  const columns = Object.keys(rows[0] || {});

  const formatCell = (val) => {
    if (typeof val === "boolean" || val === "Yes" || val === "No") {
      return (
        <span className={val === true || val === "Yes" ? "tag-yes" : "tag-no"}>
          {val === true ? "Yes" : val === false ? "No" : val}
        </span>
      );
    }
    return val;
  };



  return (
    <div className="preview-table-wrap">
      {toast && (
        <div className="toast">
          {toast}
        </div>
      )}
      <div style={{ marginBottom: 10 }}>
        <button onClick={addRow}>➕ Add Row</button>

        <button
          onClick={deleteRow}
          style={{ marginLeft: 10 }}
        >
          ➖ Delete Row
        </button>

        <button onClick={saveData} style={{ marginLeft: 10 }}>
          💾 Save
        </button>
      </div>
      
      {showInsertMenu && (
        <div className="insert-popup">
          <button onClick={() => insertRow("above")}>⬆ Insert Above</button>
          <button onClick={() => insertRow("below")}>⬇ Insert Below</button>
        </div>
      )}

      {datasetProfile && (
        <div className="profile-grid">

          <div className="profile-card">
            <h4>Rows</h4>
            <p>{datasetProfile.rows}</p>
          </div>

          <div className="profile-card">
            <h4>Columns</h4>
            <p>{datasetProfile.columns}</p>
          </div>

          <div className="profile-card">
            <h4>Missing Cells</h4>
            <p>{datasetProfile.missing_cells}</p>
          </div>

          <div className="profile-card">
            <h4>Duplicates</h4>
            <p>{datasetProfile.duplicate_rows}</p>
          </div>

          <div className="profile-card">
            <h4>Completeness</h4>
            <p>{datasetProfile.completeness}%</p>
          </div>

        </div>
      )}

      {autoInsights.length > 0 && (

        <div className="insights-panel">

          <h3>🧠 Auto Insights</h3>

          <div className="insights-grid">

            {autoInsights.map((insight, i) => (

              <div
                key={i}
                className={`insight-card ${insight.type}`}
              >
                {insight.message}
              </div>

            ))}

          </div>

        </div>
      )}

      <table className="preview-table">
        <thead>
          <tr>
            <th>#</th>
            {columns.map((col, i) => (
              <th
                key={col}
                onClick={() => handleSort(col)}
                style={{ cursor: "pointer" }}
              >
                <div>{getColumnLabel(i)}</div>
                <small style={{ opacity: 0.6, fontSize: "0.8em" }}>
                  {col}
                </small>

                <div
                  style={{
                    marginTop: 4,
                    fontSize: "0.7em",
                    color: "#a78bfa"
                  }}
                >
                  <div>{columnProfiles[col]?.semantic_type || ""}</div>

                  <div style={{ opacity: 0.7 }}>
                    {columnProfiles[col]?.profile_completeness || 0}% full
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              onClick={() => setSelectedRow(i)}
              style={{
                background: selectedRow === i ? "#3b2f5a" : "transparent",
                cursor: "pointer"
              }}
            >
              <td style={{ opacity: 0.6 }}>{i + 1}</td>
              {columns.map((col) => (
                <td key={col}>
                  <input
                    value={row[col] || ""}
                    onChange={(e) => handleCellChange(i, col, e.target.value)}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      color: "white",
                      outline: "none"
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* 🔥 Load More ONLY in full mode */}
      {!inline && hasMore && (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button
            className="btn-outline"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading..." : "Load More Rows"}
          </button>
        </div>
      )}
    </div>
  );
}

export default Preview;