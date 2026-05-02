import { useState, useEffect, useRef } from "react";
import "./App.css";

const CHATS_KEY = "chatnote_chats";

export default function App() {
  const [chats, setChats] = useState(() => {
    try {
      const saved = localStorage.getItem(CHATS_KEY);
      return saved ? JSON.parse(saved) : { "Chat 1": [] };
    } catch {
      return { "Chat 1": [] };
    }
  });
  const [activeChat, setActiveChat] = useState("Chat 1");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [counter, setCounter] = useState(1);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, activeChat]);

  const newChat = () => {
    const n = counter + 1;
    setCounter(n);
    const name = `Chat ${n}`;
    setChats((prev) => ({ ...prev, [name]: [] }));
    setActiveChat(name);
  };

  const deleteChat = (name, e) => {
    e.stopPropagation();
    setChats((prev) => {
      const updated = { ...prev };
      delete updated[name];
      if (!Object.keys(updated).length) return { "Chat 1": [] };
      return updated;
    });
    const remaining = Object.keys(chats).filter((k) => k !== name);
    setActiveChat(remaining[0] || "Chat 1");
  };

  const autoResize = (el) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    const updated = [...(chats[activeChat] || []), userMsg];
    setChats((prev) => ({ ...prev, [activeChat]: updated }));
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated.slice(-10) }),
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setChats((prev) => ({
        ...prev,
        [activeChat]: [...updated, { role: "assistant", content: data.reply }],
      }));
    } catch {
      setChats((prev) => ({
        ...prev,
        [activeChat]: [
          ...updated,
          {
            role: "assistant",
            content:
              "⚠️ Backend se connect nahi ho paya.\n\nCheck karo:\n• Python server chalu hai? (uvicorn main:app --reload)\n• localhost:8000 pe run ho raha hai?",
          },
        ],
      }));
    }
    setLoading(false);
  };

  const msgs = chats[activeChat] || [];
  const tokenCount = Math.round(
    msgs.reduce((a, m) => a + m.content.length / 4, 0),
  );

  return (
    <div className="app">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sb-top">
          <div className="logo-row">
            <div className="logo-box">✦</div>
            <div>
              <div className="logo-text">ChatNote</div>
              <div className="logo-sub">AI Assistant</div>
            </div>
          </div>
          <button className="new-btn" onClick={newChat}>
            <div className="plus-icon">+</div>
            New conversation
          </button>
        </div>

        <p className="sec-label">Recent</p>

        <div className="chat-list">
          {Object.keys(chats).map((name) => (
            <div
              key={name}
              className={`chat-item ${name === activeChat ? "active" : ""}`}
              onClick={() => setActiveChat(name)}
            >
              <div className="c-dot" />
              <span className="chat-name">{name}</span>
              <button
                className="del-btn"
                onClick={(e) => deleteChat(name, e)}
                title="Delete"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="sb-foot">
          <div className="model-pill">
            <div className="model-dot" />
            <span className="model-text">Groq · llama-3.3-70b</span>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main">
        {/* Topbar */}
        <div className="topbar">
          <span className="tb-title">{activeChat}</span>
          <div className="tb-right">
            <span className="tk-badge">~{tokenCount} tokens</span>
            <span className="live-badge">● Live</span>
          </div>
        </div>

        {/* Messages */}
        <div className="msgs">
          {!msgs.length ? (
            <div className="empty">
              <div className="empty-orb">✦</div>
              <p className="empty-title">Koi bhi sawaal pucho</p>
              <p className="empty-sub">
                Groq ke saath powered — fast responses, bilkul free
              </p>
            </div>
          ) : (
            msgs.map((m, i) => (
              <div
                key={i}
                className={`msg-row ${m.role === "user" ? "user" : "ai"}`}
              >
                <div className={`av ${m.role === "user" ? "u" : "a"}`}>
                  {m.role === "user" ? "U" : "AI"}
                </div>
                <div className="bubble">{m.content}</div>
              </div>
            ))
          )}

          {loading && (
            <div className="msg-row ai">
              <div className="av a">AI</div>
              <div className="bubble">
                <div className="typing">
                  <div className="dot" />
                  <div className="dot" />
                  <div className="dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="input-wrap">
          <div className="input-box">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                autoResize(e.target);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask anything here..."
              rows={1}
            />
            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
            >
              <svg width="15" height="15" fill="white" viewBox="0 0 16 16">
                <path d="M2.5 8L13.5 2.5L10 8L13.5 13.5L2.5 8Z" />
              </svg>
            </button>
          </div>
          <p className="hint">Enter = bhejo · Shift+Enter = naya line</p>
        </div>
      </main>
    </div>
  );
}
