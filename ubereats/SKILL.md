---
name: ubereats
description: Uber Eats 訂餐技能。自動完成登入、選餐、結帳流程。
version: 5.0
---

# Uber Eats 訂餐技能 v5.0

## ⚠️ 核心原則

### Snapshot 黃金法則
```javascript
// ✅ 正確：使用 selector + limit 精簡輸出
{ "action": "snapshot", "selector": "main", "limit": 30 }

// ❌ 錯誤：compact only（會輸出整頁細節）
{ "action": "snapshot", "compact": true }
```

### Limit 數值建議
| 場景 | limit | 說明 |
|------|-------|------|
| 搜尋結果列表 | 20~30 | 只看前20-30間店 |
| 店家菜單 | 30~50 | 只看主要品項 |
| 購物車確認 | 20~30 | 確認品項即可 |
| Modal/彈窗 | 15~20 | 簡短確認 |

---

## 📋 標準流程（6步）

```
Step 1: 確認需求 → 需要地址？需要什麼餐？
Step 2: 變更地址 → 已儲存？新地址？
Step 3: 搜尋餐廳 → 輸入關鍵字
Step 4: 選擇餐點 → 加入購物車
Step 5: 確認購物車 → 結帳
Step 6: 結帳 → 下單
```

---

## Step 1: 確認需求

### 判斷式
| 用戶說什麼 | 動作 |
|------------|------|
| 配送地址 XXX | 記錄地址，進行 Step 2 |
| 我想吃OO | 記錄餐點，進行 Step 3 |
| 不知道吃什麼 | 推薦熱門選項 |

### 餐點類型關鍵字
| 關鍵字 | 搜尋詞 |
|--------|--------|
| 飲料/手搖飲 | 珍珠奶茶 |
| 早餐 | 早餐 |
| 甜點 | 甜點 |
| 速食 | 速食 |
| 中式 | 中式美食 |
| 珍珠奶茶 | 珍珠奶茶 |

---

## Step 2: 變更配送地址

### 流程判斷
```
打開地址對話框 (ref=e6)
    ↓
Snapshot (selector=main, limit=15)
    ↓
有「已儲存的地址」？
    ├─ 是 → 點擊選擇 → 完成
    └─ 否 → 輸入新地址 → 選擇結果 → 跳過建築類型 → 儲存
```

### 關鍵 Ref
| Ref | 元素 |
|-----|-------|
| `e6` | 配送地址欄位 |
| `e888` | 地址輸入框 |
| `e772` | 跳過按鈕 |
| `e780` | 儲存按鈕 |

### 指令範例
```javascript
// 1. 打開地址對話框
{ "action": "act", "request": { "kind": "click", "ref": "e6" }}

// 2. 確認（精簡版）
{ "action": "snapshot", "selector": "main", "limit": 15 }

// 3. 點擊已儲存地址（如果存在）
{ "action": "act", "request": { "kind": "click", "ref": "[從snapshot取得]" }}

// 4. 或輸入新地址
{ "action": "act", "request": { "kind": "type", "ref": "e888", "text": "彰化市政府" }}
{ "action": "act", "request": { "key": "Enter", "kind": "press", "ref": "e888" }}

// 5. 選擇結果
{ "action": "snapshot", "selector": "main", "limit": 10 }}
{ "action": "act", "request": { "kind": "click", "ref": "[第一個結果]" }}

// 6. 跳過建築類型
{ "action": "act", "request": { "kind": "click", "ref": "e772" }}
{ "action": "act", "request": { "kind": "click", "ref": "e780" }}
```

### ⚠️ 找不到地址？
- 回報用戶：「抱歉，系統找不到這個地址，請提供其他地址描述」

---

## Step 3: 搜尋餐廳

### ⚡ 重要：使用 search.js 加速搜尋
當用戶說「我要OO」（餐廳或餐點名稱）時，**必須使用 search.js 的模糊搜尋函數**來快速取得 ref，不要一筆一筆對照！

```javascript
// 載入搜尋模組
const 搜尋 = require('./search.js');

// 在取得 snapshot 後，用關鍵字搜尋
const results = 搜尋(snapshot, '關鍵字');
// results[0].ref 就是目標 ref
```

### 搜尋函數說明
| 函數 | 用途 |
|------|------|
| `搜尋(snapshot, '關鍵字')` | 模糊搜尋任何元素 |
| `搜尋餐點(snapshot, '餐點名')` | 精準匹配餐點 |
| `搜尋按鈕(snapshot, '按鈕名')` | 搜尋按鈕 |
| `搜尋快速新增(snapshot)` | 找加入購物車按鈕 |

### 流程
```
點擊搜尋框 → 輸入關鍵字 → Snapshot → 點擊店家
```

### 關鍵 Ref
| Ref | 元素 |
|-----|-------|
| `e5` / `e7` | 搜尋框 |

### 指令範例
```javascript
// 1. 點擊搜尋框
{ "action": "act", "request": { "kind": "click", "ref": "e7" }}

// 2. 輸入關鍵字
{ "action": "act", "request": { "kind": "type", "ref": "e7", "text": "珍珠奶茶" }}

// 3. 確認結果（精簡版：只看前20間）
{ "action": "snapshot", "selector": "main", "limit": 20 }}

// 4. 點擊店家
{ "action": "act", "request": { "kind": "click", "ref": "[店家ref]" }}
```

### 輸出格式
```
| 店名 | 評分 | 外送費 |
|------|------|--------|
| 50嵐 | 4.5 | 25 TWD |
| 迷客夏 | 4.7 | 免運 |
```

---

## Step 4: 選擇餐點

### ⚠️ 重要：新增商品時的 Modal 處理

當點擊商品項目時，Uber Eats 會在**頁面最下方彈出側邊選單（Modal）**，包含：
- 數量選擇器 (combobox)
- 鮮乳選擇 (radio)
- 加料選項 (checkbox)
- 加入購物車按鈕

**此時不能使用 `selector: "main"`，因為 Modal 不會被選取！**

```javascript
// ❌ 錯誤：selector 會遺漏 Modal
{ "action": "snapshot", "selector": "main", "limit": 20 }

// ✅ 正確：使用全局 snapshot（不用 selector）
{ "action": "snapshot", "compact": true }
// 或
{ "action": "snapshot" }  // 全局 snapshot
```

然後用 `search.js` 模糊搜尋元素：
```javascript
const 搜尋 = require('./search.js');
const results = 搜尋(snapshot, '數量');  // 找數量選擇器
const results = 搜尋(snapshot, '新增');  // 找加入購物車按鈕
```

### 流程判斷
```
Snapshot 菜單 (limit=30~50)
    ↓
用戶選擇？
    ├─ 是 → 點擊餐點 → 加入購物車
    └─ 否 → 列出人氣/分類 → 用戶選
```

### 指令範例
```javascript
// 1. 確認菜單（精簡版）
{ "action": "snapshot", "selector": "main", "limit": 40 }}

// 2. 點擊餐點（打開 Modal）
{ "action": "act", "request": { "kind": "click", "ref": "[餐點ref]" }}

// 3. ⚠️ 關鍵：Modal 出現後要用全局 snapshot！
{ "action": "snapshot", "compact": true }  // 不用 selector！

// 4. 用 search.js 找元素
// const results = 搜尋(snapshot, '數量');
// const results = 搜尋(snapshot, '新增');

// 5. 選擇數量、選項後加入購物車
{ "action": "act", "request": { "kind": "click", "ref": "[數量ref或選項ref]" }}
{ "action": "act", "request": { "kind": "click", "ref": "[加入購物車ref]" }}
```

### 輸出格式
```
| 餐點 | 價格 |
|------|------|
| 珍珠奶茶 | $65 |
| 芋頭鮮奶 | $85 |
```

---

## Step 5: 確認購物車

### 流程
```
點擊購物車 → Snapshot 確認 → 點擊結帳
```

### 指令範例
```javascript
// 1. 點擊購物車
{ "action": "act", "request": { "kind": "click", "ref": "e6" }}

// 2. 確認內容（精簡版）
{ "action": "snapshot", "selector": "main", "limit": 25 }}

// 3. 結帳
{ "action": "act", "request": { "kind": "click", "ref": "e194" }}
```

---

## Step 6: 結帳

### 流程
```
Snapshot 確認訂單 → 點擊下單 → 完成
```

### 指令範例
```javascript
// 1. 確認訂單
{ "action": "snapshot", "selector": "main", "limit": 20 }}

// 2. 下單
{ "action": "act", "request": { "kind": "click", "ref": "[下單ref]" }}
```

---

## 🔑 快速判斷表

### Snapshot 場合
| 場合 | selector | limit | 原因 |
|------|---------|-------|------|
| 搜尋結果 | main | 20 | 只看前20間店 |
| 店家菜單 | main | 40 | 只看主要品項 |
| 購物車 | main | 25 | 確認品項 |
| 地址對話 | main | 15 | 快速確認 |
| **新增商品 Modal** | **無（全局）** | **20** | **Modal 在頁面最下方，selector 抓不到** |

### Ref 變化時
| 狀況 | 動作 |
|------|------|
| 進入新頁面 | 先 snapshot |
| 打開 Modal | 先 snapshot |
| ref 失效 | 重新 snapshot |

---

## ⚡ 快速範例

### 範例：找珍珠奶茶
```javascript
// Step 1: 搜尋
{ "action": "act", "request": { "kind": "click", "ref": "e7" }}
{ "action": "act", "request": { "kind": "type", "ref": "e7", "text": "珍珠奶茶" }}
{ "action": "snapshot", "selector": "main", "limit": 20 }  // 看前20間

// Step 2: 選擇店家（假設第1間）
{ "action": "act", "request": { "kind": "click", "ref": "[第1間ref]" }}

// Step 3: 選餐點
{ "action": "snapshot", "selector": "main", "limit": 40 }  // 看前40個品項

// Step 4: 加入購物車
{ "action": "act", "request": { "kind": "click", "ref": "[餐點ref]" }}
{ "action": "snapshot", "selector": "main", "limit": 15 }}
{ "action": "act", "request": { "kind": "click", "ref": "[加入ref]" }}

// Step 5: 結帳
{ "action": "act", "request": { "kind": "click", "ref": "e6" }}
{ "action": "snapshot", "selector": "main", "limit": 25 }}
{ "action": "act", "request": { "kind": "click", "ref": "e194" }}
```

---

## 📋 常用 Ref 速查

### 首頁
| Ref | 元素 | 功能 |
|-----|------|------|
| `e4` | link | 配送地址 |
| `e5` | combobox | 搜尋框 |
| `e6` | button | 購物車 |

### 店家頁
| Ref | 元素 | 功能 |
|-----|------|------|
| `e13~` | link | 菜單分類 |
| `e31~` | link | 餐點項目 |

### 購物車
| Ref | 元素 | 功能 |
|-----|------|------|
| `e194` | button | 結帳 |

---

## ⚠️ 常見問題

| 錯誤 | 解決 |
|------|------|
| 輸出太長 | 加 `selector: "main", limit: 30` |
| ref 無效 | 重新 snapshot |
| 找不到餐點 | 從 snapshot 取得，不要硬編碼 |
| Snapshot 找不到元素 | 頁面還沒載入，加延遲再 snapshot |

### 💡 延遲 Snapshot 技巧

當頁面剛跳轉或 Modal 剛打開時，DOM 可能還沒渲染完成，導致 snapshot 找不到元素。

```javascript
// ❌ 錯誤：操作後立刻 snapshot（可能失敗）
{ "action": "act", "request": { "kind": "click", "ref": "e194" }}
{ "action": "snapshot", "selector": "main", "limit": 20 }}

// ✅ 正確：加延遲（1-2秒）
{ "action": "act", "request": { "kind": "click", "ref": "e194" }}
// [等待 1.5 秒]
{ "action": "snapshot", "selector": "main", "limit": 20 }}
```

### ⏱️ 延遲時間建議
| 場合 | 延遲時間 |
|------|---------|
| 頁面跳轉後 | 1.5~2 秒 |
| Modal 打開後 | 1~1.5 秒 |
| 購物車更新後 | 1~1.5 秒 |
| 結帳流程 | 1.5~2 秒 |

### 🔧 如何實現延遲

在 OpenClaw 中，可以透過以下方式：

```javascript
// 方式1：使用 process 的 sleep（如果有）
// 方式2：執行一個無害的等待指令
// 方式3：再次執行同樣的 snapshot（頁面可能還沒好）

// 最佳實踐：先嘗試 snapshot，如果找不到就重試
{ "action": "snapshot", "selector": "main", "limit": 20 }}
// 如果結果為空或太少，再執行一次
{ "action": "snapshot", "selector": "main", "limit": 20 }}
```

### ⚡ 快速判斷：頁面是否載入完成

從 snapshot 結果判斷：
| 結果 | 狀況 |
|------|------|
| 正常內容 | ✅ 頁面已載入 |
| 很少元素 / 空 | ⚠️ 可能還沒載入完 |
| 跟預期不同 | ⚠️ 可能跳轉到其他頁面 |
