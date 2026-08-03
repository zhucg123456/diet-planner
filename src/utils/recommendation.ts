import { getRecommendationState, saveRecommendationState, getMerchantAvgPrice, getSettings } from '../db';
import type { Merchant } from '../types';

// 基于种子的伪随机数生成器 (Mulberry32)
function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 带种子的 Fisher-Yates 洗牌
function seededShuffle(arr: number[], seed: number): number[] {
  const result = [...arr];
  const rng = mulberry32(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// 生成基于日期的种子
function generateSeed(round: number): number {
  const today = new Date().toISOString().slice(0, 10);
  let hash = 0;
  const str = `${today}-round-${round}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

// 根据价格区间过滤商家
export async function filterMerchantsByPrice(merchants: Merchant[]): Promise<Merchant[]> {
  const settings = await getSettings();
  const { priceMin, priceMax, includeNewMerchants } = settings;

  const filtered: Merchant[] = [];

  for (const merchant of merchants) {
    const avgPrice = await getMerchantAvgPrice(merchant.id!);
    if (avgPrice === null) {
      // 无历史记录的新商家
      if (includeNewMerchants) {
        filtered.push(merchant);
      }
    } else if (avgPrice >= priceMin && avgPrice <= priceMax) {
      filtered.push(merchant);
    }
  }

  return filtered;
}

// Shuffle Bag 推荐：从袋中抽取下一个商家
export async function drawNextMerchant(merchants: Merchant[]): Promise<Merchant | null> {
  if (merchants.length === 0) return null;

  const merchantIds = merchants.map(m => m.id!);
  let state = await getRecommendationState();

  // 如果没有状态，或者商家列表变化太大，重新初始化
  if (!state || state.bag.length === 0) {
    const round = state ? state.round + 1 : 1;
    const seed = generateSeed(round);
    const bag = seededShuffle(merchantIds, seed);

    state = {
      bag,
      round,
      seed,
      lastUpdated: new Date().toISOString(),
    };
  }

  // 过滤掉已不存在的商家
  let bag = state.bag.filter(id => merchantIds.includes(id));

  // 如果袋子空了，重新填充
  if (bag.length === 0) {
    const round = state.round + 1;
    const seed = generateSeed(round);
    bag = seededShuffle(merchantIds, seed);
    state.round = round;
    state.seed = seed;
  }

  // 抽取第一个
  const drawnId = bag.shift()!;
  state.bag = bag;
  state.lastUpdated = new Date().toISOString();

  await saveRecommendationState(state);

  return merchants.find(m => m.id === drawnId) || null;
}

// 重置推荐袋（用户点击"重新开始一轮"）
export async function resetBag(merchants: Merchant[]): Promise<void> {
  const merchantIds = merchants.map(m => m.id!);
  const state = await getRecommendationState();
  const round = state ? state.round + 1 : 1;
  const seed = generateSeed(round);
  const bag = seededShuffle(merchantIds, seed);

  await saveRecommendationState({
    bag,
    round,
    seed,
    lastUpdated: new Date().toISOString(),
  });
}
