import React, { useState, useRef } from "react";
import { uploadFile } from "../services/api";

function Upload({ setFilename }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  const handleUpload = async (selectedFile = file) => {
    if (!selectedFile) return;
    setLoading(true);
    const res = await uploadFile(selectedFile);
      console.log(res); // 🔥 ADD HERE
    setLoading(false);
    setFilename(res.data?.filename || res.filename);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  return (
    <div>
      <label
        className={`upload-zone${dragOver ? " drag-active" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={(e) => {
          if (!file) inputRef.current.click();
        }}
        style={{ cursor: "pointer", display: "block" }}
      >
        <span className="upload-icon">☁️</span>
        <h3>Drop your CSV file here</h3>
        <p>or click to browse your files</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={(e) => {
            const selected = e.target.files[0];
            if (selected) {
              setFile(selected);
              handleUpload(selected);
            }
          }}
          style={{ display: "none" }}
        />
      </label>

      {file && (
        <div className="upload-selected">
          <span>📄</span>
          <span style={{ flex: 1, fontSize: 13 }}>{file.name}</span>
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            {(file.size / 1024).toFixed(1)} KB
          </span>
        </div>
      )}

      {/* <button
        className="btn-primary"
        onClick={handleUpload}
        disabled={!file || loading}
      >
        {loading ? "⏳ Uploading..." : "📤 Upload Dataset"}
      </button> */}
    </div>
  );
}

export default Upload;
