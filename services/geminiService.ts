import { GoogleGenAI, Type } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key not found");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateTagsForContent = async (description: string, imageBase64?: string): Promise<string[]> => {
  const ai = getClient();
  if (!ai) return ["genel", "yeni", "paylaşım"];

  try {
    const parts: any[] = [];
    
    if (imageBase64) {
      // Clean base64 string if it contains data URI prefix
      const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64
        }
      });
    }

    parts.push({
      text: `Bu içerik için 5 adet kısa, tek kelimelik Türkçe etiket oluştur. İçerik açıklaması: "${description}". Yanıtı sadece JSON dizisi olarak ver.`
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return ["genel"];
  } catch (error) {
    console.error("Gemini tagging error:", error);
    return ["otomatik", "etiket", "hatası"];
  }
};

export const chatInRoom = async (history: string[], newMessage: string): Promise<string> => {
   const ai = getClient();
   if (!ai) return "Sistem şu an meşgul.";

   try {
     const response = await ai.models.generateContent({
       model: 'gemini-2.5-flash',
       contents: `Sen bir film izleme odasında sohbet eden arkadaş canlısı bir botsun. 
       
       Sohbet Geçmişi:
       ${history.join('\n')}
       
       Kullanıcı: ${newMessage}
       
       Kısa, eğlenceli ve Türkçe cevap ver.`,
     });
     return response.text || "Haha, evet!";
   } catch (e) {
     return "Bağlantı koptu...";
   }
};