import calorieDB from '../data/calorie-db.json';

interface CalorieEntry {
  name: string;
  keywords: string[];
  calories: number; // 每份热量 (kcal)
  unit: string;
}

const database = calorieDB as CalorieEntry[];

// 常见食物同义词表：[别名, 规范名]，解决“西红柿/番茄”这类同义词匹配不到的问题
const SYNONYMS: [string, string][] = [
  ['西红柿', '番茄'],
  ['马铃薯', '土豆'],
  ['洋芋', '土豆'],
  ['包菜', '卷心菜'],
  ['圆白菜', '卷心菜'],
  ['甘蓝', '卷心菜'],
  ['凤梨', '菠萝'],
  ['豆角', '四季豆'],
  ['豇豆', '四季豆'],
  ['角瓜', '西葫芦'],
  ['倭瓜', '南瓜'],
  ['奇异果', '猕猴桃'],
  ['车厘子', '樱桃'],
];

// 文本归一化：把别名统一替换为规范名
function normalizeFoodText(text: string): string {
  let result = text;
  for (const [alias, canonical] of SYNONYMS) {
    if (result.includes(alias)) {
      result = result.split(alias).join(canonical);
    }
  }
  return result;
}

// 本地关键词模糊匹配（内置库 + 用户自定义食物，支持同义词归一化）
export function matchCalorieLocal(
  foodName: string,
  customFoods: CalorieEntry[] = []
): { calories: number; matched: string } | null {
  const name = normalizeFoodText(foodName.toLowerCase().trim());
  const allEntries = [...database, ...customFoods];

  // 精确匹配
  for (const entry of allEntries) {
    if (normalizeFoodText(entry.name.toLowerCase()) === name) {
      return { calories: entry.calories, matched: entry.name };
    }
  }

  // 关键词匹配
  let bestMatch: CalorieEntry | null = null;
  let bestScore = 0;

  for (const entry of allEntries) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (name.includes(normalizeFoodText(kw.toLowerCase()))) {
        score += kw.length; // 更长的关键词匹配得分更高
      }
    }
    // 名称包含匹配
    const entryName = normalizeFoodText(entry.name.toLowerCase());
    if (name.includes(entryName) || entryName.includes(name)) {
      score += entry.name.length;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  if (bestMatch && bestScore > 0) {
    return { calories: bestMatch.calories, matched: bestMatch.name };
  }

  return null;
}

// AI 图片识别热量（调用 OpenAI Vision API）
export async function recognizeCalorieByAI(
  imageBase64: string,
  apiKey: string
): Promise<{ calories: number; foodName: string; description: string }> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: '你是一个营养学专家。用户会发送食物图片，请识别食物并估算总热量。请以JSON格式回复：{"foodName": "食物名称", "calories": 热量数值(kcal), "description": "简短描述"}。只返回JSON，不要其他内容。',
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
            },
          ],
        },
      ],
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '';

  try {
    // 尝试解析JSON
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(jsonStr);
    return {
      calories: Number(result.calories) || 0,
      foodName: result.foodName || '未知食物',
      description: result.description || '',
    };
  } catch {
    return { calories: 0, foodName: '识别失败', description: content };
  }
}

// 将图片文件转为 base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // 去掉 data:image/xxx;base64, 前缀
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
