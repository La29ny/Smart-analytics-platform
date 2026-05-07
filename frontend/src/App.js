import React, { useState, useEffect } from "react";
import Upload from "./components/Upload";
import Preview from "./components/Preview";
import Predict from "./components/Predict";
import NLPInput from "./components/NLPInput";
import { trainModel } from "./services/api";
import Charts from "./components/Charts";
import "./App.css";
import ChatPanel from "./components/ChatPanel";
import ResultPanel from "./components/ResultPanel";

import whatsappLogo from "./assets/whatsapp.png";
import mailLogo from "./assets/mail.png";

import { saveAs } from "file-saver";


function Sparkline() {
  const pts = "0,28 8,22 16,26 24,14 32,18 40,10 48,15 56,8 64,12 72,6 80,10";
  return (
    <svg viewBox="0 0 80 32" className="status-mini-chart" fill="none">
      <polyline points={pts} stroke="#10b981" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function DonutRing({ pct, label, sublabel }) {
  const r = 36, cx = 45, cy = 45, circ = 2 * Math.PI * r;
  const fill = circ * (pct / 100);
  return (
    <div className="donut-ring">
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx={cx} cy={cy} r={r} strokeWidth="6" stroke="var(--bg-elevated)" fill="none" />
        <circle
          cx={cx} cy={cy} r={r} strokeWidth="6"
          stroke="var(--accent-purple-light)" fill="none"
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="donut-ring-label">
        <span style={{ fontSize: 9, color: "var(--text-secondary)" }}>{label}</span>
        <strong>{sublabel}</strong>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon, iconClass }) {
  return (
    <div className="stat-card">
      <div className="stat-card-info">
        <label>{label}</label>
        <h2>{value}</h2>
        <p>{sub}</p>
      </div>
      <div className={`stat-card-icon ${iconClass}`}>{icon}</div>
    </div>
  );
}

function Dashboard({
  filename,
  onNavigate,
  trainResult,
  datasetInfo,
  handleTrain,
  charts,

  chatHistory,
  setChatHistory,
  activeResult,
  setActiveResult,

  lastResult,
  prevResult,
  setLastResult,
  setPrevResult,
  contextMemory,
  setContextMemory
}) {
  return (
    <>
      {/* Stat row */}
      <div className="stat-grid">
        <StatCard label="Dataset Loaded" value={filename ? "1" : "0"} sub="Active dataset" icon="🗄️" iconClass="icon-purple" />
        <StatCard label="Total Rows" value={datasetInfo?.rows ?? "—"} sub="Records in dataset" icon="☰" iconClass="icon-cyan" />
        <StatCard label="Features" value={datasetInfo?.columns?.length ?? "—"} sub="Columns detected" icon="⊞" iconClass="icon-green" />
        <StatCard label="Models Trained" value={trainResult ? "2" : "0"} sub="ML models ready" icon="🧠" iconClass="icon-amber" />
      </div>

      {/* Middle row */}
      <div className="two-col">
        {/* Quick Actions */}
        <div className="dash-card">
          <div className="card-header">
            <h3>Quick Actions</h3>
            <p>Get started with your data analysis</p>
          </div>
          <div className="quick-actions-grid">
            <button className="quick-action-btn" onClick={() => onNavigate("upload")}>
              <div className="qa-icon icon-purple">📤</div>
              <div className="qa-text">
                <strong>Upload Dataset</strong>
                <span>Import your CSV file</span>
              </div>
            </button>
            <button className="quick-action-btn" onClick={() => onNavigate("preview")}>
              <div className="qa-icon icon-cyan">🔍</div>
              <div className="qa-text">
                <strong>Explore Data</strong>
                <span>View and analyze data</span>
              </div>
            </button>
            <button className="quick-action-btn" onClick={() => onNavigate("nlp")}>
              <div className="qa-icon icon-green">🧠</div>
              <div className="qa-text">
                <strong>Train Model</strong>
                <span>Build ML models</span>
              </div>
            </button>
            <button className="quick-action-btn" onClick={() => onNavigate("predict")}>
              <div className="qa-icon icon-amber">📈</div>
              <div className="qa-text">
                <strong>Make Prediction</strong>
                <span>Predict target values</span>
              </div>
            </button>
          </div>
        </div>

        {/* Model Performance */}
        <div className="dash-card">
          <div className="card-header">
            <h3>Model Performance</h3>
            <p>Comparing model accuracy and performance</p>
          </div>
          {trainResult ? (
            <>
              <div className="model-metrics">
                <div className="model-metric-block">
                  <label>Linear Regression</label>
                  <h4>R² Score</h4>
                  <div className="metric-score">{trainResult?.linear_accuracy || "—"}</div>
                  <div className="metric-bar">
                    <div className="metric-bar-fill fill-purple" 
                         style={{ width: `${parseFloat(trainResult?.linear_accuracy || 0) * 100}%` }} />
                  </div>
                </div>
                <div className="model-metric-block">
                  <label>Neural Network</label>
                  <h4>MSE Loss</h4>
                  <div className="metric-score">{parseFloat(trainResult?.nn_loss || 0).toFixed(2)}</div>
                  <div className="metric-bar">
                    <div className="metric-bar-fill fill-amber" style={{ width: "60%" }} />
                  </div>
                </div>
                <div className="model-badge-wrap">
                  <div className="best-model-label">Best Model</div>
                  <DonutRing 
                    pct={89} 
                    label="Linear Regression" 
                    sublabel={`${Math.round(parseFloat(trainResult?.linear_accuracy || 0) * 100)}%`} 
                  />
                </div>
              </div>
              <div className="model-note">
                ✦ Linear Regression performs better on this dataset
              </div>
            </>
          ) : (
            <div className="empty-state">
              <span>📊</span>
              <p>Train a model to see performance metrics</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="two-col">
        {/* Data Preview */}
        <div className="dash-card">
          <div className="card-header">
            <h3>Data Preview</h3>
            <p>First 5 rows of your dataset</p>
          </div>
          {filename ? (
            <Preview filename={filename} inline />
          ) : (
            <div className="empty-state">
              <span>📋</span>
              <p>Upload a dataset to preview data</p>
            </div>
          )}
          {filename && (
            <div className="table-footer">
              <span>Showing 5 rows</span>
              <button className="btn-outline" onClick={() => onNavigate("preview")}>View Full Dataset</button>
            </div>
          )}
        </div>

        {/* Data Visualizations - Global Charts on Dashboard */}
        <div className="dash-card">
          <div className="card-header-row">
            <div className="card-header">
              <h3>Data Visualizations</h3>
              <p>Latest generated charts</p>
            </div>
            {filename && (
              <button className="btn-outline" onClick={() => onNavigate("charts")}>View All Charts</button>
            )}
          </div>
          {charts.length > 0 ? (
            <div className="charts-grid mini-charts">
              {charts.slice(0, 2).map((chart) => (
                <div key={chart.id} className="mini-chart-card">
                  <p className="chart-title">
                    {chart.type?.toUpperCase()} — {chart.x}{chart.y ? ` vs ${chart.y}` : ''}
                  </p>
                  <img 
                    src={chart.url} 
                    alt={chart.type} 
                    style={{ maxHeight: "180px", width: "100%", objectFit: "contain" }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span>📈</span>
              <p>Generate charts to see them here</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Assistant Bar */}
      <div className="chat-layout">
        <ChatPanel chatHistory={chatHistory} />

        <ResultPanel result={activeResult} />
      </div>

      <NLPInput
        filename={filename}
        onTrain={handleTrain}
        lastResult={lastResult}
        onResponse={(res) => {

          // 🔥 HANDLE ACTIONS
          if (res.type === "action") {

            if (res.action === "plot_last" && lastResult?.data) {
              setActiveResult({
                type: "chart",
                data: lastResult.data,
                text: "📊 Plotting previous result"
              });
              return;
            }

            if (
              res.action === "compare_previous" &&
              lastResult?.data &&
              prevResult?.data
            ) {

              setActiveResult({
                type: "chart",
                text: "📊 Comparing Results",
                data: {
                  chartType: "bar",
                  labels: lastResult.data.labels || [],
                  datasets: [
                    {
                      label: "Current",
                      data: lastResult.data.datasets?.[0]?.data || []
                    },
                    {
                      label: "Previous",
                      data: prevResult.data.datasets?.[0]?.data || []
                    }
                  ]
                }
              });

              return;
            }
          }

          if (res.context) {
            setContextMemory(prev => ({
              ...prev,
              ...res.context
            }));
          }

          // 🔥 NORMAL FLOW
          setChatHistory(prev => [...prev, res]);

          setPrevResult(lastResult);
          setLastResult(res);
          setActiveResult(res);
        }}
      />
    </>
  );
}

function App() {
  const [filename, setFilename] = useState("");
  const [activePage, setActivePage] = useState("dashboard");
  const [trainResult, setTrainResult] = useState(null);
  const [datasetInfo, setDatasetInfo] = useState({
    type: "generic",
    target: "",
    columns: [],
    rows: 0
  });

  const [prevResult, setPrevResult] = useState(null);

  const [chatHistory, setChatHistory] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [activeResult, setActiveResult] = useState(null);

  const [savedSessions, setSavedSessions] = useState([]);
  const [showSharePopup, setShowSharePopup] = useState(false);

  const [contextMemory, setContextMemory] = useState({
  lastQuery: "",
  lastFilters: [],
  lastColumns: [],
  lastChartType: null
});

  const [charts, setCharts] = useState([]);           // ← Global Charts State
  const [systemStatus, setSystemStatus] = useState({
    backend: false,
    models: false
  });

  // Load saved charts from localStorage on mount
  useEffect(() => {
    const savedCharts = localStorage.getItem("appCharts");
    if (savedCharts) {
      try {
        setCharts(JSON.parse(savedCharts));
      } catch (e) {
        console.error("Failed to load saved charts");
      }
    }
  }, []);

  // Save charts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("appCharts", JSON.stringify(charts));
  }, [charts]);

  // Detect dataset type based on column names
  const detectDatasetType = (columns) => {
    const cols = columns.map(c => c.toLowerCase());

    if (cols.includes("marks") || cols.includes("study_hours") || cols.includes("studytime"))
      return { type: "student", target: "marks" };

    if (cols.includes("price") || cols.includes("area") || cols.includes("sqft"))
      return { type: "housing", target: "price" };

    if (cols.includes("sales") || cols.includes("revenue") || cols.includes("profit"))
      return { type: "sales", target: "sales" };

    return { 
      type: "generic", 
      target: columns.length > 0 ? columns[columns.length - 1] : "target variable" 
    };
  };

  // System status polling
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/system-status");
        const data = await res.json();
        setSystemStatus({
          backend: data.status === "running",
          models: data.models_trained ?? false
        });
      } catch {
        setSystemStatus({ backend: false, models: false });
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {

    const stored = localStorage.getItem("savedSessions");

    if (stored) {
      setSavedSessions(JSON.parse(stored));
    }

  }, []);

  const saveSession = () => {

    const session = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),

      filename,

      chatHistory,
      charts,
      contextMemory
    };

    const updated = [session, ...savedSessions];

    setSavedSessions(updated);

    localStorage.setItem(
      "savedSessions",
      JSON.stringify(updated)
    );

    alert("✅ Session saved");
  };

  const generateShareText = () => {

    const msgs = chatHistory
      .slice(-5)
      .map(m => `• ${m.text}`)
      .join("\n");

    return `
  Smart Analytics Session

  Dataset: ${filename}

  Recent Insights:
  ${msgs}

  Generated with Smart Analytics AI
    `;
  };

  const exportSession = () => {

    const content = `
  SMART ANALYTICS SESSION

  Dataset:
  ${filename}

  ================================

  CHAT HISTORY

  ${chatHistory.map(
    m => `[${m.role}] ${m.text}`
  ).join("\n")}

  ================================

  Generated by Smart Analytics
    `;

    const blob = new Blob(
      [content],
      { type: "text/plain;charset=utf-8" }
    );

    saveAs(blob, "analytics-session.txt");
  };

  const handleUploadSuccess = (f) => {
    setFilename(f);
    fetch(`http://127.0.0.1:5000/preview?filename=${f}`)
      .then(res => res.json())
      .then(data => {
        const previewData = data.data || data;
        const cols = previewData.columns || [];
        const totalRows = previewData.rows ?? (previewData.preview || []).length;

        const info = detectDatasetType(cols);
        setDatasetInfo({
          ...info,
          columns: cols,
          rows: totalRows
        });
      })
      .catch(err => {
        console.error("Error fetching dataset info:", err);
      });
  };

  const handleTrain = async (target) => {
    const res = await trainModel(filename, target);
    setTrainResult(res?.data || res);
  };

  const getTargetName = () => datasetInfo.target || "target variable";

  const PAGE_TITLES = {
    dashboard: { title: "AI Data Dashboard", sub: `Analyze and predict ${getTargetName()}` },
    upload:    { title: "Upload Dataset", sub: "Import your CSV file" },
    preview:   { title: "Explore Data", sub: `Inspect dataset features` },
    charts:    { title: "Visualizations", sub: `Explore relationships in ${getTargetName()}` },
    nlp:       { title: "Model Training", sub: `Train models to predict ${getTargetName()}` },
    predict:   { title: "Prediction", sub: `Predict ${getTargetName()} using your model` }
  };

  const current = PAGE_TITLES[activePage] || PAGE_TITLES.dashboard;

  const NAV = [
    { id: "dashboard", label: "Dashboard", icon: "🏠" },
    { id: "upload", label: "Upload Data", icon: "📤" },
    { id: "preview", label: "Explore Data", icon: "🔍" },
    { id: "charts", label: "Visualizations", icon: "📊" },
    { id: "nlp", label: "Train Models", icon: "🧠" },
    { id: "predict", label: "Predictions", icon: "🎯" },
    { id: "nlp", label: "NLP Assistant", icon: "✨" },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">📊</div>
          <div className="sidebar-logo-text">
            <h2>Smart Analytics</h2>
            <span>AI-Powered Insights</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((item, i) => (
            <button
              key={`${item.id}-${i}`}
              className={`nav-item ${activePage === item.id && item.label !== "NLP Assistant" ? "active" : ""} ${activePage === "nlp" && item.label === "NLP Assistant" ? "active" : ""}`}
              onClick={() => setActivePage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-status">
          <h4>System Status</h4>
          <div className="status-ok">● All Systems Operational</div>
          <Sparkline />
          <div className="status-row">
            <span>Backend API</span>
            <span className={`status-badge ${systemStatus.backend ? "online" : "offline"}`}>
              {systemStatus.backend ? "Online" : "Offline"}
            </span>
          </div>
          <div className="status-row">
            <span>ML Models</span>
            <span className={`status-badge ${systemStatus.models ? "ready" : "not-ready"}`}>
              {systemStatus.models ? "Ready" : "Not Ready"}
            </span>
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <h1>{current.title}</h1>
            <p>{current.sub}</p>
          </div>
          <div className="topbar-right">
            <button className="btn-nlp" onClick={() => setActivePage("nlp")}>
              ✨ NLP Assistant
            </button>

            <button
              className="btn-outline"
              onClick={saveSession}
            >
              💾 Save
            </button>

            <button
              className="btn-outline"
              onClick={() => setShowSharePopup(true)}
            >
              📤 Share
            </button>

            <button
              className="btn-outline"
              onClick={exportSession}
            >
              ⬇ Export
            </button>



            <div className="topbar-avatar">N</div>
          </div>
        </header>

        <main className="page-content">
          {activePage === "dashboard" && (
            <Dashboard
              filename={filename}
              onNavigate={setActivePage}
              trainResult={trainResult}
              datasetInfo={datasetInfo}
              handleTrain={handleTrain}
              charts={charts}

              chatHistory={chatHistory}
              setChatHistory={setChatHistory}
              activeResult={activeResult}
              setActiveResult={setActiveResult}
              setLastResult={setLastResult}

              lastResult={lastResult}          
              prevResult={prevResult}
              setPrevResult={setPrevResult}  
              contextMemory={contextMemory}
              setContextMemory={setContextMemory}
            />
          )}

          {activePage === "upload" && (
            <div className="upload-page">
              <Upload setFilename={handleUploadSuccess} />
            </div>
          )}

          {activePage === "preview" && (
            <div className="dash-card">
              <div className="card-header">
                <h3>Full Dataset Preview</h3>
                <p>{filename || "No dataset loaded"}</p>
              </div>
              {filename ? <Preview filename={filename} /> : <div className="empty-state"><span>📋</span><p>Upload a dataset first</p></div>}
            </div>
          )}

          {activePage === "charts" && (
            <div className="dash-card charts-page">
              <div className="card-header">
                <h3>Data Visualizations</h3>
                <p>Generate and manage charts</p>
              </div>
              {filename ? (
                <Charts 
                  filename={filename} 
                  datasetInfo={datasetInfo}
                  charts={charts}
                  setCharts={setCharts}
                />
              ) : (
                <div className="empty-state">
                  <span>📊</span>
                  <p>Upload a dataset to generate charts</p>
                </div>
              )}
            </div>
          )}

          {activePage === "nlp" && (
            <div className="form-page">
              <div className="dash-card">
                <div className="card-header">
                  <h3>✨ NLP Assistant & Model Training</h3>
                  <p>Use natural language to train models on your data</p>
                </div>
                <NLPInput filename={filename} onTrain={handleTrain} />
                {trainResult && (
                  <div className="train-result-box">
                    <h4>📊 Training Results</h4>
                    <div className="result-grid">
                      <div className="result-item">
                        <label>Linear Regression (R²)</label>
                        <div className="result-value">{parseFloat(trainResult?.linear_accuracy || 0).toFixed(3)}</div>
                      </div>
                      <div className="result-item">
                        <label>Neural Network (Loss)</label>
                        <div className="result-value">{parseFloat(trainResult?.nn_loss || 0).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activePage === "predict" && (
            <div className="form-page">
              <div className="dash-card">
                <div className="card-header">
                  <h3>🎯 Make a Prediction</h3>
                  <p>Enter feature values to predict the target variable</p>
                </div>
                <Predict filename={filename} datasetInfo={datasetInfo} />
              </div>
            </div>
          )}
        </main>
      </div>

      {showSharePopup && (

        <div className="share-overlay">

          <div className="share-popup">

            <h3>Share Session</h3>

            <div className="share-options">

              <button
                className="share-btn whatsapp"
                onClick={() => {

                  const text = encodeURIComponent(
                    generateShareText()
                  );

                  window.open(
                    `https://wa.me/?text=${text}`,
                    "_blank"
                  );
                }}
              >
                <img src={whatsappLogo} alt="WhatsApp" className="share-logo" />
                WhatsApp
              </button>

              <button
                className="share-btn mail"
                onClick={() => {

                  const subject =
                    encodeURIComponent(
                      "Smart Analytics Session"
                    );

                  const body =
                    encodeURIComponent(
                      generateShareText()
                    );

                  window.open(
                    `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`,
                    "_blank"
                  );
                }}
              >
                <img src={mailLogo} alt="Mail" className="share-logo" />
                Mail
              </button>

            </div>

            <button
              className="btn-outline"
              onClick={() => setShowSharePopup(false)}
            >
              Close
            </button>

          </div>

        </div>
      )}


    </div>
  );
}

export default App;