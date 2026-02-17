---
name: image-ocr
description: 使用 Google Vision API 進行圖片文字辨識（OCR），支援一般文字與手寫辨識。當使用者需要： (1) 從圖片擷取文字 (2) 辨識手寫內容 (3) 圖片轉文字 (4) 照片文字提取 時使用此技能。
---

# 圖片 OCR 技能

此技能已優化，使用 `devbox` 節點上的 Python 腳本 `image_ocr_processor.py` 呼叫 Google Cloud Vision API 進行圖片文字辨識。

## 使用方式

直接呼叫 `image_ocr_processor.py` 腳本，並傳遞 `--image_path` 參數。

```bash
~/.openclaw/ocr_venv/bin/python3 /home/node/.openclaw/workspace/skills/moreskill/image_ocr/image_ocr_processor.py --image_path <圖片路徑或URL>
```

**參數說明：**

*   `--image_path`: **必填**。圖片檔案的本地路徑 (例如 `/tmp/my_image.jpg`) 或公開的圖片 URL (例如 `https://example.com/image.png`)。

**腳本功能：**

*   **自動 Base64 編碼：** 如果是本地圖片路徑，腳本會自動讀取並進行 Base64 編碼。
*   **API 請求構建：** 自動構建 Google Vision API 的 `images:annotate` 請求，使用 `DOCUMENT_TEXT_DETECTION` 和 `zh-TW`, `en` 語言提示。
*   **結果解析：** 解析 API 回應，提取並返回辨識到的文字。

**回傳結果：**

腳本會輸出一個 JSON 字串，包含辨識到的文字。例如：
```json
{"text": "辨識到的文字內容"}
```
如果辨識失敗或沒有文字，則會返回相應的錯誤信息或 "No text found"。

## 環境變數

*   `GOOGLE_VISION_API_KEY` - 儲存在 `devbox` 環境變數中，用於 Google Vision API 認證。

## 執行範例

當收到圖片時，我會執行類似以下指令（將 `<圖片路徑>` 替換為實際圖片路徑，並指定在 `devbox` 上運行）：

```
default_api.exec(command='~/.openclaw/ocr_venv/bin/python3 /home/node/.openclaw/workspace/skills/moreskill/image_ocr/image_ocr_processor.py --image_path <圖片路徑>', host='devbox')
```
