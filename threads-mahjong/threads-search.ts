import type { Skill } from "@steipete/skill-kit"

export const name = "threads-search"

export const description = "搜尋 Threads 社交媒體，過濾特定關鍵字後傳給 LLM 分析"

export const parameters = {
  type: "object",
  properties: {
    keyword: {
      type: "string",
      description: "搜尋關鍵字",
      default: "麻將"
    },
    region: {
      type: "string",
      description: "地區篩選：中部、北部、南部、東部",
      default: "中部"
    },
    hours: {
      type: "number",
      description: "只顯示最近幾小時內的貼文",
      default: 2
    }
  },
  required: ["keyword"]
}

const TAIWAN_CITIES: Record<string, string[]> = {
  "中部": ["台中", "彰化", "鹿港", "苗栗", "南投", "雲林", "大里", "太平", "豐原", "潭子", "大雅", "沙鹿", "清水", "龍井", "大肚"],
  "北部": ["台北", "新北", "桃園", "基隆", "新竹"],
  "南部": ["台南", "高雄", "嘉義", "屏東"],
  "東部": ["宜蘭", "花蓮", "台東"]
}

interface PostData {
  author: string
  content: string
  time: string
  cities: string[]
  matchedKeyword: string
}

interface SearchResult {
  posts: PostData[]
  count: number
  filteredBy: {
    keyword: string
    region: string
    hours: number
  }
}

async function connectCDP(): Promise<any> {
  const WebSocket = await import("ws")
  const ws = new WebSocket.default("ws://localhost:9222")
  
  return new Promise((resolve, reject) => {
    ws.onopen = () => resolve(ws)
    ws.onerror = reject
  })
}

async function fetchThreadsPosts(ws: any, keyword: string, cities: string[], hours: number): Promise<PostData[]> {
  const url = `https://www.threads.com/search?q=${encodeURIComponent(keyword)}&serp_type=default&filter=recent`
  
  await ws.send(JSON.stringify({
    id: 1,
    method: "Page.navigate",
    params: { url }
  }))

  await new Promise(r => setTimeout(r, 3000))

  const citiesJson = JSON.stringify(cities)
  const hoursMs = hours * 60 * 60 * 1000

  const script = `
    (() => {
      const now = Date.now()
      const hoursMs = ${hoursMs}
      const cities = ${citiesJson}
      const keyword = "${keyword}"
      
      // 解析 Threads 時間（支援 ISO 和 相對時間）
      function parseTime(timeAttr, timeText) {
        // 如果是 ISO 格式
        if (timeAttr && timeAttr.match(/^\\d{4}-\\d{2}-\\d{2}T/)) {
          return new Date(timeAttr).getTime()
        }
        // 如果是相對時間（幾分鐘前、1小時前等）
        const text = timeAttr || timeText || ""
        const match = text.match(/(\\d+)\\s*(分鐘|分|小時|時|天|日|週)/)
        if (match) {
          const num = parseInt(match[1])
          const unit = match[2]
          const minutes = unit.includes('分') ? num : 
                        unit.includes('小時') || unit.includes('時') ? num * 60 : 
                        unit.includes('天') || unit.includes('日') ? num * 24 * 60 : 
                        unit.includes('週') ? num * 7 * 24 * 60 : 0
          return now - (minutes * 60 * 1000)
        }
        return now
      }
      
      return Array.from(document.querySelectorAll('article')).map(el => {
        const contentEl = el.querySelector('div[dir="auto"], span, div[data-pressable="true"]')
        const timeEl = el.querySelector('time')
        const authorEl = el.querySelector('span a, [href*="/"]')
        
        const content = contentEl?.innerText || ""
        const timeAttr = timeEl?.getAttribute('datetime') || ""
        const timeText = timeEl?.innerText || ""
        const timeMs = parseTime(timeAttr, timeText)
        
        const matchedCities = cities.filter(city => content.includes(city))
        const isRecent = (now - timeMs) < hoursMs
        
        if (!content.includes(keyword)) return null
        if (matchedCities.length === 0) return null
        if (!isRecent) return null
        
        return {
          author: authorEl?.innerText || "unknown",
          content: content.slice(0, 500),
          time: timeAttr || timeText,
          timeMs,
          cities: matchedCities,
          matchedKeyword: keyword
        }
      }).filter(Boolean)
    })()
  `

  const result = await new Promise<{ result?: { value: string } }>((resolve) => {
    const id = Math.floor(Math.random() * 10000)
    ws.onmessage = (e: any) => {
      const msg = JSON.parse(e.data)
      if (msg.id === id) resolve(msg)
    }
    ws.send(JSON.stringify({ id, method: "Runtime.evaluate", params: { expression: script } }))
    setTimeout(() => resolve({}), 10000)
  })

  try {
    return JSON.parse(result.result?.value || "[]")
  } catch {
    return []
  }
}

async function closeCDP(ws: any) {
  ws.close()
}

export async function searchThreads(params: {
  keyword: string
  region?: string
  hours?: number
}): Promise<SearchResult> {
  const { keyword, region = "中部", hours = 2 } = params
  
  const cities = TAIWAN_CITIES[region] || TAIWAN_CITIES["中部"]

  try {
    const ws = await connectCDP() as any
    const posts = await fetchThreadsPosts(ws, keyword, cities, hours)
    await closeCDP(ws)

    return {
      posts,
      count: posts.length,
      filteredBy: {
        keyword,
        region,
        hours
      }
    }
  } catch (error) {
    console.error("CDP error:", error)
    return {
      posts: [],
      count: 0,
      filteredBy: { keyword, region, hours }
    }
  }
}

export const handler = searchThreads
