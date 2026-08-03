import { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '../db';
import type { UserSettings } from '../types';

export default function Settings() {
  const [settings, setSettings] = useState<UserSettings>({
    priceMin: 0,
    priceMax: 100,
    includeNewMerchants: true,
    dailyCalorieTarget: 2000,
  });
  const [saved, setSaved] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    getSettings().then(setSettings);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSave = async () => {
    await saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-700">设置</h2>

      {/* 网络状态 */}
      <div className={`rounded-xl px-4 py-3 text-sm ${isOnline ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
        {isOnline ? '🟢 当前在线 - AI识别和外卖同步可用' : '🟡 当前离线 - 仅本地功能可用'}
      </div>

      {/* 价格区间 */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
        <h3 className="text-sm font-medium text-gray-600">价格区间过滤</h3>
        <p className="text-xs text-gray-400">基于你的历史点餐记录过滤商家，只推荐平均消费在此区间内的商家</p>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-xs text-gray-400">最低价（元）</label>
            <input
              type="number"
              value={settings.priceMin}
              onChange={(e) => setSettings({ ...settings, priceMin: Number(e.target.value) })}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <span className="text-gray-300 mt-4">—</span>
          <div className="flex-1">
            <label className="text-xs text-gray-400">最高价（元）</label>
            <input
              type="number"
              value={settings.priceMax}
              onChange={(e) => setSettings({ ...settings, priceMax: Number(e.target.value) })}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={settings.includeNewMerchants}
            onChange={(e) => setSettings({ ...settings, includeNewMerchants: e.target.checked })}
            className="rounded"
          />
          包含无历史记录的新商家
        </label>
      </div>

      {/* 热量目标 */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
        <h3 className="text-sm font-medium text-gray-600">每日热量目标</h3>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={settings.dailyCalorieTarget}
            onChange={(e) => setSettings({ ...settings, dailyCalorieTarget: Number(e.target.value) })}
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
          />
          <span className="text-sm text-gray-400">kcal / 天</span>
        </div>
        <div className="flex gap-2">
          {[1500, 1800, 2000, 2500].map(v => (
            <button
              key={v}
              onClick={() => setSettings({ ...settings, dailyCalorieTarget: v })}
              className={`px-3 py-1 rounded-full text-xs ${
                settings.dailyCalorieTarget === v ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
              }`}
            >{v}</button>
          ))}
        </div>
      </div>

      {/* AI 设置 */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
        <h3 className="text-sm font-medium text-gray-600">AI 图片识别</h3>
        <p className="text-xs text-gray-400">配置 OpenAI API Key 以启用拍照识别食物热量功能（需联网）</p>
        <input
          type="password"
          value={settings.openaiApiKey || ''}
          onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
          placeholder="sk-..."
          className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
        />
        <p className="text-xs text-gray-300">API Key 仅存储在本地浏览器中，不会上传到任何服务器</p>
      </div>

      {/* 外卖API预留 */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-2">
        <h3 className="text-sm font-medium text-gray-600">外卖平台同步（开发中）</h3>
        <p className="text-xs text-gray-400">
          联网时可尝试从外卖平台获取附近商家信息。此功能正在开发中，敬请期待。
        </p>
        <button disabled className="w-full py-2 bg-gray-100 text-gray-400 rounded-lg text-sm cursor-not-allowed">
          同步附近商家（即将开放）
        </button>
      </div>

      {/* 保存按钮 */}
      <button
        onClick={handleSave}
        className={`w-full py-3 rounded-xl font-medium text-white transition-colors ${
          saved ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {saved ? '✓ 已保存' : '保存设置'}
      </button>

      {/* 关于 */}
      <div className="text-center text-xs text-gray-300 py-4">
        <p>饮食规划助手 v1.0</p>
        <p className="mt-1">数据全部存储在本地浏览器，无需注册登录</p>
      </div>
    </div>
  );
}
