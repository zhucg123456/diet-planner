import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { recognizeScreenshot, type OCRResult } from '../utils/ocr';
import { addMerchant, addMenuItem, getMerchants } from '../db';

export default function Import() {
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [merchantName, setMerchantName] = useState('');
  const [items, setItems] = useState<{ name: string; price: number; checked: boolean }[]>([]);
  const [imported, setImported] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setImage(URL.createObjectURL(f));
    setResult(null);
    setImported(false);
  };

  const handleRecognize = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    try {
      const res = await recognizeScreenshot(file, (p) => setProgress(p));
      setResult(res);
      setMerchantName(res.merchantName);
      setItems(res.items.map(i => ({ ...i, checked: true })));
    } catch (err) {
      alert('识别失败：' + (err as Error).message);
    }
    setIsProcessing(false);
  };

  const handleImport = async () => {
    if (!merchantName.trim()) return;

    // 检查商家是否已存在
    const existing = await getMerchants();
    let merchantId: number;
    const found = existing.find(m => m.name === merchantName.trim());

    if (found) {
      merchantId = found.id!;
    } else {
      merchantId = await addMerchant({
        name: merchantName.trim(),
        category: '',
        createdAt: new Date().toISOString(),
      });
    }

    // 导入选中的菜品
    for (const item of items) {
      if (item.checked && item.name.trim()) {
        await addMenuItem({
          merchantId,
          name: item.name.trim(),
          price: item.price,
        });
      }
    }

    setImported(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/merchants')} className="text-gray-400 hover:text-gray-600">←</button>
        <h2 className="text-lg font-semibold text-gray-700">截图导入</h2>
      </div>

      {/* 上传图片 */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-300 transition-colors"
      >
        {image ? (
          <img src={image} alt="截图预览" className="max-h-48 mx-auto rounded-lg" />
        ) : (
          <div className="text-gray-400">
            <p className="text-3xl mb-2">📷</p>
            <p className="text-sm">点击上传外卖订单截图</p>
            <p className="text-xs mt-1">支持美团、饿了么等订单页面截图</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* 识别按钮和进度 */}
      {file && !result && (
        <div className="text-center">
          <button
            onClick={handleRecognize}
            disabled={isProcessing}
            className="px-6 py-2.5 bg-purple-500 text-white rounded-full font-medium disabled:opacity-50"
          >
            {isProcessing ? `识别中... ${progress}%` : '开始识别'}
          </button>
          {isProcessing && (
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      )}

      {/* 识别结果编辑 */}
      {result && !imported && (
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <div>
            <label className="text-sm text-gray-500">商家名称</label>
            <input
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="text-sm text-gray-500">识别到的菜品（可取消勾选）</label>
            <div className="mt-2 space-y-2">
              {items.length === 0 ? (
                <p className="text-sm text-gray-400">未识别到菜品信息</p>
              ) : (
                items.map((item, idx) => (
                  <label key={idx} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[idx].checked = e.target.checked;
                        setItems(newItems);
                      }}
                      className="rounded"
                    />
                    <span className="flex-1">{item.name}</span>
                    <span className="text-orange-500">¥{item.price}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* 原始文本（可折叠） */}
          <details className="text-xs text-gray-400">
            <summary className="cursor-pointer">查看原始识别文本</summary>
            <pre className="mt-1 whitespace-pre-wrap bg-gray-50 p-2 rounded">{result.rawText}</pre>
          </details>

          <button
            onClick={handleImport}
            className="w-full py-2.5 bg-blue-500 text-white rounded-lg font-medium"
          >
            确认导入
          </button>
        </div>
      )}

      {/* 导入成功 */}
      {imported && (
        <div className="text-center py-8">
          <p className="text-4xl mb-2">✅</p>
          <p className="text-green-600 font-medium">导入成功！</p>
          <button
            onClick={() => navigate('/merchants')}
            className="mt-3 text-blue-500 text-sm underline"
          >
            查看商家列表
          </button>
        </div>
      )}
    </div>
  );
}
