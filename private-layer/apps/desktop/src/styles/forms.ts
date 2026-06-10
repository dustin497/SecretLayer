import type React from "react";

export const panelStyle: React.CSSProperties = {
  background: "rgba(12, 12, 20, 0.95)",
  border: "1px solid #2a2a3d",
  borderRadius: 16,
  padding: "2rem",
  boxShadow: "0 0 60px rgba(88, 28, 135, 0.12)",
};

export const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: "0.35rem",
  padding: "0.65rem 0.75rem",
  borderRadius: 8,
  border: "1px solid #374151",
  background: "#0a0a12",
  color: "#f3f4f6",
};

export const primaryBtn: React.CSSProperties = {
  padding: "0.75rem 1.25rem",
  borderRadius: 8,
  border: "none",
  background: "linear-gradient(135deg, #6d28d9, #4c1d95)",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};

export const secondaryBtn: React.CSSProperties = {
  padding: "0.65rem 1rem",
  borderRadius: 8,
  border: "1px solid #374151",
  background: "transparent",
  color: "#e5e7eb",
  cursor: "pointer",
};
