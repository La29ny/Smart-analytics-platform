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

        const el = document.querySelector(".chart-container");

        if (!el) return;

        const canvas = await html2canvas(el);

        canvas.toBlob((blob) => {
            saveAs(blob, "chart-export.png");
        });
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

            <div>
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
                        <th key={col}>{col}</th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {result.data.map((row, i) => (
                        <tr key={i}>
                        {Object.values(row).map((val, j) => (
                            <td key={j}>{val}</td>
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

        const chartData = {
            labels: result.data.labels || [],
            datasets: result.data.datasets || []
        };

        const chartType = result.data.chartType || "bar";

        return (
            <div className="chart-container">

                <button
                    className="btn-outline"
                    onClick={exportChart}
                    style={{ marginBottom: 12 }}
                >
                    ⬇ Export PNG
                </button>


                

                {chartType === "bar" && (
                    <Bar

                        data={chartData}

                        options={{

                            responsive: true,

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
                        }}
                        />
                )}

                {chartType === "line" && (
                    
                    <Line

                        data={chartData}

                        options={{

                            responsive: true,

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
                        }}
                        />

                {chartType === "pie" && (
                    <Pie
                    
                        data={chartData}

                        options={{

                            responsive: true,

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
                        }}
                        />

                {chartType === "scatter" && (
                    <Scatter
                    
                        data={chartData}

                        options={{

                            responsive: true,

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
                        }}
                        />
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