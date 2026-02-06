// /pages/api/chatbot.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  const { messages } = req.body;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not set on server." });
  }

  try {
    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          ...messages
        ],
        max_tokens: 128
      })
    });

    if (!aiRes.ok) {
      const text = await aiRes.text().catch(() => "(no body)");
      console.error("OpenRouter error", { status: aiRes.status, body: text });
      return res.status(502).json({ error: "AI backend error", status: aiRes.status, body: text });
    }

    const data = await aiRes.json();
    const reply = data.choices?.[0]?.message?.content || "(No response)";
    return res.status(200).json({ ai: reply });
  } catch (err) {
    console.error("Error calling OpenRouter:", err);
    return res.status(500).json({ error: "Failed to reach AI backend.", detail: String(err) });
  }
}
