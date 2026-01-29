// فایل: src/worker.js
// import رو درست کن
import { DurableChatRoom } from './durable_object.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // اگر مسیر API هست، به Durable Object بفرست
    if (url.pathname.startsWith('/api/')) {
      // استفاده از Durable Object
      const id = env.DURABLE_CHAT.idFromName("private-room");
      const obj = env.DURABLE_CHAT.get(id);
      
      // مسیر رو درست کن
      const newUrl = new URL(request.url);
      newUrl.pathname = newUrl.pathname.replace('/api/', '/');
      
      const newRequest = new Request(newUrl, request);
      return obj.fetch(newRequest);
    }
    
    // صفحه اصلی HTML - خیلی ساده‌تر
    const html = `<!DOCTYPE html>
<html dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>💬 چت تست</title>
    <style>
        body { font-family: Tahoma; padding: 20px; background: #f0f2f5; }
        .user-selector { margin: 20px 0; }
        .user-btn { padding: 10px 20px; margin: 0 10px; border: none; border-radius: 5px; cursor: pointer; }
        .user-btn.active { background: #007bff; color: white; }
        #chatBox { border: 1px solid #ddd; padding: 15px; height: 300px; overflow-y: auto; margin: 20px 0; background: white; }
        .message { margin: 10px 0; padding: 10px; border-radius: 10px; }
        .sent { background: #dcf8c6; text-align: left; }
        .received { background: #e8e8e8; text-align: right; }
    </style>
</head>
<body>
    <h2>💬 چت ساده</h2>
    
    <div class="user-selector">
        <button class="user-btn" id="btnUser1" onclick="setUser('user1')">کاربر ۱</button>
        <button class="user-btn" id="btnUser2" onclick="setUser('user2')">کاربر ۲</button>
    </div>
    
    <div id="chatBox">پیام‌ها اینجا نشان داده می‌شوند...</div>
    
    <div>
        <input type="text" id="messageInput" placeholder="پیام..." style="width: 70%; padding: 10px;">
        <button onclick="sendMessage()" style="padding: 10px 20px;">ارسال</button>
    </div>
    
    <div id="status" style="margin-top: 10px; color: #666;"></div>
    
    <script>
        let currentUser = 'user1';
        const API_BASE = '${url.origin}/api';
        
        function setUser(user) {
            currentUser = user;
            document.getElementById('btnUser1').classList.remove('active');
            document.getElementById('btnUser2').classList.remove('active');
            document.getElementById('btnUser' + (user === 'user1' ? '1' : '2')).classList.add('active');
            loadMessages();
        }
        
        async function sendMessage() {
            const input = document.getElementById('messageInput');
            const text = input.value.trim();
            if (!text) return;
            
            try {
                const response = await fetch(API_BASE + '/send', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({sender: currentUser, message: text})
                });
                
                if (response.ok) {
                    input.value = '';
                    loadMessages();
                }
            } catch (err) {
                console.error('ارسال خطا:', err);
            }
        }
        
        async function loadMessages() {
            try {
                const response = await fetch(API_BASE + '/messages');
                const messages = await response.json();
                
                const chatBox = document.getElementById('chatBox');
                chatBox.innerHTML = '';
                
                messages.forEach(msg => {
                    const div = document.createElement('div');
                    div.className = 'message ' + (msg.sender === currentUser ? 'sent' : 'received');
                    div.innerHTML = \`<strong>\${msg.sender}:</strong> \${msg.message}<br>
                                     <small>\${new Date(msg.timestamp).toLocaleTimeString('fa-IR')}</small>\`;
                    chatBox.appendChild(div);
                });
                
                chatBox.scrollTop = chatBox.scrollHeight;
            } catch (err) {
                console.error('خطای بارگذاری:', err);
            }
        }
        
        // Enter برای ارسال
        document.getElementById('messageInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') sendMessage();
        });
        
        // بارگذاری اولیه
        setUser('user1');
        setInterval(loadMessages, 3000);
        
        // تست اولیه
        console.log('چت آماده است. کاربر:', currentUser);
    </script>
</body>
</html>`;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
        'Cache-Control': 'no-cache'
      }
    });
  }
};
