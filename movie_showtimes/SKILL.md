---
name: Movie Showtimes Query
description: Queries movie showtimes for the next 3 hours in various regions of Taiwan.
---

# Movie Showtimes Query Skill

This skill allows the agent to query movie showtimes within the next 3 hours for specified regions. It uses **@movies (開發者之眼)** as the primary data source.

## Data Source
- **Website**: [atmovies.com.tw](https://www.atmovies.com.tw/home/)

## Capabilities
- Query future 3-hour showtimes.
- Sort by time.
- Display associated theaters.
- Map region names to codes for @movies URL structure.

## Region Codes
| Region | Code | Region | Code |
| :--- | :--- | :--- | :--- |
| 基隆 | a01 | 嘉義 | a05 |
| 台北 | a02 | 台南 | a06 |
| 桃園 | a03 | 高雄 | a07 |
| 新竹 | a35 | 宜蘭 | a39 |
| 苗栗 | a37 | 花蓮 | a38 |
| 台中 | a04 | 台東 | a89 |
| 彰化 | a47 | 屏東 | a87 |
| 雲林 | a45 | 澎湖 | a69 |
| 南投 | a49 | 金門 | a68 |

## Usage Examples
- "查詢台北3小時內場次"
- "台中現在到3小時內電影"

## Technical Details
### URL Structure
- `/showtime/[RegionCode]/`
- `/showtime/[TheaterID]/[RegionCode]/`

### Execution Workflow
1. Identify **Location** from user input.
2. Resolve **Region Code**.
3. Retrieve **Theater List**.
4. Extract **Showtimes**.
5. **Filter** for showtimes within the next 3 hours.
6. **Sort** by time.
7. **Output** formatted list.

## Response Format Example
```text
🎬 台北 - 未來3小時場次
1. 20:15 猩瘋血雨 - 台北信義威秀
2. 20:20 荒島囚救 - 台北信義威秀
3. 20:25 魔法公主 - 台北信義威秀
```
