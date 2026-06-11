type View = "assistant" | "documents" | "profiles" | "training" | "network" | "settings";

type Props = {
  view: View;
  onViewChange: (v: View) => void;
  onLock: () => void;
  status: { ollama_ok: boolean; agent_ok: boolean } | null;
};

const nav: { id: View; label: string }[] = [
  { id: "assistant", label: "Assistant" },
  { id: "documents", label: "Documents" },
  { id: "profiles", label: "Profiles" },
  { id: "training", label: "Training" },
  { id: "network", label: "Network Lab" },
  { id: "settings", label: "Settings" },
];

export function Sidebar({ view, onViewChange, onLock, status }: Props) {
  return (
    <aside
      style={{
        width: 220,
        background: "#08080f",
        borderRight: "1px solid #1f1f2e",
        padding: "1.25rem 0.75rem",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: "0 0.5rem 1.25rem" }}>
        <div style={{ fontWeight: 700, fontSize: "1rem" }}>PrivateLayer</div>
        <div style={{ fontSize: "0.7rem", color: "#a78bfa", marginTop: 2 }}>Dark Side</div>
        <div style={{ fontSize: "0.65rem", color: "#6b7280", marginTop: 8 }}>
          {status?.ollama_ok ? "● LLM" : "○ LLM"}
          {" · "}
          {status?.agent_ok ? "● Agent" : "○ Agent"}
        </div>
      </div>

      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        {nav.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onViewChange(item.id)}
            style={{
              textAlign: "left",
              padding: "0.55rem 0.75rem",
              borderRadius: 8,
              border: "none",
              background: view === item.id ? "#1e1b4b" : "transparent",
              color: view === item.id ? "#e9d5ff" : "#9ca3af",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <button
        type="button"
        onClick={onLock}
        style={{
          marginTop: "auto",
          padding: "0.6rem",
          borderRadius: 8,
          border: "1px solid #374151",
          background: "transparent",
          color: "#9ca3af",
          cursor: "pointer",
          fontSize: "0.85rem",
        }}
      >
        Lock vault
      </button>
    </aside>
  );
}
