import Tesseract from 'tesseract.js';

export interface OCRResult {
  merchantName: string;
  items: { name: string; price: number }[];
  rawText: string;
}

// 从截图中识别商家和菜品信息
export async function recognizeScreenshot(
  imageFile: File,
  onProgress?: (progress: number) => void
): Promise<OCRResult> {
  const { data } = await Tesseract.recognize(imageFile, 'chi_sim+eng', {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  const text = data.text;
  return parseOrderScreenshot(text);
}

// 解析OCR文本，提取商家名和菜品
function parseOrderScreenshot(text: string): OCRResult {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  let merchantName = '';
  const items: { name: string; price: number }[] = [];

  for (const line of lines) {
    // 尝试匹配价格模式：xxx ¥xx.xx 或 xxx xx元 或 xxx xx.xx
    const priceMatch = line.match(/^(.+?)[¥￥]?\s*(\d+\.?\d*)\s*元?$/);
    if (priceMatch) {
      const name = priceMatch[1].trim();
      const price = parseFloat(priceMatch[2]);
      // 过滤掉太短或明显不是菜品的
      if (name.length >= 2 && price > 0 && price < 500) {
        items.push({ name, price });
      }
    }

    // 尝试识别商家名（通常在前几行，或包含"店"、"餐厅"等关键词）
    if (!merchantName) {
      if (line.includes('店') || line.includes('餐厅') || line.includes('外卖') || line.includes('旗舰')) {
        merchantName = line.replace(/[外卖旗舰店餐厅]/g, '').trim() || line;
      }
    }
  }

  // 如果没找到商家名，用第一行
  if (!merchantName && lines.length > 0) {
    merchantName = lines[0];
  }

  return { merchantName, items, rawText: text };
}
