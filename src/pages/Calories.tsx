import { useState, useEffect, useRef } from 'react';
import { getCalorieRecords, addCalorieRecord, getSettings } from '../db';
import { matchCalorieLocal, recognizeCalorieByAI, fileToBase64 } from '../utils/calorie';
import type { CalorieRecord } from '../types';

export default function Calories() {
  const [records, setRecords] = useState<CalorieRecord[]>([]);
  const [foodName, setFoodName] = useState('');
  const [localResult, setLocalResult] = useState<{ calories: number; matched: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ calories: number; foodName: string; description: string } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dailyTarget, setDailyTarget] = useState(2000);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().slice(0, 10);

  const loadRecords = async () => {
    const data = await getCalorieRecords();
    setRecords(data);
    const settings = await getSettings();
    setDailyTarget(settings.dailyCalorieTarget);
  };

  useEffect(() => {
    loadRecords();
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 本地名称匹配
  const handleNameSearch = () => {
    if (!foodName.trim()) return;
    const result = matchCalorieLocal(foodName);
    setLocalResult(result);
  };

  // 保存本地匹配结果
  const saveLocalResult = async () => {
    if (!localResult) return;
    await addCalorieRecord({
      foodName: localResult.matched,
      calories: localResult.calories,
      source: 'local',
      date: today,
    });
    setFoodName('');
    setLocalResult(null);
    loadRecords();
  };

  // AI图片识别
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    setAiLoading(true);
    setAiResult(null);

    try {
      const settings = await getSettings();
      if (!settings.openaiApiKey) {
        alert('请先在设置页面配置 OpenAI API Key');
        setAiLoading(false);
        return;
      }
      const base64 = await fileToBase64(file);
      const result = await recognizeCalorieByAI(base64, settings.openaiApiKey);
      setAiResult(result);
    } catch (err) {
      alert('AI识别失败：' + (err as Error).message);
    }
    setAiLoading(false);
  };

  // 保存AI识别结果
  const saveAIResult = async () => {
    if (!aiResult) return;
    await addCalorieRecord({
      foodName: aiResult.foodName,
      calories: aiResult.calories,
      source: 'ai',
      imageUrl: imagePreview || undefined,
      date: today,
    });
    setAiResult(null);
    setImagePreview(null);
    loadRecords();
  };

  // 今日热量
  const todayRecords = records.filter(r => r.date === today);
  const todayCalories = todayRecords.reduce((sum, r) => sum + r.calories, 0);
  const progress = Math.min((todayCalories / dailyTarget) * 100, 100);

  // 最近7天数据
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  const weeklyData = last7Days.map(date => ({
    date: date.slice(5),
    calories: records.filter(r => r.date === date).reduce((sum, r) => sum + r.calories, 0),
  }));

  const maxCal = Math.max(...weeklyData.map(d => d.calories), dailyTarget);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-700">热量统计</h2>

      {/* 今日进度 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-500">今日摄入</span>
          <span className="text-sm font-medium">
            <span className={todayCalories > dailyTarget ? 'text-red-500' : 'text-green-600'}>
              {todayCalories}
            </span>
            <span className="text-gray-400"> / {dailyTarget} kcal</span>
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${todayCalories > dailyTarget ? 'bg-red-400' : 'bg-green-400'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 输入方式 */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
        <h3 className="text-sm font-medium text-gray-600">记录热量</h3>

        {/* 方式1：名称匹配 */}
        <div className="flex gap-2">
          <input
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNameSearch()}
            placeholder="输入食物名称，如：黄焖鸡米饭"
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
          />
          <button
            onClick={handleNameSearch}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
          >查询</button>
        </div>

        {localResult && (
          <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
            <span className="text-sm">
              匹配：<b>{localResult.matched}</b> - {localResult.calories} kcal
            </span>
            <button onClick={saveLocalResult} className="text-xs bg-blue-500 text-white px-2 py-1 rounded">记录</button>
          </div>
        )}
        {foodName && !localResult && (
          <p className="text-xs text-gray-400">未找到匹配，试试拍照识别</p>
        )}

        {/* 方式2：拍照AI识别 */}
        <div className="border-t pt-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!isOnline}
            className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500
              hover:border-purple-300 disabled:opacity-40 transition-colors"
          >
            {isOnline ? '📷 拍照/上传图片 AI识别热量' : '🔒 离线模式不可用（需联网）'}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </div>

        {aiLoading && <p className="text-sm text-purple-500 text-center animate-pulse">AI识别中...</p>}

        {aiResult && (
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-sm font-medium">{aiResult.foodName}</p>
            <p className="text-lg font-bold text-purple-600">{aiResult.calories} kcal</p>
            {aiResult.description && <p className="text-xs text-gray-500 mt-1">{aiResult.description}</p>}
            <button onClick={saveAIResult} className="mt-2 text-xs bg-purple-500 text-white px-3 py-1 rounded">记录</button>
          </div>
        )}

        {imagePreview && (
          <img src={imagePreview} alt="食物图片" className="max-h-32 rounded-lg mx-auto" />
        )}
      </div>

      {/* 周统计图表 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-sm font-medium text-gray-600 mb-3">近7天热量</h3>
        <div className="flex items-end justify-between h-32 gap-1">
          {weeklyData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <span className="text-[10px] text-gray-400 mb-1">{d.calories > 0 ? d.calories : ''}</span>
              <div
                className={`w-full rounded-t ${d.calories > dailyTarget ? 'bg-red-300' : 'bg-blue-300'}`}
                style={{ height: `${Math.max((d.calories / maxCal) * 100, 2)}%` }}
              />
              <span className="text-[10px] text-gray-400 mt-1">{d.date}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 mt-2">
          <div className="w-3 h-0.5 bg-red-300 rounded" />
          <span className="text-[10px] text-gray-400">目标线 {dailyTarget} kcal</span>
        </div>
      </div>

      {/* 今日记录列表 */}
      {todayRecords.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">今日明细</h3>
          {todayRecords.map((r) => (
            <div key={r.id} className="flex justify-between py-1.5 text-sm border-b border-gray-50 last:border-0">
              <span>{r.foodName} <span className="text-xs text-gray-300">{r.source === 'ai' ? '📷' : '📝'}</span></span>
              <span className="text-orange-500">{r.calories} kcal</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
