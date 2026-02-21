import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedContent, TemplateType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateMarketingContent(topic: string, templatePrompt: string): Promise<GeneratedContent> {
  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are a world-class marketing expert. ${templatePrompt.replace('{topic}', topic)}
    
    After the content, provide a short JSON block with analytics:
    {
      "wordCount": number,
      "readingTime": number (in minutes),
      "sentiment": "Positive" | "Neutral" | "Professional",
      "keywords": string[]
    }`,
    config: {
      temperature: 0.7,
    }
  });

  const response = await model;
  const fullText = response.text || "";
  
  // Extract JSON analytics if present
  let text = fullText;
  let analytics = {
    wordCount: text.split(/\s+/).length,
    readingTime: Math.ceil(text.split(/\s+/).length / 200),
    sentiment: 'Professional' as const,
    keywords: [] as string[]
  };

  const jsonMatch = fullText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      analytics = { ...analytics, ...parsed };
      text = fullText.replace(jsonMatch[0], '').trim();
    } catch (e) {
      console.error("Failed to parse analytics JSON", e);
    }
  }

  // Generate an image prompt based on the content
  const imagePromptResponse = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Based on this content, create a highly detailed, professional, editorial-style image prompt for a marketing visual. Content: ${text.substring(0, 500)}`,
  });
  
  const imagePrompt = imagePromptResponse.text || `Professional marketing visual for ${topic}`;

  // Generate the image
  let imageUrl: string | undefined;
  try {
    const imageResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `Editorial photography, high-end marketing visual, clean composition: ${imagePrompt}` }],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
  } catch (e) {
    console.error("Image generation failed", e);
  }

  return {
    text,
    imageUrl,
    analytics
  };
}

export async function generateManuscript(topic: string): Promise<{ text: string; imagePrompt: string }> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Write a sophisticated, editorial-style opening for a marketing campaign about "${topic}". 
    The tone should be elevated, poetic, and professional. 
    Focus on the "why" and the "vision" behind the topic.
    Aim for about 150-200 words.
    
    After the text, provide a single line starting with "IMAGE_PROMPT:" followed by a detailed visual prompt for this campaign.`,
  });

  const fullText = response.text || "";
  const parts = fullText.split("IMAGE_PROMPT:");
  
  return {
    text: parts[0].trim(),
    imagePrompt: parts[1]?.trim() || `Professional editorial photography for ${topic}`
  };
}

export async function generateImage(prompt: string): Promise<string | undefined> {
  try {
    const imageResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `Editorial photography, high-end marketing visual, clean composition: ${prompt}` }],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (e) {
    console.error("Image generation failed", e);
  }
  return undefined;
}
