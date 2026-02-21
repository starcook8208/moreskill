---
name: ubereats
description: Uber Eats 訂餐技能。自動完成登入、選餐、結帳流程。根據指定座標搜尋附近餐廳。支援動態搜尋與餐點客製化。
version: 4.0.0
allowed-tools: ["browser"]
---

# ⚠️ 重要：必ず使用 Host Browser
**每次操作瀏覽器時都必須指定 `target="host"`，否則會找不到用戶已登入的頁面！**

---

# 输出规格

## 店家列表输出格式

查询附近店家时，请按以下规格输出：

```
| ref | 店家名 | 活動 |
|-----|--------|------|
| e520 | 春和茶水攤 鹿港店 | 買1送1 |
| e517 | 李珍心綠豆沙專門店（鹿港店） | 買1送1 |
```

## 餐点列表输出格式

查询店家餐点时，请按以下规格输出：

```
| ref | 餐點名稱 | 價格 |
|-----|----------|------|
| e31 | 黑糖珍珠奶茶 | $70 |
| e33 | 芒果绿茶 | $65 |
```

---

# Uber Eats 訂餐技能

## 配送資訊（預設）

---

# 🔍 模糊搜尋腳本

每次搜尋店家或餐點後，**必須使用 snapshot 擷取頁面**：

```bash
snapshot --selector "main" --interactive --limit 20
```

## 快速搜尋函數

## 引入腳本

```javascript
const { 搜尋, 搜尋餐點, 搜尋按鈕, 搜尋購物車, 搜尋結帳 } = require('./search.js');
```

## 快速搜尋函數

| 函數 | 用法 | 範例 |
|------|------|------|
| `搜尋(snapshot, 關鍵字)` | 模糊搜尋任何元素 | `搜尋(snapshot, '醋肉')` |
| `搜尋餐點(snapshot, 餐點名稱)` | 搜尋餐點 link | `搜尋餐點(snapshot, '燒肉飯')` |
| `搜尋按鈕(snapshot, 按鈕名稱)` | 搜尋按鈕 | `搜尋按鈕(snapshot, '新增')` |
| `搜尋購物車(snapshot)` | 找購物車按鈕 | `搜尋購物車(snapshot)` |
| `搜尋結帳(snapshot)` | 找結帳按鈕 | `搜尋結帳(snapshot)` |
| `搜尋快速新增(snapshot)` | 找快速新增按鈕 | `搜尋快速新增(snapshot)` |

## 搜尋結果格式

```javascript
[
  { ref: 'e20', content: '小份醋肉 $63', type: 'link', line: 10 },
  { ref: 'e34', content: '小份醋肉 $63 ...', type: 'link', line: 34 }
]
```

## 使用範例

```javascript
// Step 1: 先 snapshot
snapshot --selector "main" --interactive --limit 20

// Step 2: 用搜尋腳本找餐點
const results = 搜尋餐點(snapshotOutput, '醋肉');
// 回傳: [{ ref: 'e20', content: '小份醋肉 $63', ... }]

// Step 3: 直接點擊
act click ref: e20
```

## 懶人捷徑

| 需求 | 搜尋 |
|------|------|
| 找購物車 | `搜尋(snapshot, '購物車')` |
| 找結帳 | `搜尋(snapshot, '結帳')` |
| 找某餐點 | `搜尋(snapshot, '餐點名稱')` |
| 找快速新增 | `搜尋(snapshot, '快速新增')` |

---

# 🚀 自動化搜尋流程（重要！）

每次執行 snapshot 後，**自動用搜尋腳本**找目標 ref！

## 自動化流程

```
Step 1: 用戶說「我要結帳」
   ↓
Step 2: snapshot --interactive --limit 20
   ↓
Step 3: 搜尋腳本自動執行
   ↓
Step 4: 回傳符合的 ref
   ↓
Step 5: 直接點擊
```

## 搜尋腳本自動執行

根據用戶需求，自動搜尋：

| 用戶需求 | 搜尋關鍵字 | 範例 |
|---------|------------|------|
| 結帳 | `搜尋(snapshot, '結帳')` | e194 |
| 購物車 | `搜尋(snapshot, '購物車')` | e6 |
| 找餐點 | `搜尋(snapshot, '餐點名稱')` | e20, e35... |
| 快速新增 | `搜尋(snapshot, '快速新增')` | e21, e24... |
| 分類 | `搜尋(snapshot, '分類名')` | e6, e7... |

## 搜尋優先順序

1. **結帳** → 搜「結帳」「前往結帳」
2. **購物車** → 搜「購物車」
3. **選餐點** → 搜用戶說的餐點名稱
4. **選分類** → 搜分類名稱
5. **快速新增** → 搜「快速新增」

## 使用範例

```javascript
// 用戶說：我要結帳
// 自動執行：
snapshot --interactive --limit 20
const results = 搜尋(snapshotOutput, '結帳')
// 回傳：[{ ref: 'e194', content: '前往結帳', ... }]
// 自動點擊：e194
```

---

# ⚠️ 重要：Ref 動態變化原則

**每次頁面導航或載入後，ref 都會重新編排！**

### 錯誤做法（會失敗）
1. 假設之前的 ref 仍然有效
2. 直接點擊 e7（但頁面已變，ref 已過期）

### 正確做法
```javascript
// Step 1: 先 snapshot 確認當前頁面結構（互動模式，更精準）
snapshot --selector "main" --interactive --limit 20

// Step 2: 確認 ref 存在後再操作
act click ref: e7
```

### 常見錯誤情境
| 情境 | 問題 | 解決方案 |
|------|------|----------|
| 頁面跳轉後直接點擊 | ref 無效 | 先 snapshot |
| navigate 後操作 | ref 重新編排 | 先 snapshot |
| 進入新餐廳 | 餐點 ref 變了 | 先 snapshot 菜單 |

---

## 標準訂餐流程 (Ref 對照)

### Step 1: 確認需求
- 對話確認地址、想吃什麼
- **不需要 snapshot**

### Step 2: 切換配送模式
- 點擊 e4 (外送) 或 e5 (外帶)
- **不需要 snapshot**

### Step 3: 搜尋餐廳 + 選擇餐廳
- 先 snapshot 確認頁面：`--interactive --limit 20`
- 點擊 e7 搜尋框 → 輸入關鍵字
- **snapshot 優化（互動模式）**：
```json
{ "action": "snapshot", "compact": true, "selector": "main", "interactive": true, "limit": 20 }
```
- 從結果直接點擊餐廳 ref 進入

### Step 4: 進入菜單頁
- 先 snapshot 確認頁面：`--interactive --limit 20`
- **snapshot 優化（互動模式）**：
```json
{ "action": "snapshot", "compact": true, "selector": "main", "interactive": true, "limit": 20 }
```

### Step 5: 選擇餐點

**餐點項目 Ref**: 每個餐點都是一個 link，點擊會打開客製化 modal。
- 餐點 ref 從分類區塊後遞增（如 `e27`, `e31`...）
- 每個餐點會顯示：
  - 商品名稱
  - 價格
  - 評分（如有）
  - 標籤（如「熱門」「買 1 送 1」「含咖啡因」）

**餐點結構範例** (從 snapshot 取得):
```
e31: 🐔海南嫩雞餐盒🏆 $200 • 96% (1568)
e33: 泰式椒麻雞肉飯餐盒 $235 • 95% (491)
```

**操作**: `act click ref: e31` (打開餐點客製化頁面)

---

### Step 6: 進入店家菜單頁

點擊餐廳卡片後會進入該店家的菜單頁面。

**頁面關鍵元素**:
- **搜尋框**: `combobox "搜尋 [店名]"` (ref 如 `e10`)
- **購物車**: `button "X 台購物車"` (ref 如 `e6`)
- **配送模式切換**: 外送/自取 (ref 如 `e24`/`e25`)

**菜單分類導航**: 每間店的分類不同，ref 從 `e13` 開始遞增。
- 例如志氣海南雞飯：
  - `e13`: 精選商品
  - `e14`: 訂購指定商品即享優惠
  - `e15`: 您專屬的推薦商品
  - `e16` ~ `e22`: 其他分類

**操作**: `act click ref: e13` (進入精選商品分類)

---

### Step 7: 選擇餐點

**餐點項目 Ref**: 每個餐點都是一個 link，點擊會打開客製化 modal。
- 餐點 ref 從分類區塊後遞增（如 `e31`, `e33`, `e35`...）
- 每個餐點會顯示：
  - 商品名稱
  - 價格
  - 評分（如有）
  - 標籤（如「熱門」「買 1 送 1」「含咖啡因」）

**餐點結構範例** (從 snapshot 取得):
```
e31: 🐔海南嫩雞餐盒🏆 $200 - 排名第 1 多的按讚數
e33: 泰式椒麻雞肉飯餐盒 $235 • 95% (491)
e35: 志氣雞飯餐盒 $180 • 97% (665)
```

**操作**: `act click ref: e31` (打開餐點客製化頁面)

---

### Step 8: 客製化餐點

點擊餐點後會彈出 modal，顯示客製化選項：
- 尺寸（如「中杯」「大杯」）
- 甜度（如「正常」「微糖」「半糖」「微微糖」「無糖」）
- 冰塊（如「正常冰」「微冰」「去冰」）
- 加料（如「加珍珠 +$10」）

**底部按鈕**: `button "新增 X 項商品至訂單・$XX.XX"` - 這是加入購物車的按鈕
- Ref 需要在 modal snapshot 中找到
- **⚠️ Modal 元素會動態變化，建議在點擊餐點後立即 snapshot 抓取 ref**

**操作**:
```json
{ "action": "act", "request": {"kind": "click", "ref": "[加入購物車按鈕的ref]"} }
```

---

### Step 9: 查看購物車

**Ref**: `button "X 台購物車"` (如 `e6`)
- 顯示在頁面右上角或底部
- 數字代表購物車內的項目數量

**操作**: `act click ref: e6` (打開購物車)

---

### Step 10: 購物車頁面

進入購物車後會顯示：
- 已選餐點列表
- 每個餐點的客製化選項
- 小計金額
- 新增訂單備註按鈕
- 前往結帳按鈕

**關鍵元素** (ref 需從購物車 snapshot 取得):
- 前往結帳按鈕

**操作**:
```json
{ "action": "act", "request": {"kind": "click", "ref": "[結帳按鈕ref]"} }
```

---

### Step 11: 結帳頁面

結帳頁面包含：
- 配送地址確認
- 付款方式選擇
- 訂單摘要
- 下單按鈕

---

### Step 12: 追蹤訂單

下單後會跳轉到訂單追蹤頁面。

---

## 🚀 優化後訂餐流程

### Step 1: 確認需求
- 對話確認地址、想吃什麼
- **不需要 snapshot**

### Step 2: 切換配送模式
- 點擊 e4 (外送) 或 e5 (外帶)
- **不需要 snapshot**

### Step 3: 搜尋餐廳 + 選擇餐廳
- 點擊 e7 搜尋框 → 輸入關鍵字
- **snapshot 優化**：
```json
{ "action": "snapshot", "compact": true, "selector": "main", "limit": 30 }
```
- 從結果直接點擊餐廳 ref 進入

### Step 4: 進入菜單頁
- **snapshot 優化**：
```json
{ "action": "snapshot", "compact": true, "selector": "main", "interactive": true, "limit": 50 }
```

### Step 5: 選擇餐點
- 點擊餐點 → snapshot modal → 點擊加入購物車

### Step 6: 查看購物車
- 點擊 e1074

### Step 7: 購物車頁面
- **snapshot 優化**：
```json
{ "action": "snapshot", "compact": true, "selector": "main", "limit": 30 }
```

### Step 8: 結帳
- 確認地址/付款 → 下單

---

## 🎯 Ref 規律總結

根據已收集的 snapshots，Uber Eats 的 ref 分配規律：

### 首頁 (`/tw/feed`)
- `e4` ~ `e8`: 核心導航（外送/自取/搜尋/購物車等）
- `e27`, `e30`, `e33`...: 餐廳卡片（每間店 +3）

### 店家菜單頁 (`/tw/store/[店名]/[id]`)
- `e1074`: 購物車
- `e1109`: 店內搜尋
- `e1135` ~ `e1162`: 菜單分類導航
- `e1307` ~ `e2893`: 餐點項目（每個餐點 ref 遞增）

### 購物車頁面 (待補充)
- `e193`: 新增訂單備註 (待驗證)
- `e194`: 前往結帳 (待驗證)

### 客製化 Modal (待補充)
- **加入購物車按鈕**: 動態 ref，需即時 snapshot

---

## ⚡ Snapshot 效率優化（重要！）

### 舊方法（抓整頁）
```json
{ "action": "snapshot", "compact": true }
```

### 新方法（只抓 main 區塊）
```json
// 搜尋結果 / 列表頁
{ "action": "snapshot", "compact": true, "selector": "main", "limit": 30 }

// 菜單頁（需要互動元素）
{ "action": "snapshot", "compact": true, "selector": "main", "interactive": true, "limit": 50 }

// 購物車頁面
{ "action": "snapshot", "compact": true, "selector": "main", "limit": 30 }
```

### 參數說明
| 參數 | 功能 |
|------|------|
| `selector: "main"` | 只抓取 &lt;main&gt; 區塊，跳過 header/footer |
| `limit: 30/50` | 限制輸出行數，避免過大 |
| `interactive: true` | 輸出易操作的元素列表（適合菜單頁） |

### ⚠️ 重要原則
- **Step 1-2**：不需要 snapshot（純對話+點擊）
- **Step 3 以後**：才需要 snapshot 抓取內容

### 快速回到首頁

```json
{ "action": "navigate", "targetUrl": "https://www.ubereats.com/tw/feed" }
```

### 確認當前模式

```json
{ "action": "snapshot", "compact": true }
```

### 切換到外帶模式

```json
{ "action": "act", "request": {"kind": "click", "ref": "e5"} }
```

### 搜尋餐點

```json
{ "action": "act", "request": {"kind": "click", "ref": "e7"} }
```

### 查看購物車

```json
{ "action": "act", "request": {"kind": "click", "ref": "e1074"} }
```

*(註：首頁的購物車 ref 為 e8，店家頁的為 e1074)*

### 進入結帳

```json
{ "action": "act", "request": {"kind": "click", "ref": "e194"} }
```

### 動態搜尋店家（通用流程）

```javascript
// Step 1: 點擊搜尋框
browser({ action: "act", request: { kind: "click", ref: "e7" }});

// Step 2: 輸入關鍵字（例如：珍珠奶茶、火鍋、早餐店）
browser({ action: "act", request: { kind: "type", ref: "e7", text: "貢茶" }});

// Step 3: 等待搜尋結果並 snapshot（優化版：只抓 main 區塊）
browser({ action: "snapshot", compact: true, selector: "main", limit: 30 });

// Step 4: 從 snapshot 找到目標店家的 ref 並點擊
// 例如：e30 (貢茶 彰化鹿港店)
browser({ action: "act", request: { kind: "click", ref: "e30" }});
```

### 加入餐點到購物車（通用流程）

```javascript
// Step 1: 點擊餐點項目打開 modal
browser({ action: "act", request: { kind: "click", ref: "e1651" }});

// Step 2: 立即 snapshot 抓取 modal 結構
browser({ action: "snapshot", compact: true });

// Step 3: 找到「新增至訂單」按鈕的 ref 並點擊
// (ref 需從 snapshot 中動態取得，通常是 button "新增 X 項商品至訂單")
browser({ action: "act", request: { kind: "click", ref: "[動態ref]" }});
```

---

## ⚠️ 注意事項與最佳實踐

### Ref 動態性
- **首頁的 ref 相對固定**（e4 ~ e8）
- **店家頁的 ref 會變動**（取決於菜單長度和分類數量）
- **Modal 內的 ref 是動態的**，必須在打開後立即 snapshot 取得

### 建議操作流程
1. **每次進入新頁面後都 snapshot**，確認當前可用的 refs
2. **點擊餐點後立即 snapshot**，抓取 modal 內的按鈕 ref
3. **不要硬編碼 ref**，從 snapshot 動態解析
4. **保持 browser session**，避免重複登入

### 常見錯誤處理
- **Ref 失效**: 重新 snapshot 並更新 ref
- **Modal 未出現**: 等待 1-2 秒後再 snapshot
- **購物車數字不更新**: 重新載入頁面或 snapshot
- **登入狀態遺失**: 使用 `target="host"` 保持 session

### 效率優化
- **批次操作**: 一次加入多個餐點後再進購物車
- **減少 snapshot**: 只在必要時（換頁/打開 modal）才執行
- **快取店家 URL**: 常用餐廳可直接用 URL 導航，跳過搜尋步驟

---

## 使用方式

### 點餐格式

當你說「我想吃OO」「幫我找吃的」「附近有什麼」之類的，就觸發此技能。

### 搜尋附近餐廳

1. **用戶給座標** → 用座標搜尋
   - 例如：`24.056, 120.436` 或 `latitude: 24.056, longitude: 120.436`

2. **用戶給地址** → 用地址搜尋
   - 例如：鹿港、彰化、景福巷18號

3. **無提供資訊** → 使用預設地址（景福巷18號）

4. **搜尋後** → 立即執行 snapshot 擷取頁面：
   ```bash
   snapshot --selector "main" --interactive --limit 20
   ```

5. **輸出結果** → 按規格化格式呈現（ref、店家名、活動）

---

## 常用餐廳

### 得利牛排 鹿港店
- **網址**：`https://www.ubereats.com/tw/store/得利牛排-鹿港店/jycNRkOQUd-qawr8CtycmQ`
- **熱門**：嫩煎沙朗牛排及干貝 $350

### HOME28咖哩 大隆店
- **網址**：`https://www.ubereats.com/tw/store/home28咖哩-大隆店/Xx8UoC5yQ4ClvYj2O44Lyg`

### 岩橙 豐饌湯鍋 鹿港店
- **網址**：`https://www.ubereats.com/tw/store/岩橙-豐饌湯鍋-鹿港店/p-ckxm1qU7yF8O0pG_OygQ`

### A-Nini 夏威夷輕食 鹿港店
- **網址**：`https://www.ubereats.com/tw/store/a-nini-夏威夷輕食-鹿港店/rGF3Jv4ZWRK6RsZytf60Bw`

---

## 瀏覽器 session

### 瀏覽器啟動流程（重要！）
當需要使用瀏覽器時，按照以下順序嘗試：

1. **先嘗試直接操作**：使用 `target="host"` 嘗試操作瀏覽器
2. **如果失敗**，嘗試啟動 OpenClaw 瀏覽器：
   ```json
   { "action": "start", "profile": "openclaw" }
   ```
3. **如果瀏覽器已開啟但無法連線**，嘗試連線：
   ```json
   { "action": "open", "profile": "openclaw", "targetUrl": "https://www.ubereats.com/tw/feed" }
   ```

### 預設使用 Host Browser
- 使用 `target="host"` 或 `targetUrl` 直接操作
- **不要**使用 `profile="openclaw"` 或 `profile="chrome"`
- 保持登入狀態，不用每次重新登入

### 瀏覽器已開啟
- Uber Eats 訂單頁 + 餐點列表頁已開啟
- Session 維持登入中

### ⚠️ 不要顯示錯誤訊息
- **不要**在瀏覽器無法連線時顯示長串的錯誤說明
- **直接嘗試啟動**�覽器，不要詢問用戶如何處理
- 如果瀏覽器服務确实未啟用，嘗試用 `openclaw gateway restart` 或自動啟動瀏覽器

---

## 常見問題

### Q: 登入失敗？
- 檢查瀏覽器是否保持開啟
- 使用 Google 登入較穩定

### Q: 找不到餐廳？
- 嘗試調整搜尋範圍
- 檢查座標是否正確

---

## ⚠️ Lessons Learned（實戰經驗）

### 🚨 問題：購物車彈窗（Modal）未正確檢測

**問題描述**：
- 用戶說「有 2 項商品在購物車」但 snapshot 顯示 0
- 頁面上有彈窗（modal）顯示購物車內容，但 snapshot 沒有捕獲到

**原因分析**：
1. **瀏覽器連線不穩定** - OpenClaw 瀏覽器可能斷線重連，導致狀態不同步
2. **不同瀏覽器 session** - OpenClaw 控制的瀏覽器和用戶看的是不同的 session
3. **Snapshot 擷取不完整** - 彈窗內容可能未被包含在 snapshot 輸出中

**解決方案**：
1. **不要只依賴購物車數字判斷** - 用戶說有購物車內容時，要相信用戶的描述
2. **嘗試點擊餐點** - 點擊後立即 snapshot，通常會打開彈窗
3. **檢查 dialog 元素** - 使用較大的 `limit` 參數或不設 limit，讓 snapshot 輸出更多行
4. **直接進行下單操作** - 即使 snapshot 顯示 0，用戶說有商品時就繼續結帳流程

**實際案例**：
```
用戶：黑糖珍珠奶茶
→ 點擊快速新增
→ snapshot 顯示 0 項商品（但這是舊畫面）
→ 用戶說：有一個 2 項商品至訂單的彈窗
→ 說明瀏覽器狀態不同步，但訂單實際已加入
→ 點擊「新增 2 項商品至訂單」按鈕
→ 成功加入購物車
```

**關鍵原則**：
- **信任用戶的描述** - 用戶說有彈窗就是有，不要堅持 snapshot 的結果
- **嘗試點擊操作** - 直接進行預期操作，即使看起來像失敗
- **檢查 dialog/modal** - 彈窗可能不在主要 snapshot 輸出中，需要擴大範圍

---

## 🔍 每次都要使用模糊搜尋腳本

**重要原則**：當用戶給出餐點名稱時，必須使用搜尋腳本來定位 ref，不能人工判斷！

### 錯誤做法（我之前犯的錯）
```javascript
// ❌ 直接看 snapshot 輸出，人工找 ref
// e31: 黑糖珍珠牛奶 $70
// 然後猜測 ref 是 e31
```

### 正確做法
```javascript
// ✅ Step 1: 先 snapshot
browser({ action: "snapshot", compact: true, selector: "main", limit: 30 });

// Step 2: 使用搜尋腳本（由 OpenClaw 自動執行）
const results = 搜尋餐點(snapshotOutput, '黑糖珍珠牛奶');
// 回傳: [{ ref: 'e31', content: '黑糖珍珠牛奶 $70', ... }]

// Step 3: 使用搜尋結果的 ref
browser({ action: "act", request: { kind: "click", ref: results[0].ref }});
```

### 為什麼要用搜尋腳本？

| 人工判斷 | 搜尋腳本 |
|---------|---------|
| ref 可能變化 | 動態抓取最新 ref |
| 可能看錯 | 精準匹配 |
| 浪費時間 | 自動化 |

### 搜尋函數列表

| 函數 | 用法 |
|------|------|
| `搜尋(snapshot, 關鍵字)` | 模糊搜尋任何元素 |
| `搜尋餐點(snapshot, '餐點名')` | 精準搜餐點 |
| `搜尋按鈕(snapshot, '按鈕名')` | 搜按鈕 |
| `搜尋購物車(snapshot)` | 找購物車 |
| `搜尋結帳(snapshot)` | 找結帳 |

### 未來執行時

**每次用戶說「我要OO」時**：
1. 先 snapshot
2. 用 `搜尋餐點(snapshot, '用戶說的餐點')` 找 ref
3. 直接點擊該 ref

不要人工看輸出猜 ref！
