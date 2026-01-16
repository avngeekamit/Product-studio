
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedPrompts } from "./types";

export const generatePrompts = async (name: string, description: string): Promise<GeneratedPrompts> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `You are an AI product media generation agent.
    Task: Generate ONE detailed text prompt for TEXT-TO-IMAGE generation and ONE detailed text prompt for TEXT-TO-VIDEO generation for the following product:
    
    Product: ${name}
    Context: ${description}

    Rules for Image Prompt:
    - Use professional studio photography terminology.
    - Specify 85mm or 100mm macro lenses, shallow depth of field, softbox lighting, and clean minimalist backgrounds.
    - No text, logos, or watermarks.
    - Focus on texture, material quality, and sleek aesthetics.

    Rules for Video Prompt:
    - Cinematic product reveal style.
    - Specify camera movements: slow pan, gimbal tilt, or orbiting shots.
    - Mention high-speed phantom-style slow motion (120fps feel).
    - Focus on light reflections and dynamic angles.
    - No ads, captions, or voiceover descriptions.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          imagePrompt: { type: Type.STRING },
          videoPrompt: { type: Type.STRING }
        },
        required: ["imagePrompt", "videoPrompt"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    throw new Error("Failed to parse agent's output. Please try again.");
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
  // Re-instantiate to use the latest API key from session
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
        imageSize: "1K"
      }
    }
  });

  const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  if (part?.inlineData?.data) {
    return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Professional image generation failed to return data.");
};

export const generateVideo = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: '1080p',
      aspectRatio: '16:9'
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Cinematic video generation failed.");
  
  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  if (!response.ok) throw new Error("Failed to download generated video asset.");
  
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};
