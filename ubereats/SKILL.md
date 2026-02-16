---
name: ubereats
description: Uber Eats 訂餐技能。自動完成登入、選餐、結帳流程。根據指定座標搜尋附近餐廳。
version: 1.2.0
allowed-tools: ["browser"]
---

# Uber Eats 訂餐技能

## 配送資訊（預設）
- **地址**：彰化縣鹿港鎮景福巷18號
- **用戶**：黃 (open8208@gmail.com)
- **付款方式**：現金

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

### Step 6: 選擇餐點

**菜單分類導航 Ref**:
| Ref | 類別 |
|-----|------|
| `e13` | 您專屬的推薦商品 |
| `e14` | 人氣精選 |
| `e15` | 蛋餅系列 |
| `e16` | 蔥蛋系列 |
| `e17` | 吐司系列 |
| `e18` | 酥餅系列 |
| `e19` | 厚片系列 |
| `e20` | 漢堡系列 |
| `e21` | 麵在鍋裡滾 |
| `e22` | 飲料系列 |

**操作**: `act click ref: e15` (進入蛋餅系列)

### Step 7: 新增備註
**Ref `e193`**: 新增訂單備註
- element: button "新增訂單備註 餐具、特殊指示等 Plus"
- 操作: `act click ref: e193`

### Step 8: 前往結帳
**Ref `e194`**: 前往結帳
- element: link "前往結帳"
- 操作: `act click ref: e194`

### Step 9: 結帳頁面
(需 snapshot 取得詳細 ref)

### Step 10: 追蹤餐點
(需下單後取得詳細 ref)

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
  "request": {"kind": "click", "ref": "e8"}
}
```

### 進入結帳
```json
{
  "action": "act",
  "request": {"kind": "click", "ref": "e194"}
}
```

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
