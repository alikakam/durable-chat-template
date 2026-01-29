import { ChatRoom } from './durable_object';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // درخواست‌ها را به Durable Object هدایت کن
    if (url.pathname.startsWith('/api/')) {
      // برای دونفر یک چت روم ثابت
      const roomId = env.CHAT_ROOM.idFromName('private-chat-2');
      const room = env.CHAT_ROOM.get(roomId);
      
      // URL را اصلاح کن
      const newUrl = new URL(request.url);
      newUrl.pathname = newUrl.pathname.replace('/api/', '/');
      
      const newRequest = new Request(newUrl, request);
      return room.fetch(newRequest);
    }
    
    // صفحه اصلی HTML
    return new Response(`
<!DOCTYPE html>
<html dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>💬 چت خصوصی دو نفره</title>
    <style>
        * { box-sizing: border-box; }
        body { 
            font-family: Tahoma, Arial; 
            margin: 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 20px; 
            padding: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .user-selector {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 10px;
        }
        .user-btn {
            flex: 1;
            padding: 12px;
            border: none;
            border-radius: 8px;
            background: #e9ecef;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s;
        }
        .user-btn.active {
            background: #007bff;
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,123,255,0.3);
        }
        .chat-box {
            height: 400px;
            overflow-y: auto;
            border: 2px solid #e9ecef;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 20px;
            background: #f8f9fa;
        }
        .message {
            margin: 10px 0;
            padding: 12px 15px;
            border-radius: 15px;
            max-width: 80%;
            word-wrap: break-word;
            animation: fadeIn 0.3s;
        }
        .message.sent {
            background: linear-gradient(135deg, #007bff, #6610f2);
            color: white;
            margin-left: auto;
            margin-right: 10px;
            border-bottom-right-radius: 5px;
        }
        .message.received {
            background: #e9ecef;
            margin-right: auto;
            margin-left: 10px;
            border-bottom-left-radius: 5px;
        }
        .message .time {
            font-size: 11px;
            opacity: 0.7;
            margin-top: 5px;
            display: block;
        }
        .input-area {
            display: flex;
            gap: 10px;
        }
        #messageInput {
            flex: 1;
            padding: 15px;
            border: 2px solid #e9ecef;
            border-radius: 10px;
            font-size: 16px;
        }
        #sendBtn {
            padding: 15px 25px;
            background: linear-gradient(135deg, #28a745, #20c997);
            color: white;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-size: 16px;
            transition: transform 0.2s;
        }
        #sendBtn:hover {
            transform: scale(1.05);
        }
        .online-status {
            margin-top: 10px;
            font-size: 14px;
            color: #6c757d;
            text-align: center;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 style="text-align: center; color: #333;">💬 چت خصوصی دو نفره</h1>
        
        <div class="user-selector">
            <button class="user-btn" onclick="setUser('user1')">👤 کاربر ۱</button>
            <button class="user-btn" onclick="setUser('user2')">👤 کاربر ۲</button>
        </div>
        
        <div class="chat-box" id="chatBox"></div>
        
        <div class="input-area">
            <input type="text" id="messageInput" placeholder="پیام خود را بنویسید..." autocomplete="off">
            <button id="sendBtn" onclick="sendMessage()">ارسال</button>
        </div>
        
        <div class="online-status" id="onlineStatus"></div>
    </div>
    
    <script>
        const API_URL = '${url.origin}/api';
        let currentUser = 'user1';
        
        // تنظیم کاربر فعال
        function setUser(user) {
            currentUser = user;
            document.querySelectorAll('.user-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.textContent.includes(user === 'user1' ? 'کاربر ۱' : 'کاربر ۲')) {
                    btn.classList.add('active');
                }
            });
            loadMessages();
            updateOnlineStatus();
        }
        
        // ارسال پیام
        async function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            if (!message) return;
            
            try {
                const response = await fetch(API_URL + '/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sender: currentUser,
                        message: message
                    })
                });
                
                if (response.ok) {
                    input.value = '';
                    loadMessages();
                    updateOnlineStatus();
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }
        
        // دریافت پیام‌ها
        async function loadMessages() {
            try {
                const response = await fetch(API_URL + '/messages');
                const messages = await response.json();
                
                const chatBox = document.getElementById('chatBox');
                chatBox.innerHTML = '';
                
                messages.forEach(msg => {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message ' + 
                        (msg.sender === currentUser ? 'sent' : 'received');
                    
                    const emoji = msg.sender === 'user1' ? '👨‍💻' : '👩‍💻';
                    const time = new Date(msg.timestamp).toLocaleTimeString('fa-IR', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    messageDiv.innerHTML = \`
                        <div><strong>\${emoji} \${msg.sender === 'user1' ? 'کاربر ۱' : 'کاربر ۲'}:</strong></div>
                        <div>\${msg.message}</div>
                        <span class="time">\${time}</span>
                    \`;
                    
                    chatBox.appendChild(messageDiv);
                });
                
                chatBox.scrollTop = chatBox.scrollHeight;
            } catch (error) {
                console.error('Error loading messages:', error);
            }
        }
        
        // وضعیت آنلاین
        async function updateOnlineStatus() {
            try {
                await fetch(API_URL + '/online', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user: currentUser })
                });
                
                const response = await fetch(API_URL + '/online');
                const data = await response.json();
                
                const status = document.getElementById('onlineStatus');
                const onlineUsers = data.online || [];
                const otherUser = currentUser === 'user1' ? 'user2' : 'user1';
                
                if (onlineUsers.includes(otherUser)) {
                    status.innerHTML = '🟢 کاربر دیگر آنلاین است';
                    status.style.color = '#28a745';
                } else {
                    status.innerHTML = '⚫ کاربر دیگر آفلاین است';
                    status.style.color = '#6c757d';
                }
            } catch (error) {
                console.error('Error updating status:', error);
            }
        }
        
        // Enter برای ارسال
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
        
        // بارگذاری اولیه
        setUser('user1');
        setInterval(loadMessages, 2000);
        setInterval(updateOnlineStatus, 5000);
    </script>
</body>
</html>
    `, {
      headers: { 'Content-Type': 'text/html; charset=UTF-8' }
    });
  }
}
