// 商家
export interface Merchant {
  id?: number;
  name: string;
  category: string; // 分类：快餐、面食、麻辣烫、奶茶等
  note?: string;
  createdAt: string;
}

// 菜品/套餐
export interface MenuItem {
  id?: number;
  merchantId: number;
  name: string;
  price: number; // 实际价格（用户记录）
  note?: string;
}

// 点餐记录
export interface OrderRecord {
  id?: number;
  merchantId: number;
  merchantName: string;
  itemName: string;
  price: number;
  calories?: number;
  date: string; // ISO date string
  note?: string;
}

// 热量记录
export interface CalorieRecord {
  id?: number;
  orderRecordId?: number;
  foodName: string;
  calories: number;
  source: 'local' | 'ai'; // 来源：本地数据库匹配 / AI识别
  imageUrl?: string;
  date: string;
}

// 自定义食物（用户自行维护，存浏览器）
export interface CustomFood {
  id?: number;
  name: string;
  keywords: string[];
  calories: number; // 每份热量 (kcal)
  unit: string;
}

// 推荐历史（Shuffle Bag 状态）
export interface RecommendationState {
  id?: number;
  bag: number[]; // 当前袋中剩余的商家ID
  round: number; // 当前轮次
  seed: number; // 随机种子
  lastUpdated: string;
}

// 用户设置
export interface UserSettings {
  id?: number;
  priceMin: number;
  priceMax: number;
  openaiApiKey?: string;
  includeNewMerchants: boolean; // 是否包含无历史记录的新商家
  dailyCalorieTarget: number;
}
