#!/bin/bash

# TDX Access Token 取得腳本
# 用於取得並更新 TDX API 的 access token
# 環境變數：TDX_CLIENT_ID, TDX_CLIENT_SECRET

TOKEN_FILE="/home/node/.openclaw/workspace/credentials/tdx-token.json"

# 檢查環境變數
CLIENT_ID="${TDX_CLIENT_ID}"
CLIENT_SECRET="${TDX_CLIENT_SECRET}"

if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
    echo "錯誤：請設定環境變數 TDX_CLIENT_ID 和 TDX_CLIENT_SECRET"
    exit 1
fi

# 取得 access token
RESPONSE=$(curl -s -X POST 'https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token' \
    -H 'content-type: application/x-www-form-urlencoded' \
    -d "grant_type=client_credentials" \
    -d "client_id=$CLIENT_ID" \
    -d "client_secret=$CLIENT_SECRET")

# 使用 python 解析 JSON（避免 jq 路徑問題）
ACCESS_TOKEN=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))" 2>/dev/null)
ERROR=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('error', ''))" 2>/dev/null)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "錯誤：無法取得 access token"
    echo "Response: $RESPONSE"
    exit 1
fi

# 取得過期時間
EXPIRES_IN=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('expires_in', 0))" 2>/dev/null)
TOKEN_TYPE=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token_type', 'Bearer'))" 2>/dev/null)

# 計算過期時間戳
EXPIRE_TIMESTAMP=$(($(date +%s) + EXPIRES_IN))

# 儲存 token 和相關資訊
echo "{\"access_token\": \"$ACCESS_TOKEN\", \"token_type\": \"$TOKEN_TYPE\", \"expires_in\": $EXPIRES_IN, \"expire_timestamp\": $EXPIRE_TIMESTAMP, \"updated_at\": \"$(date -Iseconds)\"}" > "$TOKEN_FILE"

echo "成功取得 TDX Access Token"
echo "過期時間：$(date -d @$EXPIRE_TIMESTAMP '+%Y-%m-%d %H:%M:%S')"
echo "Token 已儲存到：$TOKEN_FILE"
