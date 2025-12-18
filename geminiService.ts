
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const checkOnline = () => navigator.onLine;

/**
 * 本地高性能解析器：针对标准格式 "中文名 拉丁名" 或 "中文名 (拉丁名)" 进行正则快速解析
 * 这种任务确实很简单，不需要每次都求助于 AI
 */
const localSimpleParser = (text: string) => {
  const lines = text.split('\n');
  const results: any[] = [];
  // 匹配模式：中文名 + 空格或括号 + 拉丁名
  // 拉丁名通常是两个或三个英文单词，斜体或普通文本
  const pattern = /^([\u4e00-\u9fa5·]+)\s+([a-zA-Z]+\s+[a-z]+(?:\s+[a-z]+)?)/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = trimmed.match(pattern);
    if (match) {
      results.push({
        name: match[1],
        latinName: match[2],
        order: '待分类',
        family: '待分类',
        genus: match[2].split(' ')[0], // 属名通常是拉丁名的第一个单词
        distribution: [],
        description: '由本地解析器快速提取，您可以后续在管理中心完善资料。'
      });
    }
  }
  return results.length > 0 ? results : null;
};

export const parseSpeciesFromText = async (text: string) => {
  // 1. 尝试本地快速解析
  const localResults = localSimpleParser(text);
  if (localResults) return localResults;

  // 2. 如果本地解析无果，且在线，则请求 AI
  if (!checkOnline()) {
    throw new Error('OFFLINE: 无法识别该格式，且当前处于离线状态。');
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        作为鸟类学家，请从以下文本中提取所有鸟类物种。
        如果文本中只包含名称，请补全它们的分类信息（目、科、属）。
        分布省份必须使用中国标准省份全称。

        待处理文本：
        ${text}
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "中文名" },
              latinName: { type: Type.STRING, description: "拉丁学名" },
              order: { type: Type.STRING, description: "目" },
              family: { type: Type.STRING, description: "科" },
              genus: { type: Type.STRING, description: "属" },
              distribution: { 
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "分布省份列表"
              },
              description: { type: Type.STRING, description: "简短习性描述" }
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
