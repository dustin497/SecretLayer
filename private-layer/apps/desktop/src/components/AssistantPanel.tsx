import { useState } from "react";

type Message = { role: "user" | "assistant" | "action"; content: string };

const AGENT_URL = "http://127.0.0.1:8790";

export function AssistantPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "I'm your local action assistant. I run on your machine only. Tell me what to plan, write, or reorganize — I'll propose actions for your approval.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch(`${AGENT_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply ?? "No response." },
        ...(data.pending_actions?.length
          ? [{ role: "action" as const, content: `Pending actions:\n${data.pending_actions.join("\n")}` }]
          : []),
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Agent offline. Start it: cd packages/agent && python -m agent serve",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)", maxWidth: 900 }}>
      <div
        style={{
          flex: 1,
          overflow: "auto",
          background: "#0c0c14",
          border: "1px solid #1f1f2e",
          borderRadius: 12,
          padding: "1rem",
          marginBottom: "1rem",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              marginBottom: "1rem",
              padding: "0.75rem 1rem",
              borderRadius: 8,
              background:
                msg.role === "user" ? "#1e1b4b" : msg.role === "action" ? "#1a1a0a" : "#111118",
              borderLeft: `3px solid ${
                msg.role === "user" ? "#7c3aed" : msg.role === "action" ? "#ca8a04" : "#4b5563"
              }`,
            }}
          >
            <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginBottom: 4, textTransform: "uppercase" }}>
              {msg.role}
            </div>
            <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{msg.content}</div>
          </div>
        ))}
        {loading && <div style={{ color: "#9ca3af" }}>Thinking locally…</div>}
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Plan my week, reorganize client docs, draft business profile…"
          rows={2}
          style={{
            flex: 1,
            padding: "0.75rem",
            borderRadius: 8,
            border: "1px solid #374151",
            background: "#0a0a12",
            color: "#f3f4f6",
            resize: "none",
          }}
        />
        <button
          type="button"
          onClick={send}
          disabled={loading}
          style={{
            padding: "0 1.25rem",
            borderRadius: 8,
            border: "none",
            background: "#6d28d9",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
