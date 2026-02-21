/**
 * Uber Eats 模糊搜尋腳本
 * 用法：搜尋(snapshot輸出, 關鍵字)
 * 回傳：符合關鍵字的 ref 列表
 */

// ============================================
// 主要搜尋函數
// ============================================

/**
 * 在 snapshot 輸出中搜尋符合關鍵字的元素 ref
 * @param {string} snapshotOutput - browser snapshot 的輸出內容
 * @param {string} keyword - 搜尋關鍵字
 * @param {Object} options - 選項
 * @returns {Array} 符合的 ref 列表
 */
function 搜尋(snapshotOutput, keyword, options = {}) {
    const {
        嚴格 = false,      // true = 完全匹配, false = 模糊匹配
        回傳類型 = 'all',  // 'all' | 'link' | 'button' | 'text'
        大小寫 = false     // true = 區分大小寫
    } = options;

    if (!snapshotOutput || !keyword) {
        return [];
    }

    const lines = snapshotOutput.split('\n');
    const matches = [];

    // 解析每一行，找符合的元素
    lines.forEach((line, index) => {
        const refMatch = line.match(/\[ref=([^\]]+)\]/);
        const contentMatch = line.match(/- (.+)/);

        if (!refMatch || !contentMatch) return;

        const ref = refMatch[1];
        const content = contentMatch[1];
        const type = 取得類型(line);

        // 判斷是否匹配關鍵字
        const 搜尋目標 = 大小寫 ? content : content.toLowerCase();
        const 關鍵字 = 大小寫 ? keyword : keyword.toLowerCase();

        let 是否匹配;
        if (嚴格) {
            是否匹配 = 搜尋目標.includes(關鍵字);
        } else {
            // 模糊匹配：關鍵字包含在內容中即可
            是否匹配 = 搜尋目標.includes(關鍵字);
        }

        // 過濾類型
        if (回傳類型 !== 'all' && 回傳類型 !== type) {
            是否匹配 = false;
        }

        if (是否匹配) {
            matches.push({
                ref,
                content: content.trim(),
                type,
                line: index + 1
            });
        }
    });

    return matches;
}

// ============================================
// 輔助函數
// ============================================

/**
 * 從行內容判斷元素類型
 */
function 取得類型(line) {
    if (line.includes('- link')) return 'link';
    if (line.includes('- button')) return 'button';
    if (line.includes('- textbox')) return 'textbox';
    if (line.includes('- radio')) return 'radio';
    if (line.includes('- checkbox')) return 'checkbox';
    if (line.includes('- heading')) return 'heading';
    if (line.includes('- text')) return 'text';
    return 'other';
}

/**
 * 取得所有 ref（快速建立索引用）
 */
function 取得所有Ref(snapshotOutput) {
    const lines = snapshotOutput.split('\n');
    const refs = [];

    lines.forEach((line) => {
        const refMatch = line.match(/\[ref=([^\]]+)\]/);
        if (refMatch) {
            refs.push(refMatch[1]);
        }
    });

    return refs;
}

// ============================================
// 快速搜尋捷徑
// ============================================

/**
 * 搜尋餐點
 */
function 搜尋餐點(snapshotOutput, 餐點名稱) {
    return 搜尋(snapshotOutput, 餐點名稱, { 回傳類型: 'link' });
}

/**
 * 搜尋按鈕
 */
function 搜尋按鈕(snapshotOutput, 按鈕名稱) {
    return 搜尋(snapshotOutput, 按鈕名稱, { 回傳類型: 'button' });
}

/**
 * 搜尋結帳相關
 */
function 搜尋結帳(snapshotOutput) {
    return 搜尋(snapshotOutput, '結帳');
}

/**
 * 搜尋購物車
 */
function 搜尋購物車(snapshotOutput) {
    return 搜尋(snapshotOutput, '購物車');
}

/**
 * 搜尋快速新增
 */
function 搜尋快速新增(snapshotOutput) {
    return 搜尋(snapshotOutput, '快速新增', { 回傳類型: 'button' });
}

// ============================================
// 使用範例
// ============================================

/*
// 範例 1: 基本搜尋
const results = 搜尋(snapshotOutput, '醋肉');
console.log(results);
// 回傳: [
//   { ref: 'e20', content: '小份醋肉 $63', type: 'link', line: 10 },
//   { ref: 'e34', content: '小份醋肉 $63 ...', type: 'link', line: 34 },
//   ...
// ]

// 範例 2: 搜尋按鈕
const buttons = 搜尋按鈕(snapshotOutput, '新增');
console.log(buttons);

// 範例 3: 搜尋購物車
const cart = 搜尋購物車(snapshotOutput);
console.log(cart);
// 回傳: [{ ref: 'e6', content: '0 台購物車', type: 'button', line: 5 }]

// 範例 4: 取得第一個符合的 ref
const firstRef = 搜尋(snapshotOutput, '結帳')[0]?.ref;
*/

module.exports = {
    搜尋,
    搜尋餐點,
    搜尋按鈕,
    搜尋結帳,
    搜尋購物車,
    搜尋快速新增,
    取得所有Ref
};
