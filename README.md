# TradeBot — Deriv-style dashboard

This package contains a complete **frontend + Node.js backend starter** for a dashboard visually inspired by the uploaded trading videos.

It is intentionally **not a pixel-for-pixel copy of a third-party site**, and it does not include proprietary code/assets. It gives you a similar dashboard structure: sidebar, market chart, bot controls, activity log, settings, and a server-side Deriv connection.

## Folder structure

- `frontend/` — HTML/CSS/JavaScript dashboard
- `backend/` — Node.js/Express API and Deriv WebSocket connection
- `backend/.env.example` — environment configuration template

## Run on a computer

1. Install Node.js 18+.
2. Open a terminal inside `backend`.
3. Run:
   ```bash
   npm install
   cp .env.example .env
   npm start
   ```
4. Open `frontend/index.html` in a browser.

If your browser blocks local requests from `file://`, serve the frontend with any static server, for example:
```bash
cd frontend
npx serve .
```

The frontend expects the backend at `http://localhost:3000`.

## Deriv connection

Put your Deriv API token ONLY in `backend/.env`:

```env
DERIV_APP_ID=YOUR_APP_ID
DERIV_API_TOKEN=YOUR_TOKEN
ALLOW_REAL_TRADING=false
```

Do not commit `.env` to GitHub.

The current starter can:
- connect to Deriv's WebSocket API
- retrieve a live tick for `R_10`
- retrieve account balance when a server-side token is configured
- start/stop a paper bot
- protect real mode behind `ALLOW_REAL_TRADING=false`

### Important

The included bot is **paper/demo by default**. It does not automatically place live trades. Before enabling any real trading engine, add authentication, rate limits, risk limits, logging, and a clear user confirmation flow.

## Deploying

### Frontend
The `frontend` folder can be deployed to Netlify, Vercel, GitHub Pages, etc.

### Backend
Deploy `backend` to a Node-compatible host such as Render, Railway, Fly.io, or a VPS. Set the environment variables in that host's dashboard.

After deployment, set the frontend API base by opening the browser console and running:
```js
localStorage.setItem("apiBase", "https://YOUR-BACKEND-DOMAIN")
```
Then refresh.

## GitHub

Recommended repository:
```text
tradebot/
  frontend/
  backend/
  README.md
```

Do NOT upload `backend/.env`. Upload only `.env.example`.

## Next upgrades

- Real Deriv proposal/buy execution with explicit confirmation
- WebSocket streaming instead of polling
- User login/authentication
- Supabase database for accounts/settings/history
- Per-user encrypted API-token storage
- Admin dashboard
- Strategy backtesting
- Better TradingView-style chart
- Mobile/PWA packaging
