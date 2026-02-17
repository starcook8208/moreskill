---
name: image-ocr
description: 使用 Google Vision API 進行圖片文字辨識（OCR），支援一般文字與手寫辨識。當使用者需要： (1) 從圖片擷取文字 (2) 辨識手寫內容 (3) 圖片轉文字 (4) 照片文字提取 時使用此技能。
---

# 圖片 OCR 技能

使用 Google Vision API v1p4beta1 進行圖片文字辨識，支援手寫辨識。

## 基本 OCR

```javascript
const response = await fetch(
  `https://vision.googleapis.com/v1p4beta1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{
        image: { source: { imageUri: '圖片網址' } },
        // 或 Base64: image: { content: 'BASE64_STRING' }
        features: [{ type: 'TEXT_DETECTION' }]
      }]
    })
  }
);
```

## 手寫辨識（使用新版 Beta）

```javascript
const response = await fetch(
  `https://vision.googleapis.com/v1p4beta1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{
        image: { source: { imageUri: '圖片網址' } },
        features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
        imageContext: {
          languageHints: ['zh-TW', 'en', 'en-t-i0-handwrit']  // 手寫辨識
        }
      }]
    })
  }
);
```

## 參數說明

| 參數 | 必填 | 說明 |
|------|------|------|
| `image.source.imageUri` | ✓ | 圖片公開網址 |
| `image.content` | ✓ | Base64 編碼 (二選一) |
| `features.type` | ✓ | `TEXT_DETECTION` 一般文字<br>`DOCUMENT_TEXT_DETECTION` 文件/手寫 |
| `imageContext.languageHints` | 否 | 語言提示：<br>`zh-TW` 中文<br>`en` 英文<br>`en-t-i0-handwrit` 手寫 |

## 回傳取得文字

```javascript
const result = await response.json();
const text = result.responses[0].textAnnotations[0].description;
```

## 環境變數
- `GOOGLE_VISION_API_KEY` - Google Vision API 金鑰
