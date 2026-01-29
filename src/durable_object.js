// فایل: src/durable_object.js
// این کلاس باید EXACTLY همین نام رو داشته باشه
export class DurableChatRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.messages = [];
    this.users = new Map();
  }

  async fetch(request) {
    const url = new URL(request.url);
    const ALLOWED_USERS = ['user1', 'user2'];

    if (url.pathname === '/send' && request.method === 'POST') {
      try {
        const { sender, message } = await request.json();
        
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
        if (this.messages.length > 100) this.messages = this.messages.slice(-100);
        
        return new Response(JSON.stringify({ success: true, message: msg }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      }
    }
    
    if (url.pathname === '/messages' && request.method === 'GET') {
      return new Response(JSON.stringify(this.messages), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    if (url.pathname === '/online') {
      if (request.method === 'POST') {
        const { user } = await request.json();
        if (ALLOWED_USERS.includes(user)) {
          this.users.set(user, Date.now());
        }
      }
      
      // پاک کردن کاربران آفلاین
      const now = Date.now();
      for (const [key, time] of this.users.entries()) {
        if (now - time > 30000) this.users.delete(key);
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
    
    return new Response('Chat API - Use /send, /messages, /online');
  }
}
