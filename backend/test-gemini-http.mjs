import dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("❌ Falta GEMINI_API_KEY en el .env");
  process.exit(1);
}

async function main() {
  try {
    const url =
      "https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro:generateContent?key=" +
      API_KEY;

    const prompt = "Dame un consejo corto de ahorro para un estudiante chileno.";

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("❌ Error HTTP de Gemini:", resp.status, resp.statusText);
      console.error(text);
      return;
    }

    const data = await resp.json();

    const texto =
      data.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || "")
        .join("") || "Sin texto devuelto";

    console.log("✅ Respuesta de Gemini:");
    console.log(texto);
  } catch (err) {
    console.error("Error llamando a Gemini v1:", err);
  }
}

main();
