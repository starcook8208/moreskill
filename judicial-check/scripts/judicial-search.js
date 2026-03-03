#!/usr/bin/env node

const WebSocket = require('ws');
const http = require('http');

const BROWSER_HOST = process.env.BROWSER_HOST || 'openclaw-sandbox-browser-suent.zeabur.internal';
const BROWSER_PORT = process.env.BROWSER_PORT || 9222;

function getPageId() {
  return new Promise((resolve, reject) => {
    http.get(`http://${BROWSER_HOST}:${BROWSER_PORT}/json/list`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const pages = JSON.parse(data);
          // Find existing judicial page
          let target = pages.find(p => p.url.includes('judgment.judicial.gov.tw') && p.url !== 'about:blank');
          if (target) {
            resolve(target.id);
            return;
          }
          // Create new page
          const req = http.request({
            hostname: BROWSER_HOST,
            port: BROWSER_PORT,
            path: '/json/new',
            method: 'PUT'
          }, (res2) => {
            let data2 = '';
            res2.on('data', chunk => data2 += chunk);
            res2.on('end', () => {
              target = JSON.parse(data2);
              resolve(target.id);
            });
          });
          req.on('error', reject);
          req.end();
        } catch(e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function search(name) {
  return new Promise((resolve, reject) => {
    getPageId().then(pageId => {
      const wsUrl = `ws://${BROWSER_HOST}:${BROWSER_PORT}/devtools/page/${pageId}`;
      const ws = new WebSocket(wsUrl);
      
      ws.on('open', function() {
        ws.send(JSON.stringify({id: 1, method: 'Runtime.enable'}));
        
        // Navigate to the page
        ws.send(JSON.stringify({
          id: 2, 
          method: 'Page.navigate', 
          params: {url: 'https://judgment.judicial.gov.tw/FJUD/default.aspx'}
        }));
      });
      
      let navigated = false;
      
      ws.on('message', function(data) {
        const msg = JSON.parse(data.toString());
        
        // After navigation
        if (msg.id === 2 && msg.result) {
          navigated = true;
          // Wait for page to load
          setTimeout(() => {
            ws.send(JSON.stringify({
              id: 3, 
              method: 'Runtime.evaluate', 
              params: {expression: `var inp = document.getElementById("txtKW"); if(inp) { inp.value = "${name}"; "OK"; } else { "INPUT_NOT_FOUND"; }`}
            }));
          }, 3000);
        }
        
        if (msg.id === 3 && msg.result && msg.result.result) {
          if (msg.result.result.value === 'INPUT_NOT_FOUND') {
            ws.close();
            reject(new Error('Input field not found'));
            return;
          }
          // Submit form
          setTimeout(() => {
            ws.send(JSON.stringify({
              id: 4, 
              method: 'Runtime.evaluate', 
              params: {expression: 'document.getElementById("form1").submit()'}
            }));
          }, 500);
        }
        
        if (msg.id === 4) {
          setTimeout(() => {
            ws.send(JSON.stringify({
              id: 5, 
              method: 'Runtime.evaluate', 
              params: {expression: 'document.body.innerText'}
            }));
          }, 5000);
        }
        
        if (msg.id === 5 && msg.result && msg.result.result) {
          const text = msg.result.result.value;
          ws.close();
          resolve(text);
        }
      });
      
      ws.on('error', reject);
      
      setTimeout(() => { ws.close(); reject(new Error('Timeout')); }, 45000);
    }).catch(reject);
  });
}

// CLI
const name = process.argv[2];
if (!name) {
  console.error('Usage: node judicial-search.js <姓名>');
  process.exit(1);
}

search(name).then(result => {
  console.log(result);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
