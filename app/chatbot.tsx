"use client";
import { useState } from "react";

export default function ChatbotPage() {
  const [messages, setMessages] = useState([
    { sender: "ai", text: "Hello! How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages(msgs => [...msgs, { sender: "user", text: input }]);
    setLoading(true);
    try {
      // Use OpenRouter's free public endpoint for AI chat (no key required for small requests)
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            ...[...messages, { sender: "user", text: input }].map(m => ({
              role: m.sender === "ai" ? "assistant" : "user",
              content: m.text
            }))
          ],
          max_tokens: 128
        })
      });
      if (!res.ok) throw new Error("AI backend error");
      const data = await res.json();
      const aiText = data.choices?.[0]?.message?.content || "(No response)";
      setMessages(msgs => [...msgs, { sender: "ai", text: aiText }]);
    } catch (err) {
      setMessages(msgs => [...msgs, { sender: "ai", text: "Sorry, I couldn't reach the AI backend." }]);
    }
    setLoading(false);
    setInput("");
  }

  return (
    <div style={{ maxWidth: 500, margin: "2rem auto", padding: 24, border: "1px solid #ccc", borderRadius: 8, background: "#fafbfc" }}>
      <h2>AI Chatbot</h2>
      <div style={{ minHeight: 180, marginBottom: 16 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ textAlign: msg.sender === "ai" ? "left" : "right", margin: "0.5rem 0" }}>
            <span style={{ background: msg.sender === "ai" ? "#e0e0e0" : "#0070f3", color: msg.sender === "ai" ? "#222" : "#fff", padding: "0.5rem 1rem", borderRadius: 16, display: "inline-block", maxWidth: "80%" }}>{msg.text}</span>
          </div>
        ))}
        {loading && <div style={{ color: '#888', fontStyle: 'italic' }}>AI is typing...</div>}
      </div>
      <form onSubmit={sendMessage} style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your message..."
          style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid #aaa" }}
          disabled={loading}
        />
        <button type="submit" style={{ background: "#0070f3", color: "white", border: "none", borderRadius: 8, padding: "0.5rem 1rem", fontWeight: 500 }} disabled={loading}>Send</button>
      </form>
      <div style={{ fontSize: '0.9em', color: '#888', marginTop: 12 }}>
        Powered by OpenRouter (openrouter.ai, free tier, subject to rate limits)
      </div>
    </div>
  );
}
