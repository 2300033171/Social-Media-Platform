# ChatApp Backend (Node.js + Express, JS)

A fast, self-contained backend for your social media/chat app. No external DB required (uses lowdb JSON). Includes:
- Auth (register/login with JWT)
- User profiles (names, bio, avatar upload)
- Courses and Skills (maps to your current Parse models)
- Chats and Messages
- Realtime messaging with Socket.IO
- CORS configured for http://localhost:3000

## Endpoints (base URL: http://localhost:4000)

- POST /api/auth/register { username, email, password, firstName?, lastName? }
- POST /api/auth/login { usernameOrEmail, password } -> { token }
- GET /api/users/:id
- PUT /api/users/me (multipart: image?, firstName?, lastName?, bio?) [Bearer token]
- GET /api/courses/me [Bearer token]
- PUT /api/courses/me { homeUniversity?, homeDegree?, guestUniCourse? } [Bearer token]
- GET /api/skills/me [Bearer token]
- PUT /api/skills/me { frontEndDevelopment?, backendDevelopment?, ... } [Bearer token]
- GET /api/chats [Bearer token]
- POST /api/chats { targetUserId } [Bearer token]
- GET /api/messages/:chatId [Bearer token]
- POST /api/messages/:chatId { content } [Bearer token]
- GET /api/health

## Run in VS Code

1) Unzip the backend folder and open it in VS Code (File > Open Folder... > backend).
2) Copy .env.example to .env and adjust if needed:
   - PORT=4000
   - JWT_SECRET=some-long-random-secret
   - CORS_ORIGIN=http://localhost:3000
3) Install deps: open the VS Code terminal (View > Terminal) and run:
   - npm install
4) Start the server:
   - npm run dev  (auto reload) or npm start
5) Verify:
   - Open http://localhost:4000/api/health (should return { ok: true })

Uploads are saved under backend/uploads and served at http://localhost:4000/uploads/<filename>.

## Frontend Wiring (Minimal Changes)

Replace Parse with REST + Socket.IO. Suggested steps:

1) Create a central API client (src/api.js):
   export const API_BASE = 'http://localhost:4000';
   export function getAuthHeaders() {
     const t = localStorage.getItem('token');
     return t ? { Authorization: 'Bearer ' + t } : {};
   }

2) Login (replace Parse.User.logIn in src/Pages/LoginPage.js):
   async function loginverify({ emailText, password }) {
     const res = await fetch(API_BASE + '/api/auth/login', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ usernameOrEmail: emailText, password })
     });
     if (!res.ok) { alert('Login failed'); return false; }
     const data = await res.json();
     localStorage.setItem('token', data.token);
     // Navigate to profile; we also need the logged-in user ID.
     // You can decode the JWT or add /api/auth/me that returns the user; for speed, store username in context or add a 'me' fetch if needed.
     navigate('/profile');
     return true;
   }

3) Current user and profile (replace Parse.User.current + Parse.Query in src/Pages/ProfilePage.js):
   - Fetch your profile by first collecting your userId (store on login or add a GET /api/users/by-username endpoint).
   - Or temporarily pass userId via navigate state on login (like your current code).
   - Example to fetch your profile:
     const meToken = localStorage.getItem('token');
     const meId = localStorage.getItem('userId'); // set this on login after register/login returns user.id
     const profileRes = await fetch(API_BASE + '/api/users/' + meId, { headers: getAuthHeaders() });
     const profile = await profileRes.json();
     // Then courses:
     const courseRes = await fetch(API_BASE + '/api/courses/me', { headers: getAuthHeaders() });
     const course = await courseRes.json();
     // Then skills:
     const skillsRes = await fetch(API_BASE + '/api/skills/me', { headers: getAuthHeaders() });
     const skills = await skillsRes.json();

4) Registration (replace Parse.User / Parse.Object in src/Pages/Registration.js):
   - First call POST /api/auth/register
   - Then (optional) PUT /api/courses/me and PUT /api/skills/me to set initial data

5) Edit profile & image upload (replace Parse.File in src/components/EditProfile.js):
   const form = new FormData();
   form.append('firstName', firstName);
   form.append('lastName', lastName);
   form.append('bio', bio);
   if (imageFile) form.append('image', imageFile);
   await fetch(API_BASE + '/api/users/me', { method: 'PUT', headers: getAuthHeaders(), body: form });

6) Chat and messages (replace Parse LiveQuery with Socket.IO):
   - Install in frontend: npm install socket.io-client
   - Create src/socket.js:
     import { io } from 'socket.io-client';
     import { API_BASE } from './api';
     export const socket = io(API_BASE, { transports: ['websocket'] });
     export function joinChat(chatId) { socket.emit('chat:join', { chatId }); }
   - In your ChatWindow component:
     import { socket, joinChat } from '../socket';
     useEffect(() => {
       joinChat(chatId);
       function onNew(msg) { setMessages(prev => [...prev, msg]); }
       socket.on('message:new', onNew);
       return () => socket.off('message:new', onNew);
     }, [chatId]);
     // To send:
     const token = localStorage.getItem('token');
     socket.emit('message:send', { token, chatId, content });

   - For initial messages (replace Parse.Query('Message')):
     const res = await fetch(API_BASE + '/api/messages/' + chatId, { headers: getAuthHeaders() });
     setMessages(await res.json());

Note: For tomorrow’s demo, you can scope to login, profile load/update, and basic chat send/receive between two users.
