import { useState, useEffect } from 'react';
import { getOrderRecords, deleteOrderRecord, addOrderRecord, getMerchants } from '../db';
import type { OrderRecord, Merchant } from '../types';

export default function History() {
  const [records, setRecords] = useState<OrderRecord[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ merchantId: '', itemName: '', price: '', date: new Date().toISOString().slice(0, 10) });

  const loadRecords = async () => {
    const data = await getOrderRecords();
    setRecords(data);
    const m = await getMerchants();
    setMerchants(m);
  };

  useEffect(() => { loadRecords(); }, []);

  const handleDelete = async (id: number) => {
    if (confirm('确定删除这条记录？')) {
      await deleteOrderRecord(id);
      loadRecords();
    }
  };

  const handleAdd = async () => {
    if (!form.merchantId || !form.price) return;
    const merchant = merchants.find(m => m.id === Number(form.merchantId));
    await addOrderRecord({
      merchantId: Number(form.merchantId),
      merchantName: merchant?.name || '未知',
      itemName: form.itemName || '自定义',
      price: parseFloat(form.price),
      date: form.date,
    });
    setShowAdd(false);
    setForm({ merchantId: '', itemName: '', price: '', date: new Date().toISOString().slice(0, 10) });
    loadRecords();
  };

  // 按日期分组
  const grouped = records.reduce<Record<string, OrderRecord[]>>((acc, r) => {
    if (!acc[r.date]) acc[r.date] = [];
    acc[r.date].push(r);
    return acc;
  }, {});

  const totalSpent = records.reduce((sum, r) => sum + r.price, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-700">点餐记录</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg"
        >
          + 补录
        </button>
      </div>

      {/* 统计摘要 */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex justify-around text-center">
        <div>
          <p className="text-2xl font-bold text-blue-600">{records.length}</p>
          <p className="text-xs text-gray-400">总次数</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-orange-500">¥{totalSpent.toFixed(0)}</p>
          <p className="text-xs text-gray-400">总消费</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-500">
            ¥{records.length > 0 ? (totalSpent / records.length).toFixed(1) : '0'}
          </p>
          <p className="text-xs text-gray-400">平均每次</p>
        </div>
      </div>

      {/* 记录列表 */}
      {records.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">📋</p>
          <p>还没有点餐记录</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <p className="text-xs text-gray-400 mb-1 px-1">{date}</p>
              <div className="space-y-1">
                {items.map((r) => (
                  <div key={r.id} className="bg-white rounded-lg px-4 py-3 shadow-sm flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">{r.merchantName}</p>
                      <p className="text-xs text-gray-400">{r.itemName}</p>
                    </div>
                    <span className="text-sm text-orange-500 font-medium mr-3">¥{r.price}</span>
                    <button
                      onClick={() => handleDelete(r.id!)}
                      className="text-gray-300 hover:text-red-400 text-sm"
                    >✕</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 补录弹窗 */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-3">
            <h3 className="font-semibold text-lg">补录点餐记录</h3>
            <select
              value={form.merchantId}
              onChange={(e) => setForm({ ...form, merchantId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">选择商家</option>
              {merchants.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <input
              value={form.itemName}
              onChange={(e) => setForm({ ...form, itemName: e.target.value })}
              placeholder="菜品/套餐名称"
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="实际价格（元）"
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2 border rounded-lg text-sm text-gray-600">取消</button>
              <button onClick={handleAdd} className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
