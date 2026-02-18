---
name: 智能路線規劃
description: 整合 Google Maps Routes API 與 TDX 即時路況，提供路線規劃與沿途推薦
---

# 智能路線規劃 Skill

## 用途
當用戶詢問開車路線、需要沿途餐廳或景點推薦時，使用此 Skill 進行完整規劃與路況分析。

## ⚠️ API Key 配置
在執行前，請確認環境變數中已設定：
- `GOOGLE_MAPS_KEY` - Google API Key（用於 Routes、Places API）

## 工作流程

### Step 1: 解析用戶需求
從用戶問題中提取：
- **出發地**：起點地址或地標
- **目的地**：終點地址或地標
- **中途需求**：餐廳、景點（可選）

### Step 2: Compute Routes API（取得路線）
呼叫 Google Routes API 取得路線、主要路段資訊：

```bash
curl -X POST "https://routes.googleapis.com/directions/v2:computeRoutes" \
  -H "Content-Type: application/json" \
  -H "X-Goog-Api-Key: $GOOGLE_MAPS_KEY" \
  -H "X-Goog-FieldMask: routes.duration,routes.distanceMeters,routes.legs.steps.navigationInstruction,routes.polyline.encodedPolyline,routes.legs.distanceMeters,routes.legs.duration" \
  -d '{
    "origin": {"address": "出發地"},
    "destination": {"address": "目的地"},
    "travelMode": "DRIVE",
    "routingPreference": "TRAFFIC_AWARE"
  }'
```

**回應提取**：
- `routes[0].distanceMeters` / 1000 → 總距離（公里）
- `routes[0].duration` → 總時間（如 "1800s" → 30分鐘）
- `routes[0].legs[].steps[].navigationInstruction.instructions` → 導航指令（含路段名稱）
- `routes[0].polyline.encodedPolyline` → 路線編碼（用於後續搜尋）

### Step 3: 提取主要路段
從導航指令中提取主要路段（國道/快速道路/省道），**最多3個**：

- 國道：國道1號、國道3號、國道5號
- 快速道路：台64線、台65線、台66線、台68線、台72線、台74線、台78線、台82線、台84線、台86線
- 省道：台1線、台2線、台3線

**計算方向**：
- 根據出發地與目的地判斷方向（南向/北向/東向/西向）

### Step 4: Places Text Search API（搜尋興趣點）

**Endpoint**：
```
POST https://places.googleapis.com/v1/places:searchText
```

**Headers**：
```
X-Goog-Api-Key: GOOGLE_MAPS_KEY
X-Goog-FieldMask: places.displayName,places.formattedAddress,places.rating,places.googleMapsLinks,places.businessStatus,places.location,routingSummaries
```

**請求格式**（對每個興趣點類型）：
```json
{
  "textQuery": "餐廳",
  "locationBias": {
    "circle": {
      "center": {"latitude": 24.5, "longitude": 120.8},
      "radius": 2000.0
    }
  },
  "pageSize": 10
}
```

**篩選條件**：
- `businessStatus` = "OPERATIONAL"（營業中）
- `rating` >= 4.0

### Step 5: 顯示選項讓用戶選擇（編號列表）

搜尋到興趣點後，用**編號列表**顯示讓用戶選擇：

| # | 餐廳名稱 | 評分 | 區域 |
|---|----------|------|------|
| 1 | 餐廳A | ⭐ 4.5 | 彰化 |
| 2 | 餐廳B | ⭐ 4.7 | 台中 |
| 3 | 餐廳C | ⭐ 4.9 | 台北 |

**用戶回覆編號**（如：選 2）→ 代入 #2 餐廳名稱加入路線

### Step 6: Compute Route Matrix（多路徑計算）
用戶選擇中途點後，呼叫 Compute Route Matrix 計算各段路線：

```bash
curl -X POST "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix" \
  -H "Content-Type: application/json" \
  -H "X-Goog-Api-Key: $GOOGLE_MAPS_KEY" \
  -H "X-Goog-FieldMask: originIndex,destinationIndex,duration,distanceMeters,status,condition" \
  -d '{
    "origins": [
      {"waypoint": {"location": {"latLng": {"latitude": 25.033, "longitude": 121.565}}}},
      {"waypoint": {"location": {"latLng": {"latitude": 24.147, "longitude": 120.673}}}}
    ],
    "destinations": [
      {"waypoint": {"location": {"latLng": {"latitude": 24.147, "longitude": 120.673}}}},
      {"waypoint": {"location": {"latLng": {"latitude": 24.225, "longitude": 120.941}}}}
    ],
    "travelMode": "DRIVE",
    "routingPreference": "TRAFFIC_AWARE"
  }'
```

### Step 7: TDX 路況分析（內部服務）
呼叫內部路況服務：

```bash
curl -s -X POST "http://tdx-filter-service-fral.zeabur.internal:8080/traffic/route-analysis" \
  -H "Content-Type: application/json" \
  -d '{
    "road_sections": [
      {"name": "國道1號", "from_point": "彰化", "to_point": "員林"}
    ],
    "direction": "南向"
  }'
```

**壅塞程度對照**：
| Level | 狀態 |
|-------|------|
| 0 | 暢通 |
| 1 | 輕度壅塞 |
| 2 | 中度壅塞 |
| 3 | 嚴重壅塞 |

### Step 8: 格式化輸出

```
📍 已串好「出發地 → 中途點 → 目的地」：
- 總距離：XX 公里
- 總時間：XX 分鐘
- 分段：
  1) 出發地 → 中途點：X.X 公里 / X 分鐘
  2) 中途點 → 目的地：X.X 公里 / X 分鐘

【餐廳推薦】🍴 餐廳名稱 (4.5★)
  📍 地址
  ⏰ 營業時間

🛣️ 路況分析：
  - 國道1號 彰化→員林 [北向]：暢通 ✅
  - 國道3號 霧峰系統→新竹 [北向]：輕度壅塞 ⚠️ (注意車距)

📍 導航連結（含中途點）：
<https://www.google.com/maps/dir/?api=1&origin=...&destination=...&waypoints=...>
```

## ⚠️ LINE 連結格式（重要）
在 LINE 頻道發送 Google Maps 連結時，**必須用角括號包住**：
✅ 正確：`<https://www.google.com/maps/dir/...>`
❌ 錯誤：`https://www.google.com/maps/dir/...`

## 錯誤處理

| 錯誤情境 | 處理方式 |
|----------|----------|
| Google API 無法解析地址 | 請用戶提供更具體的地址 |
| 內部服務無法連線 | 略過路況分析，僅顯示路線 |
| 找不到沿途餐廳 | 顯示「該路段暫無推薦餐廳」 |

## 使用範例

**用戶輸入**：
```
從台北101開車去台中高美濕地，想找沿途餐廳
```

**處理流程**：
1. 解析：出發地=台北101，目的地=台中高美濕地
2. Call computeRoutes API
3. 提取主要路段：國道3號
4. 對路線關鍵點 Call places searchText（餐廳）
5. 列出餐廳選項讓用戶選擇
6. 用戶選擇後，Call computeRouteMatrix 計算分段
7. Call 內部路況服務
8. 輸出完整報告
