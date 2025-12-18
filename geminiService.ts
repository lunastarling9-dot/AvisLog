
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const checkOnline = () => navigator.onLine;

export const parseSpeciesFromText = async (text: string) => {
  if (!checkOnline()) {
    throw new Error('OFFLINE: AI parsing requires an internet connection.');
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        请从以下关于鸟类的文本中提取鸟类物种信息，并以 JSON 数组的形式返回。
        每个对象必须包含：
        - name: 中文名
        - latinName: 拉丁学名
        - order: 目
        - family: 科
        - genus: 属
        - distribution: 理论分布的省份列表（必须是中国省份名称，例如：北京市, 广东省...）
        - description: 简短描述

        文本内容：
        ${text}
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              latinName: { type: Type.STRING },
              order: { type: Type.STRING },
              family: { type: Type.STRING },
              genus: { type: Type.STRING },
              distribution: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              description: { type: Type.STRING }
            },
            required: ["name", "latinName", "order", "family", "genus", "distribution"]
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const getBirdInsight = async (speciesName: string, notes: string) => {
  if (!checkOnline()) {
    return "当前处于离线状态，无法生成 AI 见解。";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `关于鸟种“${speciesName}”，我有如下观测笔记：“${notes}”。请提供一小段（50字以内）关于该鸟种的趣味科普或观测建议。`
    });
    return response.text;
  } catch (error) {
    return "AI 见解生成失败，请稍后重试。";
  }
};
