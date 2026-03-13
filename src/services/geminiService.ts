import { GoogleGenAI, Type } from "@google/genai";
import { GeneratorSettings, SlideContent } from "../types";

export async function generateSlideContent(settings: GeneratorSettings): Promise<SlideContent[]> {
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please check your environment variables.");
  }
  
  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";
  
  const prompt = `Generate a detailed presentation about "${settings.topic}".
  User Context: ${settings.customPrompt}
  Number of content slides needed: ${settings.slideLimit} (excluding intro slide).
  
  For each slide, provide:
  1. A clear title.
  2. 5 to 10 detailed, humanized bullet points.
  3. A descriptive prompt for an image that would complement this slide.
  
  Format the response as a JSON array of objects.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              points: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              imagePrompt: { type: Type.STRING }
            },
            required: ["title", "points", "imagePrompt"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (e: any) {
    console.error("AI Generation Error:", e);
    if (e.message?.includes("API_KEY_INVALID")) {
      throw new Error("Invalid Gemini API Key. Please verify your key in Settings.");
    }
    throw new Error(`Failed to generate presentation: ${e.message || "Unknown error"}`);
  }
}

export async function generateSlideImage(prompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    console.error("Gemini API Key is missing for image generation.");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ parts: [{ text: prompt }] }],
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (e: any) {
    console.error("Image generation failed:", e);
    return null;
  }
}
