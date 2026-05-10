import React, {
  useState,
  useEffect,
  useRef
} from "react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

import {
  Bar,
  Scatter,
  Pie,
  Line
} from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
);

ChartJS.defaults.color = "#162538";
ChartJS.defaults.borderColor = "rgba(255,255,255,0.08)";


const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,

  plugins: {
    legend: {
      position: "top",

      labels: {
        color: "#d1d5db",
        usePointStyle: true,
        pointStyle: "rectRounded",

        font: {
          size: 12,
          weight: "600"
        },

        padding: 18
      }
    },

    tooltip: {
      backgroundColor: "#111827",
      titleColor: "#fff",
      bodyColor: "#e5e7eb",
      borderColor: "#374151",
      borderWidth: 1
    }
  },

  scales: {
    x: {
      ticks: {
        color: "#9ca3af",
        maxTicksLimit: 6,
        font: {
          size: 11
        }
      },

      grid: {
        display: false
      },

      border: {
        display: false
      }
    },

    y: {
      ticks: {
        color: "#9ca3af",
        font: {
          size: 11
        }
      },

      grid: {
        color: "rgba(255,255,255,0.04)"
      },

      border: {
        display: false
      }
    }
  },

  elements: {
    bar: {
      borderRadius: 6,
      backgroundColor: "#60a5fa",
      borderSkipped: false
    },

    line: {
      tension: 0.35,
      borderWidth: 3
    },

    point: {
      radius: 2,
      hoverRadius: 5
    }
  }
};


function Charts({
  filename,
  inline,
  datasetInfo = {},
  charts = [],
  setCharts,
  dashboardWidgets = [],
  setDashboardWidgets
}) {
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState("histogram");
  const [xCol, setXCol] = useState("");
  const [yCol, setYCol] = useState("");
  const [columns, setColumns] = useState([]);
  const [query, setQuery] = useState("");
  const [columnProfiles, setColumnProfiles] = useState({});

    const exportChart = (chartId) => {

    const canvas =
      document.querySelector(
        `#chart-${chartId} canvas`
      );

    if (!canvas) return;

    const link =
      document.createElement("a");

    link.download =
      `chart-${chartId}.png`;

    link.href =
      canvas.toDataURL("image/png");

    link.click();
  };

  const targetName = datasetInfo.target || "target variable";

  // Fetch columns when filename changes
  useEffect(() => {
    if (!filename) return;

    fetch(`http://127.0.0.1:5000/preview?filename=${filename}`)
      .then(res => res.json())
      .then(data => {
        const profiles = data.data?.column_profiles || {};
        
        setColumnProfiles(profiles);
        const cols = data.data?.columns || data.columns || [];
        setColumns(cols);
        if (cols.length > 0) {
          setXCol(cols[0]);
          setYCol(cols[1] || cols[0]);
        }
      })
      .catch(err => console.error("Error fetching columns:", err));
  }, [filename]);

  const handleVisualize = async () => {
    if (!filename || !xCol) {
      alert("Please select X column");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://127.0.0.1:5000/visualize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename,
          chart_type: chartType,
          x: xCol,
          y: yCol
        })
      });

      if (!res.ok) throw new Error("Failed to generate chart");

      const chartData = await res.json();

        const newChart = {
          id: Date.now(),
          type: chartData.chartType,
          x: xCol,
          y: yCol,
          data: chartData
        };

      // Update global charts state
      setCharts(prev => [newChart, ...prev]);

    } catch (err) {
      console.error(err);
      alert("Visualization failed. Please check backend.");
    } finally {
      setLoading(false);
    }
  };

  if (inline) {
    return (
      <div>
        <div className="vis-grid">
          <div className="vis-card">
            <h5>{targetName} Distribution</h5>
            <p>Distribution of target variable</p>
            <div className="vis-placeholder" onClick={handleVisualize} style={{ cursor: "pointer" }}>
              <span>📊</span>
              <span>{loading ? "Generating..." : "Click to generate"}</span>
            </div>
          </div>
          <div className="vis-card">
            <h5>Feature Correlation</h5>
            <p>Correlation heatmap</p>
            <div className="vis-placeholder" onClick={handleVisualize} style={{ cursor: "pointer" }}>
              <span>🟦</span>
              <span>{loading ? "Generating..." : "Click to generate"}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full page version
  return (
    <div>
      <div className="form-group">
        <label>Chart Type</label>
        <select 
          className="form-input" 
          value={chartType} 
          onChange={(e) => setChartType(e.target.value)}
        >
          <option value="histogram">Histogram</option>
          <option value="scatter">Scatter</option>
          <option value="bar">Bar</option>
          <option value="pie">Pie</option>
        </select>
      </div>

      {columnProfiles[xCol] && (
        <div className="smart-chart-hint">
          Suggested:
          {" "}
          <strong>
            {columnProfiles[xCol].semantic_type === "currency"
              ? "Bar or Line Chart"
              : columnProfiles[xCol].is_numeric
              ? "Histogram"
              : "Pie or Bar Chart"}
          </strong>
        </div>
      )}






      <div className="form-group">
        <label>X Axis</label>
        <select 
          className="form-input" 
          value={xCol} 
          onChange={(e) => setXCol(e.target.value)}
        >
          {columns.map(col => (
            <option key={col} value={col}>{col}</option>
          ))}
        </select>
      </div>

      {chartType !== "histogram" && chartType !== "pie" && (
        <div className="form-group">
          <label>Y Axis</label>
          <select 
            className="form-input" 
            value={yCol} 
            onChange={(e) => setYCol(e.target.value)}
          >
            {columns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>
      )}

      <input
        className="form-input"
        placeholder="e.g. bar chart of area where age > 20"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <button 
        className="btn-primary" 
        onClick={handleVisualize} 
        disabled={loading || !xCol}
        style={{ maxWidth: 240, marginBottom: 20 }}
      >
        {loading ? "⏳ Generating..." : "📊 Generate Chart"}
      </button>

      <div style={{ marginTop: 30 }}>
        {charts.length === 0 ? (
          <p style={{ color: "#888", fontStyle: "italic" }}>
            No charts generated yet. Create one above!
          </p>
        ) : (
          <div className="chart-history">
            {charts.map((chart) => (
              <div key={chart.id} className="chart-card">

                <button
                  className="pin-btn"
                  onClick={() => {

                    const widget = {
                      id: Date.now(),
                      type: "chart",
                      title: `${chart.type} chart`,
                      chart
                    };

                    setDashboardWidgets(prev => [
                      widget,
                      ...prev
                    ]);
                  }}
                >
                  📌 Pin
                </button>

                <h4>
                  {chart.type.toUpperCase()} — {chart.x}
                  {chart.y && ` vs ${chart.y}`}
                </h4>
                <div
                  className="chart-render"
                  id={`chart-${chart.id}`}
                >
                  {chart.data.chartType === "bar" && (
                    <Bar
                      options={chartOptions}
                      data={{
                        labels: chart.data.labels.slice(0, 40),
                        datasets: chart.data.datasets.map(ds => ({
                          ...ds,

                          data: ds.data.slice(0, 20),

                          backgroundColor:
                            chart.data.chartType === "bar"
                              ? "#60a5fa"
                              : chart.data.chartType === "pie"
                              ? [
                                  "#8b5cf6",
                                  "#60a5fa",
                                  "#34d399",
                                  "#f59e0b",
                                  "#f87171"
                                ]
                              : "rgba(96,165,250,0.15)",

                          borderColor:
                            chart.data.chartType === "line"
                              ? "#60a5fa"
                              : "#60a5fa",

                          borderWidth: 2,

                          fill: chart.data.chartType === "line"
                        }))
                      }}
                    />
                  )}

                  {chart.data.chartType === "line" && (
                    <Line
                    options={chartOptions}
                      data={{
                        labels: chart.data.labels.slice(0, 40),
                        datasets: chart.data.datasets.map(ds => ({
                          ...ds,

                          data: ds.data.slice(0, 20),

                          backgroundColor:
                            chart.data.chartType === "bar"
                              ? "#60a5fa"
                              : chart.data.chartType === "pie"
                              ? [
                                  "#8b5cf6",
                                  "#60a5fa",
                                  "#34d399",
                                  "#f59e0b",
                                  "#f87171"
                                ]
                              : "rgba(96,165,250,0.15)",

                          borderColor:
                            chart.data.chartType === "line"
                              ? "#60a5fa"
                              : "#60a5fa",

                          borderWidth: 2,

                          fill: chart.data.chartType === "line"
                        }))
                      }}
                    />
                  )}

                  {chart.data.chartType === "pie" && (
                    <Pie
                    options={chartOptions}
                      data={{
                        labels: chart.data.labels.slice(0, 40),
                        datasets: chart.data.datasets.map(ds => ({
                          ...ds,

                          data: ds.data.slice(0, 20),

                          backgroundColor:
                            chart.data.chartType === "bar"
                              ? "#60a5fa"
                              : chart.data.chartType === "pie"
                              ? [
                                  "#8b5cf6",
                                  "#60a5fa",
                                  "#34d399",
                                  "#f59e0b",
                                  "#f87171"
                                ]
                              : "rgba(96,165,250,0.15)",

                          borderColor:
                            chart.data.chartType === "line"
                              ? "#60a5fa"
                              : "#60a5fa",

                          borderWidth: 2,

                          fill: chart.data.chartType === "line"
                        }))
                      }}
                    />
                  )}

                  {chart.data.chartType === "scatter" && (
                    <Scatter
                    options={chartOptions}
                      data={{
                        datasets: chart.data.datasets.map(ds => ({
                          ...ds,

                          data: ds.data.slice(0, 20),

                          backgroundColor:
                            chart.data.chartType === "bar"
                              ? "#60a5fa"
                              : chart.data.chartType === "pie"
                              ? [
                                  "#8b5cf6",
                                  "#60a5fa",
                                  "#34d399",
                                  "#f59e0b",
                                  "#f87171"
                                ]
                              : "rgba(96,165,250,0.15)",

                          borderColor:
                            chart.data.chartType === "line"
                              ? "#60a5fa"
                              : "#60a5fa",

                          borderWidth: 2,

                          fill: chart.data.chartType === "line"
                        }))
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Charts;