import Dexie, { type EntityTable } from 'dexie';
import type { Merchant, MenuItem, OrderRecord, CalorieRecord, RecommendationState, UserSettings } from '../types';

class DietPlannerDB extends Dexie {
  merchants!: EntityTable<Merchant, 'id'>;
  menuItems!: EntityTable<MenuItem, 'id'>;
  orderRecords!: EntityTable<OrderRecord, 'id'>;
  calorieRecords!: EntityTable<CalorieRecord, 'id'>;
  recommendationState!: EntityTable<RecommendationState, 'id'>;
  settings!: EntityTable<UserSettings, 'id'>;

  constructor() {
    super('DietPlannerDB');
    this.version(1).stores({
      merchants: '++id, name, category, createdAt',
      menuItems: '++id, merchantId, name, price',
      orderRecords: '++id, merchantId, date, price',
      calorieRecords: '++id, orderRecordId, date, foodName',
      recommendationState: '++id, lastUpdated',
      settings: '++id',
    });
  }
}

export const db = new DietPlannerDB();

// ===== 商家 CRUD =====
export async function getMerchants(): Promise<Merchant[]> {
  return db.merchants.toArray();
}

export async function addMerchant(merchant: Omit<Merchant, 'id'>): Promise<number> {
  return db.merchants.add(merchant as Merchant) as Promise<number>;
}

export async function updateMerchant(id: number, data: Partial<Merchant>): Promise<void> {
  await db.merchants.update(id, data);
}

export async function deleteMerchant(id: number): Promise<void> {
  await db.merchants.delete(id);
  await db.menuItems.where('merchantId').equals(id).delete();
}

// ===== 菜品 CRUD =====
export async function getMenuItems(merchantId: number): Promise<MenuItem[]> {
  return db.menuItems.where('merchantId').equals(merchantId).toArray();
}

export async function addMenuItem(item: Omit<MenuItem, 'id'>): Promise<number> {
  return db.menuItems.add(item as MenuItem) as Promise<number>;
}

export async function updateMenuItem(id: number, data: Partial<MenuItem>): Promise<void> {
  await db.menuItems.update(id, data);
}

export async function deleteMenuItem(id: number): Promise<void> {
  await db.menuItems.delete(id);
}

// ===== 点餐记录 =====
export async function getOrderRecords(): Promise<OrderRecord[]> {
  return db.orderRecords.orderBy('date').reverse().toArray();
}

export async function addOrderRecord(record: Omit<OrderRecord, 'id'>): Promise<number> {
  return db.orderRecords.add(record as OrderRecord) as Promise<number>;
}

export async function deleteOrderRecord(id: number): Promise<void> {
  await db.orderRecords.delete(id);
}

// 获取商家的平均消费
export async function getMerchantAvgPrice(merchantId: number): Promise<number | null> {
  const records = await db.orderRecords.where('merchantId').equals(merchantId).toArray();
  if (records.length === 0) return null;
  const total = records.reduce((sum, r) => sum + r.price, 0);
  return total / records.length;
}

// ===== 热量记录 =====
export async function getCalorieRecords(): Promise<CalorieRecord[]> {
  return db.calorieRecords.orderBy('date').reverse().toArray();
}

export async function addCalorieRecord(record: Omit<CalorieRecord, 'id'>): Promise<number> {
  return db.calorieRecords.add(record as CalorieRecord) as Promise<number>;
}

// 获取某天的总热量
export async function getDailyCalories(date: string): Promise<number> {
  const records = await db.calorieRecords.where('date').equals(date).toArray();
  return records.reduce((sum, r) => sum + r.calories, 0);
}

// ===== 推荐状态 =====
export async function getRecommendationState(): Promise<RecommendationState | undefined> {
  return db.recommendationState.toCollection().first();
}

export async function saveRecommendationState(state: Omit<RecommendationState, 'id'>): Promise<void> {
  await db.recommendationState.clear();
  await db.recommendationState.add(state as RecommendationState);
}

// ===== 设置 =====
export async function getSettings(): Promise<UserSettings> {
  const s = await db.settings.toCollection().first();
  return s || {
    priceMin: 0,
    priceMax: 100,
    includeNewMerchants: true,
    dailyCalorieTarget: 2000,
  };
}

export async function saveSettings(settings: Omit<UserSettings, 'id'>): Promise<void> {
  await db.settings.clear();
  await db.settings.add(settings as UserSettings);
}
