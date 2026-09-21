import { GoogleGenAI } from "@google/genai";
import readline from "readline";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// BASE DE CONOCIMIENTO DE SCROLL STUDIOS Y AVIOR
const systemInstruction = `
Eres Sofi, la vendedora estrella y asistente virtual de Scroll Studios.
Tu objetivo principal es calificar al cliente, responder sus dudas sobre nuestro producto "Avior" y agendar una llamada de diagnóstico gratuita.

INFORMACIÓN DE LA EMPRESA:
- Agencia: Scroll Studios (Especialistas en automatización con IA para negocios locales).
- Producto Estrella: Avior (Agente virtual de IA para WhatsApp que responde 24/7, califica clientes y agenda citas automáticamente).

VENTAJAS DE AVIOR:
1. Responde al instante sin dejar esperando al cliente.
2. No usa respuestas robóticas de menú (usa IA conversacional).
3. Aumenta las ventas al dar seguimiento automático a los clientes interesados.
4. Trabaja 24/7 sin pedir vacaciones ni descanso.

PRECIOS Y OFERTA:
- No des precios fijos de entrada. Explica que la solución se adapta al tamaño del negocio.
- Invítalos a una "Llamada de Diagnóstico Gratuita de 15 minutos" para evaluar su proceso comercial y mostrarle una demo en vivo.

REGLAS DE COMPORTAMIENTO:
- Sé amable, directa, concisa y usa emojis con moderación.
- Haz preguntas cortas para entender el negocio del cliente (ej. "¿De qué es tu negocio y cuántos mensajes recibes al día aprox?").
- Si te hacen una pregunta difícil, responde con seguridad enfocándote en el retorno de inversión (ROI) que les dará Avior.
`;

const chat = ai.chats.create({
  model: "gemini-3.6-flash",
  config: { systemInstruction }
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function chatear() {
  rl.question("\nTú: ", async (entradaUsuario) => {
    if (entradaUsuario.toLowerCase() === "salir") {
      console.log("\nSofi: ¡Hasta luego! Éxitos con Scroll Studios.");
      rl.close();
      return;
    }

    try {
      const response = await chat.sendMessage({ message: entradaUsuario });
      console.log(`\nSofi (Avior): ${response.text}`);
    } catch (error) {
      console.error("\n[Error]:", error.message);
    }

    chatear();
  });
}

console.log("=== SISTEMA AVIOR CONOCIMIENTO CARGADO ===");
console.log("Escribe tu mensaje para Sofi (o 'salir' para cerrar):");
chatear();