import { serve } from "bun";
import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const port = parseInt(process.env.PORT || "3000");

const cache = new Map<string, string>();

const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

serve({
  port,
  fetch: async (req) => {
    const url = new URL(req.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }
    if (req.method !== "POST") {
      return new Response(null, {
        status: 405,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }
    if (url.pathname !== "/api/enhance") {
      return new Response(null, {
        status: 404,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }
    const { text, tone }: { text: string; tone: number } = await req.json();
    const key = `${text}|${tone}`;
    if (cache.has(key)) {
      return new Response(JSON.stringify({ tonedData: cache.get(key)! }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const prompt = `You are a writing assistant specializing in tone adjustment. Please rewrite the following text, adjusting its tone based on a scale of 0-100, where:

0-33: Very casual and informal (like texting a close friend)
34-66: Balanced and neutral (standard professional communication)
67-100: Highly formal and academic

Original text: ${text}
Desired tone level: ${tone}

Please rewrite the text to match the specified tone level while preserving the original meaning.Only send the toned text`;

    try {
      const response = await genAI.models.generateContent({
        model: "gemini-2.0-flash",
        contents: { text: prompt },
      });
      const tonedData = response.text;
      if (tonedData) cache.set(key, tonedData);
      return new Response(JSON.stringify({ tonedData }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  },
});

console.log(`Server running on port ${port}`);
