import { GoogleGenAI } from "@google/genai";
import { ConfigJSON, ReportJSON } from "../types";

// NOTE: Ensure REACT_APP_API_KEY or process.env.API_KEY is available.
const API_KEY = process.env.API_KEY || ''; 

export const analyzeSubmission = async (
  content: File | string, 
  config: ConfigJSON,
  type: 'IMAGE' | 'VIDEO' | 'URL' | 'IMAGE_URL'
): Promise<ReportJSON> => {
  
  if (!API_KEY) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  // Use pro model for complex reasoning and video/URL context
  const modelId = 'gemini-3-pro-preview'; 

  const systemPrompt = `
    You are a strict brand compliance reviewer. Output valid JSON only.
    You will analyze the provided content against the following Brand Evaluation Configuration:
    ${JSON.stringify(config, null, 2)}

    For URLs (especially YouTube), assume the content is visible to you via your internal knowledge or tools, or analyze the context provided in the URL text itself if pixel data is unavailable.
    For Images/Videos, analyze the visual pixels.

    Output a JSON object matching this schema exactly, do not add markdown backticks:
    {
      "overall": { "score": 0-100, "decision": "pass|needs_changes", "summary": "string" },
      "category_scores": [ { "category": "string", "score": number, "notes": "string" } ],
      "issues": [
        {
          "issue_id": "string",
          "rule_id": "string (referencing config)",
          "category": "colors|typography|layout|logo|audio|video|other",
          "severity": "blocker|high|medium|low",
          "confidence": 0-1 (float),
          "title": "string",
          "description": "string",
          "evidence": {
             "coordinates": { "x": 0-1, "y": 0-1, "w": 0-1, "h": 0-1 },
             "timestamp_range": { "start_ms": number, "end_ms": number } 
          },
          "recommendation": { "action": "string", "details": "string" }
        }
      ],
      "editor_action_list": [ { "priority": number, "action": "string", "related_issue_ids": ["string"] } ]
    }
  `;

  try {
    let parts: any[] = [{ text: systemPrompt }];

    if (type === 'URL' && typeof content === 'string') {
        // Pass URL as text prompt
        parts.push({ text: `Please analyze the brand compliance of the content at this URL: ${content}` });
    } else if (type === 'IMAGE_URL' && typeof content === 'string') {
         try {
             // Attempt to fetch pixels for Image URL
             const base64 = await urlToBase64(content);
             parts.push({
                inlineData: {
                    mimeType: 'image/jpeg', // Defaulting to jpeg for generic base64
                    data: base64.split(',')[1]
                }
             });
         } catch (e) {
             console.warn("CORS or network error fetching image URL. Falling back to URL text analysis.", e);
             parts.push({ text: `Please analyze the image at this URL (I could not fetch pixels directly): ${content}` });
         }
    } else if (content instanceof File) {
        // Pass File bytes
        const base64 = await fileToBase64(content);
        const mimeType = content.type;
        parts.push({
            inlineData: {
                mimeType: mimeType,
                data: base64.split(',')[1]
            }
        });
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        role: 'user',
        parts: parts
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    // Clean potential markdown blocks if the model ignores the instruction
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr) as ReportJSON;

  } catch (error) {
    console.error("AI Analysis failed", error);
    throw error;
  }
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const urlToBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Network response was not ok');
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};