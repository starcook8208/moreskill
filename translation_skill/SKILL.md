---
name: translate
description: 使用 Google Cloud Translation API (v2) 翻譯文字。當用戶要求翻譯任何文字時使用此技能。
version: 1.0.0
allowed-tools: ["Bash"]
---

使用 Google Cloud Translation API (v2) 翻譯文字。

## 參數說明

- `q`: 要翻譯的文字
- `target`: **必填**，目標語言代碼
- `source`: **選填**，來源語言代碼（未填寫則自動偵測）
- `key`: API 金鑰（從環境變數 `Trans_key` 取得）

## 使用流程

1. **確認環境變數**：檢查 `Trans_key` 環境變數是否已設定
2. **確認翻譯需求**：
   - 來源文字是什麼？
   - 要翻譯成什麼語言？
   - 來源語言是什麼？（可選，不回答則自動偵測）
3. **執行翻譯**

## API 呼叫

### 自動偵測來源語言
```bash
curl -X POST "https://translation.googleapis.com/language/translate/v2?key=$Trans_key" \
  -H "Content-Type: application/json" \
  -d '{
    "q": "要翻譯的文字",
    "target": "zh-TW"
  }'
```

### 指定來源語言
```bash
curl -X POST "https://translation.googleapis.com/language/translate/v2?key=$Trans_key" \
  -H "Content-Type: application/json" \
  -d '{
    "q": "Hello world",
    "source": "en",
    "target": "ja"
  }'
```

## 語言代碼對照

| 語言 | 代碼 |
|------|------|
| 繁體中文 | zh-TW |
| 簡體中文 | zh-CN |
| 英文 | en |
| 日文 | ja |
| 韓文 | ko |
| 法文 | fr |
| 德文 | de |
| 西班牙文 | es |
| 越南文 | vi |
| 印尼文 | id |

## 回傳結果

從 API 回應中提取 `data.translations[0].translatedText` 顯示給用戶。


