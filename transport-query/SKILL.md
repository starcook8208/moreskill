---
name: transport-query
description: 交通班次查詢技能，自動識別高鐵/台鐵/客運，查詢班次與時間
license: MIT
compatibility: opencode
metadata:
  audience: 一般使用者
  workflow: 交通查詢
---

# 交通查詢技能（Transport Query Agent）

> 負責解析用戶輸入的交通查詢需求，自動識別交通方式與站點，查詢班次資訊。

---

## 1️⃣ 角色定位（Role）

**交通查詢 Agent**

- 負責解析用戶輸入的交通查詢需求
- 自動識別交通方式（高鐵/台鐵/客運）
- 將站名轉換為 StationID
- 呼叫 TDX API 查詢班次
- 回傳結構化結果

---

## 2️⃣ 目標（Goal）

- 用戶輸入「台中去高雄 2/8」
- 自動解析為：起站=1040、訖站=1070、日期=2026-02-08、交通方式=高鐵
- 呼叫 API 取得班次
- 回傳結構化 JSON

---

## 3️⃣ 輸入（Input）

**用戶輸入範例**：
- `台中去高雄 2/8`
- `台北到左營 下週五`
- `高鐵 台北 台南 2026-02-10`
- `火車 桃園 花蓮`

**必解析欄位**：
- `origin`：起站名稱
- `destination`：訖站名稱
- `date`：日期
- `transportType`：交通方式（可自動判斷）

---

## 4️⃣ 輸出（Output）

```json
{
  "success": true,
  "data": {
    "route": {
      "origin": "台中",
      "destination": "高雄左營",
      "originStationID": "1040",
      "destinationStationID": "1070",
      "transportType": "高鐵"
    },
    "date": "2026-02-08",
    "trips": [
      {
        "trainNo": "111",
        "departureTime": "08:15",
        "arrivalTime": "09:30",
        "duration": "1小時15分"
      }
    ]
  }
}
```

---

## 5️⃣ 工作流程（SOP）

### Step 1：解析用戶輸入
1. 提取日期（支援格式：YYYY-MM-DD、MM/DD、明天、下週五等）
2. 提取起站和訖站名稱
3. 判斷交通方式（高鐵/台鐵/客運）

### Step 2：站名轉 StationID
1. 在 `station-aliases.json` 中查詢起站
2. 在 `station-aliases.json` 中查詢訖站
3. 若找不到，回傳錯誤

### Step 3：呼叫 TDX API
1. 確認 Token 是否存在且有效（參考下方「⚠️ API 認證說明」）
2. 組裝 API URL
3. 加上認證 Header
4. 發送 GET 請求

### Step 4：格式化輸出
1. 提取班次資訊
2. 計算行車時間
3. 依照時間排序
4. 回傳結構化 JSON

---

## 6️⃣ Prompt 規範（Prompt Template）

你是一個交通查詢助手。請解析用戶輸入並查詢班次。

**用戶輸入**：
```
{用戶輸入}
```

**請完成**：
1. 解析起站、訖站、日期、交通方式
2. 從 `station-aliases.json` 取得 StationID
3. 呼叫 TDX API（先確認 Token）
4. 回傳結構化 JSON

---

## 7️⃣ 驗收標準（Acceptance Criteria）

- ✅ 能正確解析起站和訖站
- ✅ 日期能轉換為 YYYY-MM-DD 格式
- ✅ 站名能轉換為正確的 StationID
- ✅ API URL 組裝正確
- ✅ 回傳結果包含：車次、出發時間、抵達時間、行車時間
- ✅ 錯誤處理完善（站名錯誤、日期錯誤、API 失敗）

---

## 8️⃣ 例子（Example Output）

### 用戶輸入
```
台中去高雄 2/8
```

### 解析結果
```json
{
  "origin": "台中",
  "destination": "高雄",
  "originStationID": "1040",
  "destinationStationID": "1070",
  "transportType": "高鐵",
  "date": "2026-02-08"
}
```

### API URL
```
https://tdx.transportdata.tw/api/basic/v2/Rail/THSR/DailyTimetable/OD/1040/to/1070/2026-02-08?$top=30&$format=JSON
```

### 技能輸出
```
以下是台中高鐵到高雄左營的班次（2026-02-08）：

1. 車次 111
   出發：08:15 → 抵達：09:30（1小時15分）

2. 車次 133
   出發：09:30 → 抵達：10:45（1小時15分）
```

---

## references

| 檔案 | 位置 | 說明 |
|------|------|------|
| `thsr-stations.json` | `references/thsr-stations.json` | 高鐵站點清單 |
| `station-aliases.json` | `references/station-aliases.json` | 站名別名對照 |

---

## ⚠️ API 認證說明（必讀）

> 在呼叫 TDX API 之前，必須先確認 Token 是否存在且有效。

### 取得 Access Token

**Step 1：設定環境變數**
```bash
export TDX_CLIENT_ID="YOUR_CLIENT_ID"
export TDX_CLIENT_SECRET="YOUR_CLIENT_SECRET"
```

**Step 2：取得 Token**
```bash
cd /home/node/.openclaw/workspace/skills/moreskill/transport-query/scripts
chmod +x get-tdx-token.sh
./get-tdx-token.sh
```

Token 會儲存到 `credentials/tdx-token.json`，包含過期時間戳。

**Step 3：呼叫 API**
取得 token 後，帶入 Authorization Header：
```bash
TOKEN=$(jq -r '.access_token' /home/node/.openclaw/workspace/credentials/tdx-token.json)
curl -s "https://tdx.transportdata.tw/api/basic/v2/Rail/THSR/DailyTimetable/OD/1040/to/1000/2026-02-15?$top=10&$format=JSON" \
    -H "Authorization: Bearer $TOKEN"
```

**在技能中使用**：請在 `env` 參數中帶入環境變數 `TDX_CLIENT_ID` 和 `TDX_CLIENT_SECRET`

### 每天自動更新 Token

**建立 Cron Job（每天凌晨 4 點更新）**：
```bash
cron add --name "tdx-token-refresh" \
    --schedule "{\"kind\": \"cron\", \"expr\": \"0 4 * * *\", \"tz\": \"Asia/Taipei\"}" \
    --payload "{\"kind\": \"agentTurn\", \"message\": \"執行 TDX token 更新腳本（帶入環境變數）\"}" \
    --sessionTarget "isolated"
```

**注意**：需在 Gateway 環境變數中設定 `TDX_CLIENT_ID` 和 `TDX_CLIENT_SECRET`

---

## API 端點

> ⚠️ 呼叫 API 前，請先完成上方「⚠️ API 認證說明」取得有效 Token

**高鐵**：
```
https://tdx.transportdata.tw/api/basic/v2/Rail/THSR/DailyTimetable/OD/{OriginStationID}/to/{DestinationStationID}/{TrainDate}?$top=30&$format=JSON
```

**台鐵**：
```
https://tdx.transportdata.tw/api/basic/v2/Rail/TRA/DailyTimetable/OD/{OriginStationID}/to/{DestinationStationID}/{TrainDate}?$top=30&$format=JSON
```

**Headers**：
```
Authorization: Bearer {access_token}
```

---

## 🔄 備用方案：無認證呼叫

**沒有 API Key 時**：
- TDX API 每天提供 **20 次** 免認證呼叫額度
- 超過次數會回傳 429 錯誤（Too Many Requests）
- 使用時無需加入 Authorization Header，直接呼叫即可

**呼叫方式**：
```bash
curl -s "https://tdx.transportdata.tw/api/basic/v2/Rail/THSR/DailyTimetable/OD/1040/to/1006/2026-02-14?$top=10&$format=JSON"
```

**錯誤處理**：
- 若回傳 `{"error": "Too Many Requests"}` 或 `"Valid API Key Required"`，告知用戶：「TDX API 需要認證，請提供 API Key，或使用網頁搜尋替代查詢。」

---

## 🔄 備用方案：網頁抓取

若 TDX API 不可用，可使用 taiwanhelper.com 網頁抓取時刻表：

**網站**：`https://taiwanhelper.com/thsr`

**使用方式**：
1. 用 `web_fetch` 抓取 taiwanhelper.com/thsr 頁面
2. 從 HTML 中解析班次資訊（格式：車次 / 起點 → 终点 / 發車時間）
3. 篩選符合條件的班次

**範例輸出**：
```
🚄 台中 → 桃園 高鐵班次（2026-02-14）

| 車次 | 發車時間 | 抵達時間 |
|------|----------|----------|
| 1553 | 20:42    | 21:12    |
| 1557 | 21:42    | 22:12    |
```

---

## 錯誤回應

| 錯誤情況 | 回應 |
|----------|------|
| 無法識別站點 | 「抱歉，無法識別【XXX】站點，請確認站名。」 |
| 日期格式錯誤 | 「抱歉，無法識別【XXX】日期，請使用 YYYY-MM-DD。」 |
| 查無班次 | 「抱歉，查無【起站】到【訖站】的班次。」 |
| API 額度用盡（429） | 「TDX API 免認證額度已用完（20次/天），請明天再試，或提供 API Key 提升額度。」 |
| API 失敗 | 「抱歉，查詢服務暫時無法使用，請稍後再試。」 |
