# 🍽️ 饮食规划助手（Diet Planner）

一个"今天吃什么"的选择困难症救星 + 个人饮食记录工具。纯前端本地优先（Local-First）架构，数据全部存在你自己的浏览器里，无需注册登录。

## ✨ 功能特性

- **🎯 抽签推荐**：Shuffle Bag 伪随机算法（带种子的 Fisher-Yates 洗牌），保证每家商家在一轮内恰好出现一次，概率严格均等，拒绝真随机的"总是那几家"
- **💰 真实价格过滤**：价格区间不用商家虚标的数字，而是根据你自己的历史点餐记录计算实际均价来过滤
- **📷 截图导入**：上传外卖订单截图，OCR（Tesseract.js）自动识别商家名和菜品价格
- **🔥 热量计算**：内置 220+ 常见中式食物热量数据库，套餐名称关键词匹配；联网时支持拍照上传 AI 识别（OpenAI Vision）
- **📊 热量统计**：每日摄入进度条、近 7 天柱状图
- **📴 离线可用**：核心功能全部离线运行，只有 AI 拍照识别需要联网

## 🛠️ 技术栈

React 18 + TypeScript + Vite + Tailwind CSS + Dexie.js (IndexedDB) + Tesseract.js + React Router

## 🚀 本地运行

```bash
npm install
npm run dev
```

浏览器打开 http://localhost:5173

## 📦 构建部署

```bash
npm run build
```

产物在 `dist/` 目录，纯静态文件，可托管到任意静态服务。本仓库已配置 GitHub Actions 自动构建并部署到 GitHub Pages。

## 📁 项目结构

```
src/
├── pages/             # 页面（首页抽签/商家管理/截图导入/点餐历史/热量统计/设置）
├── components/        # 布局组件
├── db/                # Dexie 数据库定义与 CRUD 封装
├── utils/
│   ├── recommendation.ts  # Shuffle Bag 伪随机推荐算法
│   ├── calorie.ts         # 热量计算（本地匹配 + AI 识别）
│   └── ocr.ts             # 截图 OCR 识别
├── data/
│   └── calorie-db.json    # 本地食物热量数据库
└── types/             # TypeScript 类型定义
```

## 🔒 隐私说明

所有数据（商家、订单、热量记录、API Key）仅存储在浏览器 IndexedDB 中，不上传任何服务器。清除浏览器数据会导致记录丢失。

## 📄 License

MIT
