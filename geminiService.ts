
import { GoogleGenAI, Type } from "@google/genai";
import { SearchResult } from "./types";

const SYSTEM_INSTRUCTION = `نقش (Role): پژوهشگر ارشد و تحلیل‌گر آرشیو بیانات در سایت farsi.khamenei.ir.
هدف: یافتن دقیقاً ۱۰ رکورد واقعی و مستند مرتبط با موضوع ورودی کاربر و ارائه یک روایت کلی (Narrative) از دیدگاه رهبری.

الگوریتم جستجو و تحلیل (Search & Analysis Logic):
۱. منبع: منحصراً دامنه farsi.khamenei.ir.
۲. دقت لینک: لینک (searchLink) باید مستقیماً به صفحه متن بیانات (speech-content) ختم شود.
۳. روایت کلی (summary): یک پاراگراف بسیار کوتاه و عصاره‌گیری شده (حداکثر ۵۰ تا ۶۰ کلمه) درباره نگاه کلان حضرت آیت‌الله خامنه‌ای به این موضوع بنویس. این روایت باید بسیار دقیق و نافذ باشد.
۴. نکات کلیدی (keyPoints): ۳ عبارت کوتاه و کلیدی که چکیده دیدگاه ایشان است.
۵. وضعیت رسانه: مشخص کن آیا فیلم، صوت یا متن در صفحه موجود است.
۶. زمان (timestamp): اگر ویدیو یا صوت موجود است، زمان دقیق (دقیقه:ثانیه) شروع جمله کلیدی را با فرمت MM:SS (مثلاً ۰۴:۱۵) ذکر کن.

خروجی JSON:
- summary: شامل "narrative" (تحلیل فشرده) و "keyPoints" (۳ نکته کوتاه).
- records: آرایه‌ای از ۱۰ شیء شامل title، date (شمسی)، keySentence، mediaStatus، searchLink، و timestamp (MM:SS).`;

export async function fetchArchiveRecords(keyword: string): Promise<SearchResult> {
  // Fix: Always create a new GoogleGenAI instance right before making an API call to ensure use of the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `موضوع پژوهش: «${keyword}». ۱۰ رکورد با لینک مستقیم و روایت فشرده استخراج کن.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.OBJECT,
              properties: {
                narrative: { type: Type.STRING },
                keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["narrative", "keyPoints"]
            },
            records: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  date: { type: Type.STRING },
                  keySentence: { type: Type.STRING },
                  mediaStatus: { type: Type.STRING },
                  searchLink: { type: Type.STRING },
                  timestamp: { type: Type.STRING },
                },
                required: ["title", "date", "keySentence", "mediaStatus", "searchLink"]
              }
            }
          },
          required: ["summary", "records"]
        }
      },
    });

    // Fix: Extract JSON string robustly, as Search Grounding responses can sometimes include conversational text or markdown blocks that interfere with direct JSON parsing.
    let jsonStr = response.text.trim();
    if (jsonStr.includes("```json")) {
      jsonStr = jsonStr.split("```json")[1].split("```")[0].trim();
    } else if (jsonStr.includes("```")) {
      jsonStr = jsonStr.split("```")[1].split("```")[0].trim();
    }
    
    const data = JSON.parse(jsonStr);
    
    // Always extract grounding chunks for search links as per guidelines
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const groundingLinks = groundingChunks
      ?.map((chunk: any) => chunk.web)
      .filter((web: any) => web && web.uri);

    return {
      summary: data.summary,
      records: data.records.map((r: any, index: number) => ({ ...r, id: `rec-${index}` })),
      groundingLinks: groundingLinks
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
