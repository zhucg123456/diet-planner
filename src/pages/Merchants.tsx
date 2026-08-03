import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMerchants, addMerchant, updateMerchant, deleteMerchant, getMenuItems, addMenuItem, deleteMenuItem } from '../db';
import type { Merchant, MenuItem } from '../types';

export default function Merchants() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const navigate = useNavigate();

  const categories = ['快餐', '面食', '麻辣烫', '火锅', '烧烤', '奶茶', '轻食', '日料', '韩餐', '其他'];

  const loadMerchants = async () => {
    const data = await getMerchants();
    setMerchants(data);
  };

  useEffect(() => { loadMerchants(); }, []);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    if (editId) {
      await updateMerchant(editId, { name: name.trim(), category, note });
    } else {
      await addMerchant({ name: name.trim(), category, note, createdAt: new Date().toISOString() });
    }
    resetForm();
    loadMerchants();
  };

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setName('');
    setCategory('');
    setNote('');
  };

  const handleEdit = (m: Merchant) => {
    setEditId(m.id!);
    setName(m.name);
    setCategory(m.category);
    setNote(m.note || '');
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('确定删除该商家及其所有菜品？')) {
      await deleteMerchant(id);
      loadMerchants();
    }
  };

  const toggleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      setMenuItems([]);
    } else {
      setExpandedId(id);
      const items = await getMenuItems(id);
      setMenuItems(items);
    }
  };

  const handleAddItem = async (merchantId: number) => {
    if (!newItemName.trim() || !newItemPrice) return;
    await addMenuItem({
      merchantId,
      name: newItemName.trim(),
      price: parseFloat(newItemPrice),
    });
    setNewItemName('');
    setNewItemPrice('');
    const items = await getMenuItems(merchantId);
    setMenuItems(items);
  };

  const handleDeleteItem = async (itemId: number, merchantId: number) => {
    await deleteMenuItem(itemId);
    const items = await getMenuItems(merchantId);
    setMenuItems(items);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-700">商家管理</h2>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/merchants/import')}
            className="px-3 py-1.5 text-sm bg-purple-50 text-purple-600 rounded-lg"
          >
            📷 截图导入
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg"
          >
            + 添加
          </button>
        </div>
      </div>

      {/* 商家列表 */}
      {merchants.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">🏪</p>
          <p>还没有添加商家</p>
          <p className="text-sm mt-1">点击"添加"或"截图导入"开始</p>
        </div>
      ) : (
        <div className="space-y-2">
          {merchants.map((m) => (
            <div key={m.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center px-4 py-3">
                <button
                  onClick={() => toggleExpand(m.id!)}
                  className="flex-1 text-left"
                >
                  <p className="font-medium text-gray-800">{m.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {m.category && <span className="bg-gray-100 px-1.5 py-0.5 rounded">{m.category}</span>}
                    {m.note && <span className="ml-2">{m.note}</span>}
                  </p>
                </button>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(m)} className="p-1.5 text-gray-400 hover:text-blue-500">✏️</button>
                  <button onClick={() => handleDelete(m.id!)} className="p-1.5 text-gray-400 hover:text-red-500">🗑️</button>
                </div>
              </div>

              {/* 展开的菜品列表 */}
              {expandedId === m.id && (
                <div className="border-t border-gray-50 px-4 py-3 bg-gray-50/50">
                  <p className="text-xs text-gray-500 mb-2">菜品/套餐：</p>
                  {menuItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-1.5 text-sm">
                      <span>{item.name}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-orange-500">¥{item.price}</span>
                        <button
                          onClick={() => handleDeleteItem(item.id!, m.id!)}
                          className="text-gray-300 hover:text-red-400 text-xs"
                        >✕</button>
                      </span>
                    </div>
                  ))}
                  {/* 添加菜品 */}
                  <div className="flex gap-2 mt-2">
                    <input
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="菜品名"
                      className="flex-1 px-2 py-1.5 border rounded-lg text-sm"
                    />
                    <input
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(e.target.value)}
                      placeholder="价格"
                      type="number"
                      className="w-20 px-2 py-1.5 border rounded-lg text-sm"
                    />
                    <button
                      onClick={() => handleAddItem(m.id!)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm"
                    >添加</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 添加/编辑表单弹窗 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <h3 className="font-semibold text-lg mb-4">{editId ? '编辑商家' : '添加商家'}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500">商家名称 *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                  placeholder="如：张记黄焖鸡"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500">分类</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">选择分类</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-500">备注</label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                  placeholder="如：周三有活动"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={resetForm} className="flex-1 py-2 border rounded-lg text-sm text-gray-600">取消</button>
              <button onClick={handleSubmit} className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
