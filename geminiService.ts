
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseSpeciesFromText = async (text: string) => {
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
};

export const getBirdInsight = async (speciesName: string, notes: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `关于鸟种“${speciesName}”，我有如下观测笔记：“${notes}”。请提供一小段（50字以内）关于该鸟种的趣味科普或观测建议。`
  });
  return response.text;
};
