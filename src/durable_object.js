export class ChatRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.messages = [];
    this.users = new Map();
  }

  async fetch(request) {
    const url = new URL(request.url);
    
    // فقط ۲ کاربر اجازه دارند
    const ALLOWED_USERS = ['user1', 'user2'];
    
    // پیام جدید
    if (url.pathname === '/send') {
      try {
        const { sender, message } = await request.json();
        
        // چک کن کاربر مجاز است
        if (!ALLOWED_USERS.includes(sender)) {
          return new Response('Access denied', { status: 403 });
        }
        
        const msg = {
          id: Date.now(),
          sender: sender,
          message: message,
          timestamp: new Date().toISOString()
        };
        
        this.messages.push(msg);
        
        // فقط ۱۰۰ پیام آخر نگه دار
        if (this.messages.length > 100) {
          this.messages = this.messages.slice(-100);
        }
        
        return new Response(JSON.stringify({ success: true, message: msg }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // دریافت پیام‌ها
    if (url.pathname === '/messages') {
      return new Response(JSON.stringify(this.messages), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // کاربر آنلاین
    if (url.pathname === '/online') {
      if (request.method === 'POST') {
        const { user } = await request.json();
        if (ALLOWED_USERS.includes(user)) {
          this.users.set(user, Date.now());
        }
      }
      
      // کاربران آفلاین قدیمی را پاک کن
      const now = Date.now();
      for (const [key, time] of this.users.entries()) {
        if (now - time > 30000) { // 30 ثانیه
          this.users.delete(key);
        }
      }
      
      return new Response(JSON.stringify({
        online: Array.from(this.users.keys())
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // پاک کردن چت
    if (url.pathname === '/clear') {
      this.messages = [];
      this.users.clear();
      return new Response('Chat cleared');
    }
    
    return new Response('Chat API - Endpoints: /send, /messages, /online', {
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
