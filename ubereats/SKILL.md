---
name: ubereats
description: Uber Eats 訂餐技能。自動完成登入、選餐、結帳流程。根據指定座標搜尋附近餐廳。支援動態搜尋與餐點客製化。
version: 2.0.0
allowed-tools: ["browser"]
---

# ⚠️ 重要：必ず使用 Host Browser

**每次操作瀏覽器時都必須指定 `target="host"`，否則會找不到用戶已登入的頁面！**

---

# Uber Eats 訂餐技能

## 配送資訊（預設）


---

## 標準訂餐流程 (Ref 對照)

### Step 1: 確認需求
- 確認配送地址
- 確認外送/外帶模式
- 確認想吃的餐點/店家

### Step 2: 前往首頁並定位
**URL**: `https://www.ubereats.com/tw/feed`

**Ref `e6`**: 更改地址
- element: link "外送地點： 地圖位置"
- 操作: `act click ref: e6`

### Step 3: 搜尋
**Ref `e7`**: 搜尋框
- element: combobox "搜尋 Uber Eats"
- 操作:
  ```json
  {
    "action": "act",
    "request": {"kind": "click", "ref": "e7"}
  }
  // 然後輸入關鍵字
  ```

### Step 4: 切換配送模式
**Ref `e4`**: 外送
- element: radio "外送"
- 操作: `act click ref: e4`

**Ref `e5`**: 外帶/自取
- element: radio "外帶"
- 操作: `act click ref: e5`

**確認當前模式**: snapshot 後檢查 `e4` 或 `e5` 是否有 `[checked]`

### Step 5: 點擊店家
從 snapshot 取得餐廳列表，找到目標餐廳的 ref (如 `e27`, `e30`, `e33` 等)

**常用餐廳 Ref**:
- `e27` - 盛芳鹽酥雞
- `e30` - 貢茶 彰化鹿港店
- `e33` - 50年代黑豆漿
- `e36` - 統一超商 鹿鑫門市
- `e42` - 黃氏炸雞
- `e45` - 隔壁宵夜 鹿港店
- (其他餐廳依序遞增)

### Step 6: 進入店家菜單頁

點擊餐廳卡片後會進入該店家的菜單頁面。

**頁面關鍵元素**:
- **搜尋框**: `combobox "搜尋 [店名]"` (ref 如 `e1109`)
- **購物車**: `button "X 台購物車"` (ref 如 `e1074`)
- **配送模式切換**: 外送/自取 (ref 如 `e1174`/`e1179`)

**菜單分類導航**:
每間店的分類不同，ref 從 `e1135` 開始遞增。
- 例如貢茶：
  - `e1135`: 精選商品
  - `e1138`: 買 1 送 1
  - `e1141`: 您專屬的推薦商品
  - `e1144` ~ `e1162`: 其他分類

**操作**: `act click ref: e1135` (進入精選商品分類)

---

### Step 7: 選擇餐點

**餐點項目 Ref**:
每個餐點都是一個 link，點擊會打開客製化 modal。
- 餐點 ref 從分類區塊後遞增（如 `e1307`, `e1332`, `e1359`...）
- 每個餐點會顯示：
  - 商品名稱
  - 價格
  - 評分（如有）
  - 標籤（如「熱門」「買 1 送 1」「含咖啡因」）

**餐點結構範例** (從 snapshot 取得):
```
e1307: 寒天蜜桃烏龍(冰) $80 - 排名第 1 多的按讚數
e1332: 韓風塔羅奶茶(冰) $89 • 100% (3) - 排名第 2
e1651: 珍珠奶茶(紅)(冰) $64 含咖啡因 熱門
```

**操作**: `act click ref: e1651` (打開珍珠奶茶客製化頁面)

---

### Step 8: 客製化餐點

點擊餐點後會彈出 modal，顯示客製化選項：
- 尺寸（如「中杯」「大杯」）
- 甜度（如「正常」「微糖」「半糖」「微微糖」「無糖」）
- 冰塊（如「正常冰」「微冰」「去冰」）
- 加料（如「加珍珠 +$10」）

**底部按鈕**: `button "新增 X 項商品至訂單・$XX.XX"` 
- 這是加入購物車的按鈕
- Ref 需要在 modal snapshot 中找到
- **⚠️ Modal 元素會動態變化，建議在點擊餐點後立即 snapshot 抓取 ref**

**操作**: 
```json
{
  "action": "act",
  "request": {"kind": "click", "ref": "[加入購物車按鈕的ref]"}
}
```

---

### Step 9: 查看購物車

**Ref**: `button "X 台購物車"` (如 `e1074`)
- 顯示在頁面右上角或底部
- 數字代表購物車內的項目數量

**操作**: `act click ref: e1074` (打開購物車)

---

### Step 10: 購物車頁面

進入購物車後會顯示：
- 已選餐點列表
- 每個餐點的客製化選項
- 小計金額
- 新增訂單備註按鈕
- 前往結帳按鈕

**關鍵元素** (ref 需從購物車 snapshot 取得):
- `button "新增訂單備註"` (如 `e193`)
- `link "前往結帳"` (如 `e194`)
- 每個餐點旁有編輯/刪除按鈕

**操作**: 
```json
{
  "action": "act",
  "request": {"kind": "click", "ref": "e194"}
}
```

---

### Step 11: 結帳頁面

結帳頁面包含：
- 配送地址確認
- 付款方式選擇
- 訂單摘要
- 下單按鈕

**(待補充 snapshot 後更新 ref 對照)**

---

### Step 12: 追蹤訂單

下單後會跳轉到訂單追蹤頁面。

**(待補充 snapshot 後更新 ref 對照)**

---

## 📋 完整訂餐流程總結

```
1️⃣ 首頁 → 搜尋/選址 (已優化 ✅)
   ├─ e7: 搜尋框
   ├─ e6: 更改地址
   ├─ e4: 外送模式
   └─ e5: 自取模式

2️⃣ 點擊店家 → 進入菜單頁 (已優化 ✅)
   ├─ 店家卡片 link (ref 遞增，如 e27, e30, e33...)
   └─ 進入店家專屬頁面

3️⃣ 菜單頁 → 瀏覽分類 (已優化 ✅)
   ├─ e11XX: 分類導航 (精選商品、推薦等)
   ├─ e1074: 購物車按鈕
   └─ e1109: 店內搜尋框

4️⃣ 選擇餐點 → 打開客製化 modal (已優化 ✅)
   ├─ 餐點 link (ref 遞增，如 e1307, e1651...)
   └─ 點擊後彈出 modal

5️⃣ 客製化選項 → 加入購物車 (待補 snapshot 🔄)
   ├─ 選擇尺寸/甜度/冰塊/加料
   └─ 底部按鈕「新增至訂單」(ref 待抓取)

6️⃣ 查看購物車 → 確認訂單 (部分已優化 ✅)
   ├─ e1074: 購物車按鈕
   ├─ e193: 新增訂單備註 (待驗證)
   └─ e194: 前往結帳 (待驗證)

7️⃣ 結帳頁面 → 下單 (待補 snapshot 🔄)
   ├─ 確認配送地址
   ├─ 選擇付款方式
   └─ 確認下單按鈕 (ref 待抓取)

8️⃣ 訂單追蹤 (待補 snapshot 🔄)
   └─ 查看外送進度
```

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

## 常用快速指令

### 快速回到首頁
```json
{
  "action": "navigate",
  "targetUrl": "https://www.ubereats.com/tw/feed"
}
```

### 確認當前模式
```json
{
  "action": "snapshot",
  "compact": true
}
```

### 切換到外帶模式
```json
{
  "action": "act",
  "request": {"kind": "click", "ref": "e5"}
}
```

### 搜尋餐點
```json
{
  "action": "act",
  "request": {"kind": "click", "ref": "e7"}
}
```

### 查看購物車
```json
{
  "action": "act",
  "request": {"kind": "click", "ref": "e1074"}
}
```
*(註：首頁的購物車 ref 為 e8，店家頁的為 e1074)*

### 進入結帳
```json
{
  "action": "act",
  "request": {"kind": "click", "ref": "e194"}
}
```

### 動態搜尋店家（通用流程）
```javascript
// Step 1: 點擊搜尋框
browser({ action: "act", request: { kind: "click", ref: "e7" }});

// Step 2: 輸入關鍵字（例如：珍珠奶茶、火鍋、早餐店）
browser({ action: "act", request: { kind: "type", ref: "e7", text: "貢茶" }});

// Step 3: 等待搜尋結果並 snapshot
browser({ action: "snapshot", compact: true });

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

## 🔢 數字代號點餐（快速模式）

### 核心概念
- **代號 = ref 數字**（去掉前面的 `e`）
- 用戶說「1651」= 點擊 ref `e1651`
- LLM 內部直接用代號轉換，**不需要做語意匹配**

### 流程

```
1️⃣ 用戶輸入數字代號 (如：1651)
    ↓
2️⃣ LLM 轉換：1651 → e1651 → 點擊
    ↓
3️⃣ 打開客製化 modal
    ↓
4️⃣ 顯示規格選項讓用戶選擇
    ↓
5️⃣ 加入購物車
```

### 代號點餐語法

**直接點餐**：
- 用戶說「我要 1651」「1651」→ 打開 ref e1651 的餐點

**帶規格點餐**（可選）：
- 用戶說「1651 大杯 半糖 去冰」→ 打開餐點後自動填入規格

### 操作範例

```javascript
// 用戶說：我要 1651

// Step 1: 直接用數字點擊餐點（不需要先理解餐點名稱）
browser({
  action: "act",
  request: { kind: "click", ref: "1651" }  // 直接用數字，底層會補 e
});

// Step 2: 打開 modal 後 snapshot
browser({ action: "snapshot", compact: true });

// Step 3: 顯示規格選項給用戶選擇
// 例如：請選擇 尺寸(中杯/大杯)、甜度、冰塊、加料
```

### 代號注意事項

1. **代號是動態的** — 每次進店、滾動頁面後 ref 都會變
2. **代號需要從 snapshot 取得** — 先 snapshot 取得菜單，再讓用戶選數字
3. **數字轉換** — 使用時自動在數字前加 `e`（`1651` → `e1651`）

### 效率優勢

| 模式 | LLM 動作 |
|------|----------|
| 文字模式 | 「珍珠奶茶」→ 語意匹配 → 找到 ref e1651 → 點擊 |
| 代號模式 | 「1651」→ 直接轉換 e1651 → 點擊 |

**省掉語意匹配這一步**，連續點餐時效果更明顯。

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

### 預設使用 Host Browser（重要！）
- 使用 `target="host"` 或 `targetUrl` 直接操作
- **不要**使用 `profile="openclaw"` 或 `profile="chrome"`
- 保持登入狀態，不用每次重新登入

### 瀏覽器已開啟
- Uber Eats 訂單頁 + 餐點列表頁已開啟
- Session 維持登入中

---

## 常見問題

### Q: 登入失敗？
- 檢查瀏覽器是否保持開啟
- 使用 Google 登入較穩定

### Q: 找不到餐廳？
- 嘗試調整搜尋範圍
- 檢查座標是否正確
