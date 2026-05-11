import React from "react";

import html2canvas from "html2canvas";
import { saveAs } from "file-saver";

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

import { Bar, Scatter, Pie, Line } from "react-chartjs-2";

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

function ResultPanel({ result }) {

    const exportChart = async () => {

        const el = document.querySelector(".viz-chart canvas");

        if (!el) return;

        const canvas = await html2canvas(el, {
            scale: 6,
            width: 1280,
            height: 720,
            useCORS: true,
            logging: false,
            backgroundColor: "#0f172a"
        });

        canvas.toBlob(
            (blob) => {
                saveAs(blob, "chart-export.png");
            },
            "image/png",
            1.0
        );
    };

    const exportTable = () => {

        if (!result?.data?.length) return;

        const headers = Object.keys(result.data[0]);

        const rows = result.data.map(r =>
            headers.map(h => r[h]).join(",")
        );

        const csv =
            [headers.join(","), ...rows].join("\n");

        const blob = new Blob(
            [csv],
            { type: "text/csv;charset=utf-8;" }
        );

        saveAs(blob, "table-export.csv");
    };



    if (!result) {
        return null;
    }

    // 🔥 TABLE VIEW
    if (result.type === "table") {
        return (

            <div
                style={{
                    maxHeight: "650px",
                    overflowY: "auto",
                    overflowX: "auto",
                    borderRadius: "12px"
                }}
                >
                <button
                    className="btn-outline"
                    onClick={exportTable}
                    style={{ marginBottom: 12 }}
                >
                    ⬇ Export CSV
                </button>

                <table className="preview-table">
                    <thead>
                    <tr>
                        {Object.keys(result.data[0]).map(col => (
                        <th
                            key={col}
                            style={{
                                background:
                                col === result.highlightColumn
                                    ? "rgba(139,92,246,0.35)"
                                    : "",
                                color:
                                col === result.highlightColumn
                                    ? "#c084fc"
                                    : ""
                            }}
                            >
                            {col}
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {result.data.map((row, i) => (
                        <tr key={i}>
                        {Object.values(row).map((val, j) => (
                            <td
                                key={j}
                                style={{
                                    background:
                                    Object.keys(row)[j] === result.highlightColumn
                                        ? "rgba(139,92,246,0.18)"
                                        : "",
                                    color:
                                    Object.keys(row)[j] === result.highlightColumn
                                        ? "#e9d5ff"
                                        : ""
                                }}
                                >
                                {val}
                                </td>
                        ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        );
    }

    // 🔥 CHART VIEW (NEW)
    // 🔥 UNIVERSAL CHART VIEW
    if (result.type === "chart") {

        const chartType =
            result.data.chartType || "bar";

        const styledDatasets =
            (result.data.datasets || []).map(
                (ds, i) => ({

                ...ds,

                backgroundColor:

                    chartType === "pie"

                    ? [
                        "#8b5cf6",
                        "#06b6d4",
                        "#ec4899",
                        "#10b981",
                        "#f59e0b",
                        "#3b82f6",
                        "#ef4444"
                    ]

                    : "rgba(139,92,246,0.75)",

                borderColor:

                    chartType === "pie"

                    ? "#111827"

                    : "#a855f7",

                borderWidth: 2,

                pointBackgroundColor:
                    "#c084fc",

                pointBorderColor:
                    "#ffffff",

                pointRadius: 5,

                tension: 0.35,

                fill:
                    chartType === "line",

                maxBarThickness: 18,
                categoryPercentage: 0.7,
                barPercentage: 0.8,

                hoverBackgroundColor:
                    "#c084fc"
            }));

        const limitedLabels =
            (result.data.labels || []).slice(0, 25);

            const limitedDatasets =
            styledDatasets.map(ds => ({

                ...ds,

                data:
                (ds.data || []).slice(0, 25)
            }));

            const chartData = {

                labels: limitedLabels,

                datasets: limitedDatasets
            };

        

        const commonOptions = {

            responsive: true,

            devicePixelRatio: 4,

            maintainAspectRatio: false,
            plugins: {

                legend: {
                    labels: {
                        color: "#e5e7eb"
                    }
                }
            },

            scales: {

                x: {
                    ticks: {
                        color: "#9ca3af"
                    },

                    grid: {
                        color:
                            "rgba(255,255,255,0.05)"
                    }
                },

                y: {
                    ticks: {
                        color: "#9ca3af"
                    },

                    grid: {
                        color:
                            "rgba(255,255,255,0.05)"
                    }
                }
            }
        };

        return (

            <div
                className="viz-card"
                style={{
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column"
                }}
                >

                <div className="viz-header">

                    <h4>{result.text}</h4>

                    <button
                        className="btn-outline"
                        onClick={exportChart}
                    >
                        ⬇ Export PNG
                    </button>

                </div>

                <div
                    className="viz-chart"
                    style={{
                        height: "720px",
                        minHeight: "720px",
                        width: "100%",
                        position: "relative",
                        overflow: "hidden"
                    }}
                    >

                        {chartType === "bar" && (
                            <Bar
                                width={1280}
                                height={720}
                                data={chartData}
                                options={{
                                    ...commonOptions,
                                    responsive: true,
                                    maintainAspectRatio: false
                                }}
                                />
                        )}

                    {chartType === "line" && (
                        <Line
                                width={1280}
                                height={720}
                                data={chartData}
                                options={{
                                    ...commonOptions,
                                    responsive: true,
                                    maintainAspectRatio: false
                                }}
                                />
                        )}

                    {chartType === "pie" && (
                        <Pie
                                width={1280}
                                height={720}
                                data={chartData}
                                options={{
                                    ...commonOptions,
                                    responsive: true,
                                    maintainAspectRatio: false
                                }}
                                />
                        )}

                    {chartType === "scatter" && (
                        <Scatter
                                width={1280}
                                height={720}
                                data={chartData}
                                options={{
                                    ...commonOptions,
                                    responsive: true,
                                    maintainAspectRatio: false
                                }}
                                />
                        )}

                </div>

            </div>
        );
    }

    // 🔥 COMPARISON VIEW (NEW)
    // if (result.type === "comparison") {

    //     const chartData = {
    //         labels: result.data.current.labels,
    //         datasets: [
    //         {
    //             label: "Current",
    //             data: result.data.current.values,
    //             backgroundColor: "rgba(139,92,246,0.6)"
    //         },
    //         {
    //             label: "Previous",
    //             data: result.data.previous.values,
    //             backgroundColor: "rgba(16,185,129,0.6)"
    //         }
    //         ]
    //     };

    //     return (
    //         <div>
    //         <h4>{result.text}</h4>
    //         <Bar data={chartData} />
    //         </div>
    //     );
    //     }

    // 🔥 TEXT VIEW
    if (result.type === "text") {
        return <div>{result.text}</div>;
    }

    return null;
    }

export default ResultPanel;