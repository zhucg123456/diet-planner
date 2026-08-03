import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMerchants, getMenuItems, addOrderRecord } from '../db';
import { filterMerchantsByPrice, drawNextMerchant, resetBag } from '../utils/recommendation';
import type { Merchant, MenuItem } from '../types';

export default function Home() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [filtered, setFiltered] = useState<Merchant[]>([]);
  const [current, setCurrent] = useState<Merchant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [customPrice, setCustomPrice] = useState('');
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    const all = await getMerchants();
    setMerchants(all);
    const f = await filterMerchantsByPrice(all);
    setFiltered(f);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDraw = async () => {
    if (filtered.length === 0) return;
    setIsDrawing(true);
    // 动画延迟
    await new Promise(r => setTimeout(r, 800));
    const result = await drawNextMerchant(filtered);
    setCurrent(result);
    if (result) {
      const items = await getMenuItems(result.id!);
      setMenuItems(items);
    }
    setIsDrawing(false);
  };

  const handleReset = async () => {
    await resetBag(filtered);
    setCurrent(null);
    setMenuItems([]);
  };

  const handleConfirmOrder = async () => {
    if (!current) return;
    const price = selectedItem ? selectedItem.price : parseFloat(customPrice) || 0;
    const itemName = selectedItem ? selectedItem.name : '自定义';
    await addOrderRecord({
      merchantId: current.id!,
      merchantName: current.name,
      itemName,
      price,
      date: new Date().toISOString().slice(0, 10),
    });
    setShowConfirm(false);
    setSelectedItem(null);
    setCustomPrice('');
    setCurrent(null);
    setMenuItems([]);
    navigate('/history');
  };

  return (
    <div className="space-y-6">
      {/* 抽签区域 */}
      <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">今天吃什么？</h2>

        {filtered.length === 0 ? (
          <div className="text-gray-400 py-8">
            <p className="text-4xl mb-2">🍳</p>
            <p>暂无符合条件的商家</p>
            <button
              onClick={() => navigate('/merchants')}
              className="mt-3 text-blue-500 text-sm underline"
            >
              去添加商家
            </button>
          </div>
        ) : (
          <>
            {/* 抽签动画区 */}
            <div className="h-32 flex items-center justify-center">
              {isDrawing ? (
                <div className="animate-bounce text-5xl">🎰</div>
              ) : current ? (
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{current.name}</p>
                  <p className="text-sm text-gray-400 mt-1">{current.category}</p>
                </div>
              ) : (
                <p className="text-gray-300 text-lg">点击下方按钮抽签</p>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3 justify-center mt-4">
              <button
                onClick={handleDraw}
                disabled={isDrawing}
                className="px-6 py-2.5 bg-blue-500 text-white rounded-full font-medium
                  hover:bg-blue-600 disabled:opacity-50 transition-colors shadow-md"
              >
                {isDrawing ? '抽签中...' : current ? '换一个' : '开始抽签'}
              </button>
              {current && (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="px-6 py-2.5 bg-green-500 text-white rounded-full font-medium
                    hover:bg-green-600 transition-colors shadow-md"
                >
                  就这家！
                </button>
              )}
            </div>

            <p className="text-xs text-gray-400 mt-3">
              当前候选池：{filtered.length} 家商家（共 {merchants.length} 家）
            </p>
          </>
        )}
      </div>

      {/* 确认点餐弹窗 */}
      {showConfirm && current && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <h3 className="font-semibold text-lg mb-3">记录点餐 - {current.name}</h3>

            {menuItems.length > 0 && (
              <div className="mb-3">
                <p className="text-sm text-gray-500 mb-2">选择套餐：</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setSelectedItem(item); setCustomPrice(''); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedItem?.id === item.id
                          ? 'bg-blue-50 text-blue-600 border border-blue-200'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      {item.name} - ¥{item.price}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="text-sm text-gray-500">实际价格（元）：</label>
              <input
                type="number"
                value={selectedItem ? String(selectedItem.price) : customPrice}
                onChange={(e) => { setCustomPrice(e.target.value); setSelectedItem(null); }}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                placeholder="输入实际消费金额"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 border rounded-lg text-sm text-gray-600"
              >
                取消
              </button>
              <button
                onClick={handleConfirmOrder}
                className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm font-medium"
              >
                确认记录
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 快捷操作 */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/merchants/import')}
          className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow"
        >
          <span className="text-2xl">📷</span>
          <p className="text-sm text-gray-600 mt-1">截图导入商家</p>
        </button>
        <button
          onClick={handleReset}
          className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow"
        >
          <span className="text-2xl">🔄</span>
          <p className="text-sm text-gray-600 mt-1">重置推荐轮次</p>
        </button>
      </div>
    </div>
  );
}
