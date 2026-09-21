import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import knowledge from "./scroll_knowledge.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, "citas_agendadas.json");

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Función de reintento automático si Gemini responde 503
async function generateContentWithRetry(params, retries = 3, delayMs = 1500) {
  for (let i = 0; i < retries; i++) {
    try {
      return await ai.models.generateContent(params);
    } catch (error) {
      const is503 = error.status === 503 || (error.message && error.message.includes("503"));
      if (is503 && i < retries - 1) {
        console.warn(`[Gemini 503] Servidor ocupado. Reintentando en ${delayMs}ms... (${i + 1}/${retries})`);
        await new Promise((res) => setTimeout(res, delayMs));
      } else {
        throw error;
      }
    }
  }
}

// Endpoint Chat Web (Simulador Demo)
app.post("/api/chat-web", async (req, res) => {
  try {
    const { message, nombreNegocio, rubroNegocio } = req.body;

    let systemInstruction = "";

    if (nombreNegocio && rubroNegocio) {
      systemInstruction = `
        Eres la asistente virtual oficial de "${nombreNegocio}" (Rubro: ${rubroNegocio}).
        
        REGLAS DE SIMULACIÓN Y ROLEPLAY:
        1. Responde a la duda del cliente actuando como la mejor vendedora / atención al cliente de "${nombreNegocio}".
        2. Mantén un tono comercial amable, profesional, muy fluido y corto (máximo 2 a 3 oraciones para agilizar la prueba).
        3. SI TE PREGUNTAN POR PRECIOS, UBICACIÓN, HORARIOS, PLANES O CONTACTO: Inventa datos coherentes, verosímiles y realistas que encajen perfectamente con "${nombreNegocio}".
        4. NUNCA rompas el personaje. NO menciones que eres una demo, NO añadas avisos sobre Scroll Studios al final y NO vendas llamadas de asesoría en el texto. La inmersión debe ser del 100%.
      `;
    } else {
      systemInstruction = `
        Eres el simulador de prueba interactivo de Scroll Studios.
        Si el usuario no ha ingresado los datos de su empresa, salúdalo amablemente e invítalo a escribir el nombre y rubro de su negocio en el formulario superior para activar la prueba.
      `;
    }

    const response = await generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: message,
      config: { systemInstruction }
    });

    res.json({ reply: response.text });
  } catch (error) {
    console.error("Error en /api/chat-web:", error);
    res.status(500).json({ error: "Servicio no disponible temporalmente." });
  }
});

// Endpoint exclusivo para WhatsApp (Avi)
app.post("/api/chat-wsp", async (req, res) => {
  try {
    const { message, prompt, systemInstruction } = req.body;
    const userMessage = message || prompt;

    if (!userMessage) {
      return res.status(400).json({ error: "El mensaje es requerido." });
    }

    const instructionToUse = systemInstruction || "Eres Avi, la asistente comercial de Scroll Studios.";

    const response = await generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: userMessage,
      config: { systemInstruction: instructionToUse }
    });

    res.json({ reply: response.text });
  } catch (error) {
    console.error("Error en /api/chat-wsp:", error);
    res.status(500).json({ error: "Error al procesar la solicitud en WhatsApp.", details: error.message });
  }
});

app.get("/api/citas", (req, res) => {
  if (fs.existsSync(DB_FILE)) {
    const citas = JSON.parse(fs.readFileSync(DB_FILE));
    res.json(citas);
  } else {
    res.json([]);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});