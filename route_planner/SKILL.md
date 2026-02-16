---
name: 智能路線規劃
description: 整合 Google Maps 路線規劃與 TDX 即時路況，提供沿途餐廳與景點推薦
---

# 智能路線規劃 Skill

## 用途
當用戶詢問開車路線、需要沿途餐廳或景點推薦時，使用此 Skill 進行完整規劃與路況分析。

## 工作流程

### 1. 解析用戶需求
從用戶問題中提取以下資訊：
- **出發地**：起點地址或地標
- **目的地**：終點地址或地標
- **交通方式**：開車（預設）、大眾運輸、步行
- **中途需求**：餐廳、景點（可選）

### 2. 計算行進方向
根據出發地與目的地座標計算主要方向：

```python
def calculate_direction(origin_lat, origin_lon, dest_lat, dest_lon):
    lat_diff = dest_lat - origin_lat
    lon_diff = dest_lon - origin_lon
    
    if abs(lat_diff) > abs(lon_diff):
        return "南向" if lat_diff < 0 else "北向"
    else:
        return "西向" if lon_diff < 0 else "東向"
```

**範例**：
- 台北 (25.0330, 121.5654) → 台中 (24.1477, 120.6736)
- lat_diff = -0.8853 (往南) → 方向 = **南向**

### 3. Google Compute Routes API

**Endpoint**：
```
POST https://routes.googleapis.com/directions/v2:computeRoutes
```

**Headers**：
```
X-Goog-Api-Key: YOUR_API_KEY
X-Goog-FieldMask: routes.duration,routes.distanceMeters,routes.legs,routes.polyline.encodedPolyline
Content-Type: application/json
```

**請求格式**：
```json
{
  "origin": {
    "address": "台北101"
  },
  "destination": {
    "address": "台中高美濕地"
  },
  "travelMode": "DRIVE",
  "routingPreference": "TRAFFIC_AWARE"
}
```

**回應欄位提取**：
- `routes[0].legs[].steps[].navigationInstruction.instructions` - 導航指令（含路段名稱）
- `routes[0].distanceMeters` - 總距離
- `routes[0].duration` - 預估時間
- `routes[0].polyline.encodedPolyline` - 路線編碼

### 4. 提取主要路段
從導航指令中提取主要路段（國道/快速道路/省道），**最多3個**。

**路段識別規則**：
- 國道：國道1號、國道3號、國道5號...
- 快速道路：台64線、台65線、台66線、台68線、台72線、台74線、台78線、台82線、台84線、台86線、台88線
- 省道：台1線、台2線、台3線...

**提取範例**：
```
導航指令：「沿國道3號向南行駛」
提取路段：{"name": "國道3號", "direction": "南向"}

導航指令：「從土城交流道進入國道3號」
提取路段：{"name": "國道3號", "from": "土城交流道"}
```

### 5. Places Text Search API（沿途餐廳 - 多點搜尋）

**搜尋策略**：從路線中萃取 **3-5 個關鍵點**（起點、25%、50%、75%、終點附近），分別搜尋後合併結果

#### 5.1 萃取路線關鍵點

從 Routes API 回應的 `legs[].steps[].polyline` 解碼座標點：

```javascript
// 從路線中萃取搜尋點（Node.js）
function extractSearchPoints(route, numPoints = 4) {
  const allPoints = [];
  
  // 解碼 polyline 取得所有座標點
  route.legs.forEach(leg => {
    leg.steps.forEach(step => {
      if (step.polyline && step.polyline.encodedPolyline) {
        const points = decodePolyline(step.polyline.encodedPolyline);
        allPoints.push(...points);
      }
    });
  });
  
  // 等距離萃取關鍵點
  const searchPoints = [];
  const step = Math.floor(allPoints.length / (numPoints + 1));
  
  for (let i = 1; i <= numPoints; i++) {
    const idx = step * i;
    if (allPoints[idx]) {
      searchPoints.push({
        latitude: allPoints[idx].lat,
        longitude: allPoints[idx].lng,
        progress: Math.round((i / (numPoints + 1)) * 100) // 25%, 50%, 75%
      });
    }
  }
  
  return searchPoints;
}

// Polyline 解碼（Node.js 版本）
function decodePolyline(encoded) {
  const points = [];
  let index = 0, lat = 0, lng = 0;
  
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;
    
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;
    
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  
  return points;
}
```

#### 5.2 多點搜尋與合併

**Endpoint**：
```
POST https://places.googleapis.com/v1/places:searchText
```

**Headers**：
```
X-Goog-Api-Key: YOUR_API_KEY
X-Goog-FieldMask: places.displayName,places.formattedAddress,places.rating,places.googleMapsLinks,places.businessStatus,places.location,routingSummaries
Content-Type: application/json
```

**多點搜尋流程**：

```javascript
// 對每個關鍵點搜尋餐廳（Node.js）
async function searchRestaurantsAlongRoute(searchPoints, apiKey) {
  const allRestaurants = new Map(); // 用 Map 去重複
  
  for (const point of searchPoints) {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.googleMapsLinks,places.businessStatus,places.location,routingSummaries',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        textQuery: "餐廳",
        locationBias: {
          circle: {
            center: {
              latitude: point.latitude,
              longitude: point.longitude
            },
            radius: 2000.0  // 2km 範圍
          }
        },
        pageSize: 10
      })
    });
    
    const data = await response.json();
    
    if (data.places) {
      data.places.forEach(place => {
        const id = place.location.latitude + ',' + place.location.longitude;
        if (!allRestaurants.has(id)) {
          allRestaurants.set(id, {
            ...place,
            searchProgress: point.progress // 記錄在路線的哪個位置發現
          });
        }
      });
    }
  }
  
  return Array.from(allRestaurants.values());
}
```

**請求格式（單點）**：
```json
{
  "textQuery": "餐廳",
  "locationBias": {
    "circle": {
      "center": {
        "latitude": 24.5,
        "longitude": 120.8
      },
      "radius": 2000.0
    }
  },
  "pageSize": 10
}
```

#### 5.3 篩選與排序

```javascript
// 篩選與排序餐廳（Node.js）
function filterAndSortRestaurants(restaurants, routePolyline) {
  return restaurants
    .filter(place => 
      place.businessStatus === "OPERATIONAL" &&
      place.rating >= 4.0
    )
    .map(place => {
      // 計算距離路線的垂直距離
      const distance = calculateDistanceToRoute(
        place.location.latitude, 
        place.location.longitude,
        routePolyline
      );
      return { ...place, distanceToRoute: distance };
    })
    .filter(place => place.distanceToRoute <= 1500) // 1.5km 內
    .sort((a, b) => {
      // 優先：評分高 -> 距離路線近 -> 分散在路線不同位置
      if (b.rating !== a.rating) return b.rating - a.rating;
      return a.distanceToRoute - b.distanceToRoute;
    })
    .slice(0, 6); // 最多回傳 6 間
}
```

**篩選條件**：
- 只顯示 `businessStatus` = "OPERATIONAL"（營業中）
- 優先選擇 rating >= 4.0 的餐廳
- 距離路線 1.5km 範圍內
- 分散在不同路線段落（避免集中在同一區域）

**回應處理**：
選擇 2-3 個不同類型的餐廳，記錄：
- `displayName.text` - 餐廳名稱
- `rating` - 評分
- `formattedAddress` - 地址
- `googleMapsLinks.placeUri` - Google Maps 連結
- `routingSummaries[0].duration` - 從路線到達的時間
- `distanceToRoute` - 距離路線的距離（公尺）
- `searchProgress` - 在路線的大約位置（%）

### 6. 路線重組（加入中途點）

為每個餐廳選項重新計算完整路線：

```json
{
  "origin": {"address": "出發地"},
  "destination": {"address": "目的地"},
  "intermediates": [
    {"address": "餐廳A地址"}
  ],
  "travelMode": "DRIVE"
}
```

### 7. TDX 路況分析（過濾服務）

**內網 URL**：
```
POST http://tdx-filter-service.zeabur.internal:8080/traffic/route-analysis
```

**請求格式**：
```json
{
  "road_sections": [
    {
      "name": "國道3號",
      "from_point": "土城交流道",
      "to_point": "三鶯交流道"
    },
    {
      "name": "國道3號",
      "from_point": "三鶯交流道",
      "to_point": "鶯歌系統"
    }
  ],
  "direction": "南向"
}
```

**回應格式**：
```json
{
  "analysis": [
    {
      "section_name": "國道3號-土城交流道至三鶯交流道",
      "direction": "南向",
      "congestion_level": 0,
      "speed": 95,
      "status": "暢通",
      "alert": null
    },
    {
      "section_name": "國道3號-三鶯交流道至鶯歌系統",
      "direction": "南向",
      "congestion_level": 1,
      "speed": 65,
      "status": "輕度壅塞",
      "alert": "💡 車多，注意車距"
    }
  ],
  "summary": {
    "total_sections": 2,
    "valid_sections": 2,
    "max_congestion": 1,
    "overall_status": "輕度壅塞"
  },
  "queried_direction": "南向"
}
```

**壅塞程度對照**：
| Level | 狀態 | 描述 |
|-------|------|------|
| 0 | 暢通 | 行車順暢 |
| 1 | 輕度壅塞 | 車多，需保持車距 |
| 2 | 中度壅塞 | 車多壅塞，行車緩慢 |
| 3 | 嚴重壅塞 | 強烈建議改道 |

### 8. 格式化輸出

整合所有資訊，輸出精簡版報告（**LINE 友善格式**）：

```
📍 已串好「出發地 → 中途點 → 目的地」：
- 總距離：XX 公里
- 總時間：XX 分鐘
- 分段：
  1) 出發地 → 中途點A：X.X 公里 / X 分鐘
  2) 中途點A → 中途點B：X.X 公里 / X 分鐘
  3) 中途點B → 目的地：X.X 公里 / X 分鐘

📍 導航連結（含中途點）：
<https://www.google.com/maps/dir/?api=1&origin=...&destination=...&waypoints=...>

需要我再加其他停靠點嗎？
```

**範例（用戶喜歡的格式）**：
```
📍 已串好「台中大遠百 → 鹿比民宿 → 鹿港館前街56號」：
- 總距離：約 33.3 公里
- 總時間：約 40 分鐘
- 分段：
  1) 台中大遠百 → 鹿比民宿：32.1 公里 / 36 分鐘
  2) 鹿比民宿 → 目的地：1.1 公里 / 5 分鐘

📍 導航連結（含中途點）：
<https://www.google.com/maps/dir/?api=1&origin=...&destination=...&waypoints=...>
```

**進階版（含餐廳推薦）**：
```
📍 已串好「鹿港 → 茶六燒肉 → 台中市政府」：
- 總距離：約 45 公里
- 總時間：約 50 分鐘
- 分段：
  1) 鹿港 → 茶六燒肉：43 公里 / 48 分鐘
  2) 茶六燒肉 → 台中市政府：2 公里 / 5 分鐘

【餐廳推薦】🍴 茶六燒肉堂 (4.5★)
  📍 台中市西區公益路268號
  ⏰ 11:00-02:00

📍 導航連結（含中途點）：
<https://www.google.com/maps/dir/...>
```

**LINE 連結格式**（必記）：
- ✅ 正確：`<https://www.google.com/maps/dir/...>`
- ❌ 錯誤：`https://www.google.com/maps/dir/...`

## ⚠️ LINE 連結格式（重要）

在 LINE 頻道發送 Google Maps 連結時，**必須用角括號包住連結**，否則無法點擊：

✅ 正確格式：
```
🔗 Google Maps：<https://www.google.com/maps/dir/...>
```

❌ 錯誤格式：
```
🔗 Google Maps：https://www.google.com/maps/dir/...
```

---

## 錯誤處理

| 錯誤情境 | 處理方式 |
|----------|----------|
| Google API 無法解析地址 | 請用戶提供更具體的地址 |
| TDX 無該路段資料 | 顯示「路況資料暫時無法取得」 |
| 過濾服務無法連線 | 僅顯示路線，略過路況分析 |
| 找不到沿途餐廳 | 顯示「該路段暫無推薦餐廳」 |
| 路況資料過舊（>10分鐘） | 提示「路況資料可能非即時」 |

## 限制說明

- 路況查詢**最多3個主要路段**
- 餐廳搜尋：從路線萃取 **3-5 個關鍵點**，每點搜尋 2km 範圍，最終篩選距離路線 **1.5km 內**的結果
- 只顯示**營業中**的餐廳
- 方向過濾：北向/南向/東向/西向（中文）
- 服務訪問：**內網呼叫過濾服務**
- **LINE 連結格式**：必須用 `<URL>` 格式才能點擊

## 使用範例

**用戶輸入**：
```
從台北101開車去台中高美濕地，想找沿途餐廳
```

**處理流程**：
1. 解析：出發地=台北101，目的地=台中高美濕地，交通方式=開車，需求=餐廳
2. 計算方向：台北→台中 = 南向
3. 呼叫 Routes API 取得路線與路段
4. 提取主要路段：國道3號（多段）
5. **萃取路線關鍵點**：從路線 polyline 解碼，等距離萃取 4 個搜尋點（25%、50%、75%、接近終點）
6. **多點搜尋餐廳**：對每個關鍵點呼叫 Places API（2km 範圍），合併結果並去重
7. 篩選餐廳：營業中、評分 4.0+、距離路線 1.5km 內，選擇 2-3 間最適合的
8. 重組路線（加入餐廳作為中途點）
9. 查詢 TDX 路況（南向路段）
10. 輸出完整報告
