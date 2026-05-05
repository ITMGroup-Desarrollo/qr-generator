import { useState, useRef, useEffect } from "react";
import QRCode from "qrcode";

export default function QRGenerator() {
    const [input, setInput] = useState("");
    const [qrColor, setQrColor] = useState("#000000");
    const [format, setFormat] = useState("PNG");
    const [history, setHistory] = useState([]);
    const [modal, setModal] = useState(null); // { dataUrl, format }
    const [loading, setLoading] = useState(false);
    const canvasRef = useRef(null);

    // Load history from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("qr-history");
        if (saved) setHistory(JSON.parse(saved));
    }, []);

    const saveToHistory = (entry) => {
        const updated = [entry, ...history].slice(0, 20);
        setHistory(updated);
        localStorage.setItem("qr-history", JSON.stringify(updated));
    };

    const generateQR = async () => {
        if (!input.trim()) return;
        setLoading(true);

        try {
            if (format === "PNG") {
                const canvas = document.createElement("canvas");
                await QRCode.toCanvas(canvas, input, {
                    width: 400,
                    margin: 1,
                    color: {
                        dark: qrColor,
                        light: "#00000000", // transparent background
                    },
                });
                const dataUrl = canvas.toDataURL("image/png");
                const entry = { input, qrColor, format, dataUrl, date: new Date().toLocaleString() };
                saveToHistory(entry);
                setModal({ dataUrl, format: "PNG", input });
            } else {
                // SVG
                const svgString = await QRCode.toString(input, {
                    type: "svg",
                    margin: 1,
                    color: {
                        dark: qrColor,
                        light: "#00000000",
                    },
                });
                const blob = new Blob([svgString], { type: "image/svg+xml" });
                const dataUrl = URL.createObjectURL(blob);
                const entry = {
                    input,
                    qrColor,
                    format,
                    dataUrl: `data:image/svg+xml;base64,${btoa(svgString)}`,
                    svgString,
                    date: new Date().toLocaleString(),
                };
                saveToHistory(entry);
                setModal({ dataUrl, format: "SVG", svgString, input });
            }
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const downloadQR = () => {
        if (!modal) return;
        const link = document.createElement("a");
        if (modal.format === "PNG") {
            link.href = modal.dataUrl;
            link.download = `qr-itm-${Date.now()}.png`;
        } else {
            const blob = new Blob([modal.svgString], { type: "image/svg+xml" });
            link.href = URL.createObjectURL(blob);
            link.download = `qr-itm-${Date.now()}.svg`;
        }
        link.click();
    };

    const downloadFromHistory = (entry) => {
        const link = document.createElement("a");
        if (entry.format === "PNG") {
            link.href = entry.dataUrl;
            link.download = `qr-itm-${Date.now()}.png`;
        } else {
            const blob = new Blob([entry.svgString], { type: "image/svg+xml" });
            link.href = URL.createObjectURL(blob);
            link.download = `qr-itm-${Date.now()}.svg`;
        }
        link.click();
    };

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem("qr-history");
    };

    return (
        <div style={styles.page}>
            {/* Header */}
            <div style={styles.header}>
                <img src="imagenes/logo-ITM-Group.png" alt="ITM Group" style={styles.logo} />
                <p style={styles.subtitle}>Generador de QR</p>
            </div>

            {/* Card */}
            <div style={styles.card}>
                {/* Input */}
                <div style={styles.field}>
                    <label style={styles.label}>Texto o URL</label>
                    <input
                        style={styles.input}
                        type="text"
                        placeholder="Texto o URL"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && generateQR()}
                    />
                </div>

                {/* Color & Format */}
                <div style={styles.row}>
                    <div style={{ flex: 1 }}>
                        <label style={styles.label}>Color del QR</label>
                        <div style={styles.colorWrapper}>
                            <div style={{ ...styles.colorDot, background: qrColor }} />
                            <span style={styles.colorHex}>{qrColor.toUpperCase()}</span>
                            <input
                                type="color"
                                value={qrColor}
                                onChange={(e) => setQrColor(e.target.value)}
                                style={styles.colorInputHidden}
                            />
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={styles.label}>Formato</label>
                        <div style={styles.selectWrapper}>
                            <select
                                style={styles.select}
                                value={format}
                                onChange={(e) => setFormat(e.target.value)}
                            >
                                <option value="PNG" style={{ color: "#000000", background: "#ffffff" }}>PNG</option>
                                <option value="SVG" style={{ color: "#000000", background: "#ffffff" }}>SVG</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Button */}
                <button
                    style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
                    onClick={generateQR}
                    disabled={loading || !input.trim()}
                >
                    {loading ? "Generando..." : "Generar QR"}
                </button>
            </div>

            {/* History */}
            <div style={styles.historySection}>
                <div style={styles.historyHeader}>
                    <h2 style={styles.historyTitle}>Historial</h2>
                    {history.length > 0 && (
                        <button style={styles.clearBtn} onClick={clearHistory}>
                            Limpiar
                        </button>
                    )}
                </div>

                {history.length === 0 ? (
                    <p style={styles.emptyHistory}>Aún no has generado ningún QR</p>
                ) : (
                    <div style={styles.historyGrid}>
                        {history.map((entry, i) => (
                            <div key={i} style={styles.historyCard}>
                                <div style={{
                                    ...styles.qrPreviewBg,
                                    background: entry.qrColor === "#ffffff" ? "#1a2c5b" : "#f0f4f8",
                                }}>
                                    <img
                                        src={entry.dataUrl}
                                        alt="QR"
                                        style={styles.qrThumb}
                                    />
                                </div>
                                <p style={styles.historyText}>{entry.input.length > 30 ? entry.input.slice(0, 30) + "..." : entry.input}</p>
                                <p style={styles.historyMeta}>{entry.format} · {entry.date}</p>
                                <button
                                    style={styles.downloadSmallBtn}
                                    onClick={() => downloadFromHistory(entry)}
                                >
                                    Descargar
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {modal && (
                <div style={styles.overlay} onClick={() => setModal(null)}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h3 style={styles.modalTitle}>✅ QR Generado</h3>
                        <div style={{
                            ...styles.qrModalBg,
                            background: "#f0f4f8",
                        }}>
                            <img src={modal.dataUrl} alt="QR" style={styles.qrModalImg} />
                        </div>
                        <p style={styles.modalUrl}>{modal.input.length > 40 ? modal.input.slice(0, 40) + "..." : modal.input}</p>
                        <div style={styles.modalBtns}>
                            <button style={styles.btnDownload} onClick={downloadQR}>
                                ⬇ Descargar {modal.format}
                            </button>
                            <button style={styles.btnClose} onClick={() => setModal(null)}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#f5f7fa",
        fontFamily: "'Segoe UI', sans-serif",
        paddingBottom: "60px",
    },
    header: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 20px 20px",
        background: "#ffffff",
        borderBottom: "1px solid #e8edf2",
        marginBottom: "30px",
    },
    logo: {
        height: "60px",
        objectFit: "contain",
        marginBottom: "8px",
    },
    subtitle: {
        color: "#5a6a7e",
        fontSize: "15px",
        margin: 0,
    },
    card: {
        maxWidth: "720px",
        margin: "0 auto",
        background: "#ffffff",
        borderRadius: "12px",
        padding: "30px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
    },
    field: {
        marginBottom: "20px",
    },
    label: {
        display: "block",
        fontSize: "13px",
        fontWeight: "600",
        color: "#3a4a5c",
        marginBottom: "6px",
    },
    input: {
        width: "100%",
        padding: "12px 16px",
        fontSize: "15px",
        border: "1.5px solid #d0dbe8",
        borderRadius: "8px",
        outline: "none",
        boxSizing: "border-box",
        color: "#1a2c5b",
        background: "#f8fafc",
        transition: "border 0.2s",
    },
    row: {
        display: "flex",
        gap: "16px",
        marginBottom: "24px",
    },
    colorWrapper: {
        display: "flex",
        alignItems: "center",
        background: "#1a2c5b",
        borderRadius: "8px",
        padding: "0 12px",
        gap: "8px",
        height: "46px",
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
    },
    colorDot: {
        width: "14px",
        height: "14px",
        borderRadius: "50%",
        flexShrink: 0,
        border: "1px solid #ffffff44",
    },
    colorHex: {
        color: "#ffffff",
        fontSize: "13px",
        fontFamily: "monospace",
        flex: 1,
    },
    colorInputHidden: {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity: 0,
        cursor: "pointer",
        border: "none",
        padding: 0,
        margin: 0,
    },
    selectWrapper: {
        display: "flex",
        alignItems: "center",
        background: "#1a2c5b",
        borderRadius: "8px",
        padding: "0 12px",
        gap: "8px",
    },
    select: {
        flex: 1,
        padding: "12px 0",
        fontSize: "15px",
        border: "none",
        background: "transparent",
        color: "#ffffff",
        outline: "none",
        cursor: "pointer",
        width: "100%",
    },
    btn: {
        width: "100%",
        padding: "14px",
        background: "#1a2c5b",
        color: "#ffffff",
        fontSize: "16px",
        fontWeight: "600",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        transition: "background 0.2s",
    },
    historySection: {
        maxWidth: "720px",
        margin: "30px auto 0",
        padding: "0 20px",
    },
    historyHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px",
    },
    historyTitle: {
        fontSize: "20px",
        fontWeight: "700",
        color: "#1a2c5b",
        margin: 0,
    },
    clearBtn: {
        background: "transparent",
        border: "1.5px solid #d0dbe8",
        borderRadius: "6px",
        padding: "6px 14px",
        fontSize: "13px",
        color: "#5a6a7e",
        cursor: "pointer",
    },
    emptyHistory: {
        textAlign: "center",
        color: "#9aacbe",
        fontSize: "14px",
        padding: "30px 0",
    },
    historyGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        gap: "16px",
    },
    historyCard: {
        background: "#ffffff",
        borderRadius: "10px",
        padding: "12px",
        boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "6px",
    },
    qrPreviewBg: {
        borderRadius: "8px",
        padding: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    qrThumb: {
        width: "90px",
        height: "90px",
        objectFit: "contain",
    },
    historyText: {
        fontSize: "11px",
        color: "#3a4a5c",
        textAlign: "center",
        margin: 0,
        wordBreak: "break-all",
    },
    historyMeta: {
        fontSize: "10px",
        color: "#9aacbe",
        margin: 0,
    },
    downloadSmallBtn: {
        background: "#1a2c5b",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        padding: "6px 12px",
        fontSize: "12px",
        cursor: "pointer",
        width: "100%",
    },
    overlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
    },
    modal: {
        background: "#ffffff",
        borderRadius: "16px",
        padding: "32px",
        width: "90%",
        maxWidth: "360px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
    },
    modalTitle: {
        fontSize: "20px",
        fontWeight: "700",
        color: "#1a2c5b",
        margin: 0,
    },
    qrModalBg: {
        borderRadius: "12px",
        padding: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    qrModalImg: {
        width: "200px",
        height: "200px",
        objectFit: "contain",
    },
    modalUrl: {
        fontSize: "12px",
        color: "#5a6a7e",
        textAlign: "center",
        margin: 0,
        wordBreak: "break-all",
    },
    modalBtns: {
        display: "flex",
        gap: "12px",
        width: "100%",
    },
    btnDownload: {
        flex: 1,
        background: "#1a2c5b",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        padding: "12px",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
    },
    btnClose: {
        flex: 1,
        background: "transparent",
        color: "#1a2c5b",
        border: "1.5px solid #1a2c5b",
        borderRadius: "8px",
        padding: "12px",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
    },
};