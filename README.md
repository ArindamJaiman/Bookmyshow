# 🎬 SeatHold — BookMyShow Seat Reservation System

A full-stack movie ticket seat reservation system that holds your selected seats on BookMyShow for up to 2 hours using browser automation.

## ✨ Features

- **URL Input**: Paste any BookMyShow show URL to load seat layout
- **Interactive Seat Map**: Visual seat grid with row/column layout and category sections
- **2-Hour Hold**: Automated seat holding via headless browser (Puppeteer)
- **Real-Time Updates**: WebSocket-powered live seat status updates
- **Auto Re-Select**: Automatic re-selection if seats get deselected
- **User Dashboard**: Manage active holds, extend, confirm, or release
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🛠 Tech Stack

| Layer      | Technology                                    |
|------------|-----------------------------------------------|
| Frontend   | React 18, Vite, Framer Motion, Lucide Icons   |
| Backend    | Node.js, Express, WebSocket (ws)              |
| Automation | Puppeteer (headless Chrome)                   |
| Database   | Supabase (PostgreSQL)                         |
| Auth       | Supabase Auth (JWT)                           |
| Deploy     | Oracle Cloud Free Tier, PM2, Nginx            |

## 📁 Project Structure

```
├── client/           # React frontend (Vite)
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Route pages
│   │   ├── hooks/       # React hooks
│   │   ├── api/         # API client
│   │   └── utils/       # Utilities
│   └── index.html
├── server/           # Express backend
│   ├── routes/       # API routes
│   ├── services/     # Business logic
│   ├── middleware/    # Auth, rate limiting
│   ├── websocket/    # WebSocket handlers
│   └── db/           # Database schema & client
└── deploy/           # Deployment configs
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A Supabase project (free tier)

### 1. Clone & Setup
```bash
git clone https://github.com/ArindamJaiman/Bookmyshow.git
cd Bookmyshow
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 2. Start Backend
```bash
cd server
npm install
npm run dev
```

### 3. Start Frontend
```bash
cd client
npm install
npm run dev
```

### 4. Open App
Navigate to `http://localhost:5173`

## 🗄 Database Setup

Run the SQL in `server/db/schema.sql` in your Supabase SQL Editor to create the required tables.

## 📡 API Reference

### Auth
| Method | Endpoint           | Description       |
|--------|--------------------|--------------------|
| POST   | /api/auth/signup   | Create account     |
| POST   | /api/auth/login    | Sign in            |
| POST   | /api/auth/logout   | Sign out           |
| GET    | /api/auth/me       | Get current user   |

### Shows
| Method | Endpoint           | Description              |
|--------|--------------------|--------------------------| 
| POST   | /api/shows/parse   | Parse BookMyShow URL     |
| GET    | /api/shows/seats   | Get seat availability    |

### Holds
| Method | Endpoint              | Description           |
|--------|-----------------------|-----------------------|
| POST   | /api/holds            | Create seat hold      |
| GET    | /api/holds            | List user's holds     |
| GET    | /api/holds/:id        | Get hold details      |
| DELETE | /api/holds/:id        | Cancel hold           |
| POST   | /api/holds/:id/confirm | Confirm booking      |
| POST   | /api/holds/:id/extend  | Extend by 30 min     |

### WebSocket
Connect to `/ws?token=<jwt>` for real-time updates.

## ⚠️ Disclaimer

This project is a **technical demonstration**. Automating interactions with BookMyShow may violate their Terms of Service. Use responsibly and at your own risk.

## 📄 License

MIT
