---
name: ubereats
description: Uber Eats 訂餐技能。自動完成登入、選餐、結帳流程。
version: 4.6
---

# Uber Eats 訂餐技能

## ⚠️ 必要工具
- **瀏覽器**: 必須使用 `profile="openclaw"`
- **每次操作後**: 必須執行 snapshot 確認當前頁面 ref

---

## 📋 完整訂餐流程（6 步）

```
Step 1: 確認需求
Step 2: 變更配送地址（如需要）
Step 3: 搜尋餐廳
Step 4: 選擇餐點
Step 5: 查看購物車
Step 6: 結帳
```

---

## Step 1: 確認需求

### 觸發關鍵字
| 關鍵字 | 範例 |
|--------|------|
| ubereats / 外送 | 「幫我叫外送」「Uber Eats」 |
| 配送地址 | 「配送地址 彰化市中山路150號」 |
| 搜尋餐點 | 「我想吃珍珠奶茶」「附近有什麼」 |

### 🔑 餐點類型代號（重要！）
| 用戶說的 | 實際搜尋 | 分類 Ref |
|----------|----------|----------|
| 飲料店 / 手搖飲 | 「珍珠奶茶」分類 | `e33` |
| 早餐 | 「早餐」分類 | `e21` |
| 甜點 | 「甜點」分類 | `e22` |
| 速食 | 「速食」分類 | `e23` |
| 中式美食 | 「中式美食」分類 | `e25` |
| 台灣美食 | 「台灣美食」分類 | `e26` |
| 珍珠奶茶 | 直接搜尋「珍珠奶茶」 | - |

### 快速搜尋飲料店範例
```javascript
// 用戶說：配送地址 XXX 附近的飲料店
// Step 1: 先變更地址（參考 Step 2）
// Step 2: 直接點擊珍珠奶茶分類
{ "action": "act", "request": { "kind": "click", "ref": "e33" }}
```

### 操作
- **不需要 snapshot**
- 對話確認：用戶想吃什麼？配送地址在哪？
- 根據上表轉換成對應的搜尋關鍵字

---

## Step 2: 變更配送地址（如需要）

### 流程判斷
| 狀況 | 處理方式 |
|------|----------|
| 地址已在「已儲存的地址」清單中 | 直接點擊選擇 → 跳過 Step 2.3 |
| 陌生地址 | 完整流程（Step 2.1 ~ 2.5） |

---

### Step 2.1: 打開地址對話框
```javascript
// 點擊配送地址欄位
{ "action": "act", "request": { "kind": "click", "ref": "e6" }}

// Snapshot 確認對話框打開
{ "action": "snapshot", "compact": true, "limit": 15 }
```

---

### Step 2.2: 檢查已儲存的地址（快速路徑）

**從 snapshot 結果中找已儲存的地址**：
```
dialog "dialog":
  - combobox "搜尋地址" [ref=e888]
  - heading "已儲存的地址"
    - button "員林影城" [ref=e890]
    - button "景福巷18號" [ref=e892]
    - button "中山路二段150號" [ref=e894]
    ...
```

**如果目標地址在清單中** → 直接點擊選擇：
```javascript
{ "action": "act", "request": { "kind": "click", "ref": "e890" }}
```
→ 跳過後續步驟，直接完成！

---

### Step 2.3: 輸入陌生地址（完整流程）

**使用 search.js 快速找到輸入框**：
```javascript
// Snapshot 後，用以下方式過濾：
const 輸入框 = snapshot.filter(item => item.type === 'combobox');
// 回傳: [{ ref: 'e888', content: '搜尋地址', type: 'combobox' }, ...]

// 使用輸入框 ref
const inputRef = 輸入框[0].ref;  // e888
```

**操作指令**：
```javascript
// 1. 點擊輸入框
{ "action": "act", "request": { "kind": "click", "ref": "e888" }}

// 2. 輸入地址
{ "action": "act", "request": { "kind": "type", "ref": "e888", "text": "台中市政府" }}

// 3. 按 Enter
{ "action": "act", "request": { "key": "Enter", "kind": "press", "ref": "e888" }}

// 4. Snapshot 確認搜尋結果
{ "action": "snapshot", "compact": true, "limit": 20 }
```

---

### Step 2.4: 選擇搜尋結果

**從 snapshot 結果中找地址**：
```
- heading "5 筆「台中市政府」的搜尋結果"
  - link "台中市政府" [ref=eXXX]
  - link "台中市...
```

**Uber Eats 搜尋結果已按相關性排序** → 第一個通常就是目標：
```javascript
// 點擊第一個搜尋結果
{ "action": "act", "request": { "kind": "click", "ref": "[第一個結果ref]" }}
```

---

### Step 2.5: 建築類型選擇 → 儲存

**如果出現「選擇你的建築類型」對話框**：
```
- dialog:
  - heading "選擇你的建築類型"
  - button "跳過" [ref=e772]  // 通常是這個 ref
  - button "公寓" [ref=eXXX]
  - button "透天" [ref=eXXX]
```

```javascript
// 點擊「跳過」
{ "action": "act", "request": { "kind": "click", "ref": "e772" }}

// Snapshot 確認
{ "action": "snapshot", "compact": true, "limit": 15 }
```

**然後會出現「儲存」按鈕**：
```
- button "儲存" [ref=e780]
```

```javascript
// 點擊「儲存」
{ "action": "act", "request": { "kind": "click", "ref": "e780" }}
```

---

### ⚠️ 重要：無結果時回報用戶
- 輸入地址按 Enter 後
- 如果顯示「找不到這個地址」→ **回報用戶，請用戶提供其他地址**

---

### 📋 優化版地址變更流程（總結）

```
打開地址對話框 (e6) 
    ↓
Snapshot 確認
    ↓
檢查已儲存地址 ← 直接點擊 (如果存在)
    ↓
否：輸入新地址 (e888) + Enter
    ↓
Snapshot 確認搜尋結果
    ↓
選擇搜尋結果 (第一個)
    ↓
跳過建築類型 (e772) → 儲存 (e780)
    ↓
完成！
```

---

### 🔑 關鍵 Ref 速查（地址對話框）

| Ref | 元素 | 說明 |
|-----|------|------|
| `e6` | link | 配送地址欄位 |
| `e888` | combobox | 搜尋地址輸入框 |
| `e890` | button | 已儲存地址（倒數第一個）|
| `e898` | button | 已儲存地址（倒數範例）|
| `e772` | button | 「跳過」按鈕 |
| `e780` | button | 「儲存」按鈕 |
| `e902` | button | Close 關閉按鈕 |

---

### 🛠️ 使用 search.js 快速定位

```javascript
// 引入搜尋函數
const { 搜尋 } = require('./search.js');

// 找輸入框
const 輸入框 = snapshot.filter(item => item.type === 'combobox');
console.log(輸入框);  // [{ref: 'e888', content: '搜尋地址', ...}]

// 找已儲存地址
const 儲存地址 = 搜尋(snapshot, '員林影城');
// 回傳: [{ref: 'e890', content: '員林影城', ...}]

// 找按鈕
const 跳過 = 搜尋(snapshot, '跳過');
const 儲存 = 搜尋(snapshot, '儲存');
```

---

## Step 3: 搜尋餐廳

### 流程
```
點擊搜尋框 → 輸入關鍵字 → snapshot 確認結果 → 點擊餐廳進入
```

### 關鍵 Ref
| Ref | 元素 | 說明 |
|-----|------|------|
| `e7` | combobox | 搜尋框 |
| `e4` | radio | 外送模式 |
| `e5` | radio | 外帶模式 |

### 操作指令
```javascript
// 點擊搜尋框
{ "action": "act", "request": { "kind": "click", "ref": "e7" }}

// 輸入搜尋關鍵字
{ "action": "act", "request": { "kind": "type", "ref": "e7", "text": "珍珠奶茶" }}

// snapshot 確認結果（務必執行！）
{ "action": "snapshot", "compact": true, "selector": "main", "limit": 30 }}

// 點擊餐廳（ref 從 snapshot 取得）
{ "action": "act", "request": { "kind": "click", "ref": "[餐廳ref]" }}
```

### 輸出格式
```
| ref | 店家名 | 活動 |
|-----|--------|------|
| e520 | 春和茶水攤 | 買1送1 |
```

### ⚠️ 重要：必須使用模糊查詢 JS
> **不要人工看 snapshot 結果找 ref！**
> 
> **務必使用 `search.js` 中的函數自動找 ref：**
> ```javascript
> const { 搜尋 } = require('./search.js');
> 
> // 搜尋餐廳
> const results = 搜尋(snapshot, '珍珠奶茶');
> // 回傳: [{ ref: 'e520', content: '春和茶水攤 買1送1', ... }]
> 
> // 直接使用搜尋結果的 ref
> act click ref: results[0].ref
> ```

---

## Step 4: 選擇餐點

### 流程
```
snapshot 確認菜單 → 點擊餐點 → snapshot 確認 modal → 點擊加入購物車
```

### 關鍵 Ref（店家頁面）
| Ref | 元素 | 說明 |
|-----|------|------|
| `e1074` | button | 購物車 |
| `e13~` | link | 菜單分類 |
| `e31~` | link | 餐點項目 |

### 操作指令
```javascript
// snapshot 確認菜單
{ "action": "snapshot", "compact": true, "selector": "main", "limit": 50 }}

// 點擊餐點
{ "action": "act", "request": { "kind": "click", "ref": "[餐點ref]" }}

// snapshot 確認 modal
{ "action": "snapshot", "compact": true }}

// 點擊加入購物車（ref 從 modal snapshot 取得）
{ "action": "act", "request": { "kind": "click", "ref": "[加入購物車ref]" }}
```

### 餐點輸出格式
```
| ref | 餐點名稱 | 價格 |
|-----|----------|------|
| e31 | 黑糖珍珠奶茶 | $70 |
```

### ⚠️ 重要：必須使用模糊查詢 JS
> **不要人工看 snapshot 結果找 ref！**
> 
> **務必使用 `search.js` 中的函數自動找 ref：**
> ```javascript
> const { 搜尋餐點, 搜尋 } = require('./search.js');
> 
> // 搜尋餐點
> const results = 搜尋餐點(snapshot, '黑糖珍珠奶茶');
> // 回傳: [{ ref: 'e31', content: '黑糖珍珠奶茶 $70', ... }]
> 
> // 直接使用搜尋結果的 ref
> act click ref: results[0].ref
> ```

---

## Step 5: 查看購物車

### 流程
```
點擊購物車 → snapshot 確認內容 → 點擊結帳
```

### 關鍵 Ref
| Ref | 元素 | 說明 |
|-----|------|------|
| `e6` / `e8` | button | 首頁購物車 |
| `e1074` | button | 店家頁購物車 |
| `e194` | button | 結帳按鈕 |

### 操作指令
```javascript
// 點擊購物車
{ "action": "act", "request": { "kind": "click", "ref": "e1074" }}

// snapshot 確認內容
{ "action": "snapshot", "compact": true, "selector": "main", "limit": 30 }}

// 點擊結帳
{ "action": "act", "request": { "kind": "click", "ref": "e194" }}
```

---

## Step 6: 結帳

### 流程
```
確認配送地址 → 選擇付款方式 → 確認訂單 → 下單
```

### 操作
- snapshot 確認當前頁面
- 依序點擊確認
- 最後點擊「下單」按鈕

---

## 🔑 黃金法則

### 1. 必須使用模糊查詢 JS（最重要！）
> **每次搜尋餐廳或餐點時，必須使用 `search.js` 自動找 ref！**
> 
> | 人工判斷 ❌ | 模糊查詢 JS ✅ |
> |-----------|---------------|
> | ref 可能變化 | 動態抓取最新 ref |
> | 可能看錯 | 精準匹配 |
> | 浪費時間 | 自動化 |
> 
> **務必引入搜尋腳本：**
> ```javascript
> const { 搜尋, 搜尋餐點, 搜尋按鈕 } = require('./search.js');
> ```

### 2. Ref 動態變化
> **每次頁面導航後，ref 都會重新編排！**

| 情境 | 處理方式 |
|------|----------|
| 進入新頁面 | 先 snapshot |
| 打開 Modal | 先 snapshot |
| 不要硬編碼 ref | 從 snapshot 取得 |

### 2. Snapshot 原則
| 步驟 | 需要 Snapshot？ |
|------|----------------|
| Step 1 確認需求 | ❌ 不需要 |
| Step 2 切換模式 | ❌ 不需要 |
| Step 3 以後 | ✅ 都需要 |

### 3. Snapshot 指令範本
```javascript
// 一般頁面（搜尋結果、列表）
{ "action": "snapshot", "compact": true, "selector": "main", "limit": 30 }}

// 菜單頁面（需要互動元素）
{ "action": "snapshot", "compact": true, "selector": "main", "interactive": true, "limit": 50 }}

// Modal / 彈窗
{ "action": "snapshot", "compact": true }}
```

---

## 📊 常用 Ref 速查表

### 首頁 (`/tw/feed`)
| Ref | 元素 | 功能 |
|-----|------|------|
| `e4` | radio | 外送 |
| `e5` | radio | 外帶 |
| `e6` | link | 配送地址 |
| `e7` | combobox | 搜尋框 |
| `e8` | button | 購物車 |

### 配送地址對話框（打開 e6 後）
| Ref | 元素 | 功能 |
|-----|------|------|
| `e821` | combobox | 地址輸入框 |
| `e830` | button | 儲存按鈕 |

### 店家頁
| Ref | 元素 | 功能 |
|-----|------|------|
| `e1074` | button | 購物車 |
| `e13~` | link | 菜單分類 |
| `e31~` | link | 餐點項目 |

### 購物車頁
| Ref | 元素 | 功能 |
|-----|------|------|
| `e193` | button | 新增備註 |
| `e194` | button | 前往結帳 |

---

## ⚡ 快速範例

### 範例 1：搜尋珍珠奶茶
```javascript
// 1. 導航
{ "action": "navigate", "targetUrl": "https://www.ubereats.com/tw/feed" }

// 2. 搜尋
{ "action": "act", "request": { "kind": "click", "ref": "e7" }}
{ "action": "act", "request": { "kind": "type", "ref": "e7", "text": "珍珠奶茶" }}

// 3. 確認結果
{ "action": "snapshot", "compact": true, "selector": "main", "limit": 30 }}

// 4. 點擊餐廳（假設 ref=e30）
{ "action": "act", "request": { "kind": "click", "ref": "e30" }}
```

### 範例 2：加入購物車
```javascript
// 1. 確認菜單
{ "action": "snapshot", "compact": true, "selector": "main", "limit": 50 }}

// 2. 點擊餐點（假設 ref=e31）
{ "action": "act", "request": { "kind": "click", "ref": "e31" }}

// 3. 確認 modal
{ "action": "snapshot", "compact": true }}

// 4. 加入購物車（假設 ref=e50）
{ "action": "act", "request": { "kind": "click", "ref": "e50" }}
```

### 範例 3：結帳
```javascript
// 1. 點擊購物車
{ "action": "act", "request": { "kind": "click", "ref": "e1074" }}

// 2. 確認內容
{ "action": "snapshot", "compact": true, "selector": "main", "limit": 30 }}

// 3. 結帳
{ "action": "act", "request": { "kind": "click", "ref": "e194" }}
```

---

## 📁 相關檔案
- `search.js` - 搜尋輔助腳本（自動化找 ref）

---

## ⚠️ 常見錯誤

| 錯誤 | 原因 | 解決 |
|------|------|------|
| Ref 無效 | 頁面變了 | 重新 snapshot |
| 購物車數字不更新 | 不同步 | 直接進行操作 |
| 找不到餐點 | ref 變了 | 用搜尋腳本 |
