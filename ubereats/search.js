/**
 * Uber Eats 搜尋輔助腳本
 * 用於自動化找 ref
 */

/**
 * 模糊搜尋任何元素
 * @param {Array} snapshot - snapshot 輸出陣列
 * @param {string} keyword - 搜尋關鍵字
 * @returns {Array} 符合的結果
 */
function 搜尋(snapshot, keyword) {
  const lowerKeyword = keyword.toLowerCase();
  return snapshot.filter(item => 
    item.content && item.content.toLowerCase().includes(lowerKeyword)
  );
}

/**
 * 搜尋餐點（精準匹配）
 * @param {Array} snapshot - snapshot 輸出陣列
 * @param {string} dishName - 餐點名稱
 * @returns {Array} 符合的結果
 */
function 搜尋餐點(snapshot, dishName) {
  const lowerName = dishName.toLowerCase();
  return snapshot.filter(item => 
    item.type === 'link' && 
    item.content && 
    item.content.toLowerCase().includes(lowerName)
  );
}

/**
 * 搜尋按鈕
 * @param {Array} snapshot - snapshot 輸出陣列
 * @param {string} buttonName - 按鈕名稱
 * @returns {Array} 符合的結果
 */
function 搜尋按鈕(snapshot, buttonName) {
  const lowerName = buttonName.toLowerCase();
  return snapshot.filter(item => 
    item.type === 'button' && 
    item.content && 
    item.content.toLowerCase().includes(lowerName)
  );
}

/**
 * 搜尋購物車按鈕
 * @param {Array} snapshot - snapshot 輸出陣列
 * @returns {Object} 購物車 ref
 */
function 搜尋購物車(snapshot) {
  const results = 搜尋(snapshot, '購物車');
  return results.length > 0 ? results[0] : null;
}

/**
 * 搜尋結帳按鈕
 * @param {Array} snapshot - snapshot 輸出陣列
 * @returns {Object} 結帳 ref
 */
function 搜尋結帳(snapshot) {
  const results = 搜尋(snapshot, '結帳');
  return results.length > 0 ? results[0] : null;
}

/**
 * 搜尋快速新增按鈕
 * @param {Array} snapshot - snapshot 輸出陣列
 * @returns {Array} 快速新增按鈕列表
 */
function 搜尋快速新增(snapshot) {
  return 搜尋(snapshot, '快速新增');
}

/**
 * 搜尋分類
 * @param {Array} snapshot - snapshot 輸出陣列
 * @param {string} categoryName - 分類名稱
 * @returns {Array} 分類結果
 */
function 搜尋分類(snapshot, categoryName) {
  const lowerName = categoryName.toLowerCase();
  return snapshot.filter(item => 
    item.type === 'link' && 
    item.content && 
    item.content.toLowerCase().includes(lowerName)
  );
}

// 匯出函數
module.exports = {
  搜尋,
  搜尋餐點,
  搜尋按鈕,
  搜尋購物車,
  搜尋結帳,
  搜尋快速新增,
  搜尋分類,
  搜尋輸入框,
  搜尋已儲存地址
};

/**
 * 搜尋輸入框（最常用於地址變更）
 * @param {Array} snapshot - snapshot 輸出陣列
 * @param {string} inputName - 輸入框名稱（可選）
 * @returns {Array} 輸入框列表
 */
function 搜尋輸入框(snapshot, inputName) {
  if (inputName) {
    const lowerName = inputName.toLowerCase();
    return snapshot.filter(item => 
      item.type === 'combobox' && 
      item.content && 
      item.content.toLowerCase().includes(lowerName)
    );
  }
  // 沒給名稱就回傳所有 combobox
  return snapshot.filter(item => item.type === 'combobox');
}

/**
 * 搜尋已儲存的地址
 * @param {Array} snapshot - snapshot 輸出陣列
 * @param {string} addressName - 地址名稱（可選）
 * @returns {Array} 地址列表
 */
function 搜尋已儲存地址(snapshot, addressName) {
  // 先找已儲存的地址區塊
  if (addressName) {
    const lowerName = addressName.toLowerCase();
    return snapshot.filter(item => 
      item.type === 'button' && 
      item.content && 
      item.content.toLowerCase().includes(lowerName)
    );
  }
  // 回傳所有 button 類型的地址
  return snapshot.filter(item => 
    item.type === 'button' && 
    item.content &&
    !item.content.includes('編輯') &&
    !item.content.includes('新增')
  );
}
