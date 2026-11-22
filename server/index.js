import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const PORT = process.env.PORT || 8787;
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, configured: Boolean(apiKey) });
});

app.post("/api/scenes", async (req, res) => {
  try {
    if (!ai) return res.status(503).json({ error: "GEMINI_API_KEY सेट नहीं है। पहले .env फ़ाइल में API key जोड़ें।" });
    const { story, style = "Traditional 2D Indian cartoon animation, hand-drawn look, bold clean outlines, cel shading, vibrant natural colors, expressive faces. Not 3D, not Pixar, not photorealistic.", count = 8 } = req.body;
    if (!story?.trim()) return res.status(400).json({ error: "पहले कहानी लिखें।" });
    const prompt = `You are a Hindi cartoon storyboard writer. Split the story into ${Math.min(Math.max(Number(count) || 8, 1), 30)} sequential scenes. Preserve every important story event and all dialogue; do not invent character changes. Return ONLY valid JSON: {"title":"...","characters":[{"name":"...","visual_description":"..."}],"scenes":[{"number":1,"heading":"...","visual":"Detailed visual action and setting in English for image generation. Keep character appearance consistent.","dialogue":"Exact Hindi dialogue if present, otherwise empty string","narration":"Hindi narration if present, otherwise empty string","image_prompt":"Complete standalone image prompt in English. ${style} Include only this scene, not a collage. No text, no watermark."}]}. Story language and dialogue must remain Hindi. Do not omit events. Story:\n${story}`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    const raw = response.text || "";
    const data = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, ""));
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "सीन बनाते समय समस्या हुई: " + (e.message || "Unknown error") });
  }
});

app.post("/api/image", async (req, res) => {
  try {
    if (!ai) return res.status(503).json({ error: "GEMINI_API_KEY सेट नहीं है।" });
    const { prompt } = req.body;
    if (!prompt?.trim()) return res.status(400).json({ error: "Image prompt खाली है।" });
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image",
      contents: prompt,
      config: { responseModalities: ["IMAGE", "TEXT"] }
    });
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);
    if (!part) throw new Error("मॉडल ने इमेज नहीं लौटाई। API मॉडल उपलब्धता और बिलिंग जाँचें।");
    res.json({ mimeType: part.inlineData.mimeType || "image/png", image: part.inlineData.data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "इमेज बनाते समय समस्या हुई: " + (e.message || "Unknown error") });
  }
});

// Video generation is intentionally not faked. It needs a supported Veo model/API and billing access.
app.get("/api/video-status", (_req, res) => {
  res.json({ available: false, message: "वीडियो जनरेशन के लिए अलग Veo API सेटअप और उपलब्धता जाँच बाकी है।" });
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, "../dist");
app.use(express.static(distPath));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(distPath, "index.html"), err => { if (err) next(); });
});

app.listen(PORT, () => console.log(`TNK Cartoon Studio server running on http://localhost:${PORT}`));
