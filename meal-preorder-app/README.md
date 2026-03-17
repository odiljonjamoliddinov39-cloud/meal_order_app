# Telegram Meal Preorder App

Starter scaffold for a **Telegram Bot + Telegram Mini App + Admin Panel + Express API + Prisma/Postgres** project.

## What is inside

- `backend/` — Express API, Prisma schema, auth and order routes scaffold
- `frontend/` — React app scaffold for Mini App and Admin pages
- `bot/` — Telegram bot starter that opens the Mini App
- `docs/` — product notes and MVP summary

## Core product idea

- Admin plans menu items for future dates
- Customers browse menu in a Telegram Mini App
- Users preorder meals Yandex Eats-style
- Backend enforces stock limits and deadlines
- Admin sees all orders in a dashboard

## Quick start

### 1) Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

### 2) Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### 3) Bot

```bash
cd bot
cp .env.example .env
npm install
npm run dev
```

## Recommended next steps

1. Connect backend to a real Postgres database
2. Finish Telegram init data validation
3. Build admin auth UI
4. Finish checkout flow
5. Add image upload with Cloudinary or S3-compatible storage
6. Deploy backend and frontend, then set Mini App URL in BotFather

## Main routes planned

### Customer
- `GET /api/menu/days`
- `GET /api/menu/items?date=YYYY-MM-DD`
- `POST /api/orders`
- `GET /api/orders/me`

### Admin
- `POST /api/admin/auth/login`
- `GET /api/admin/menu/days`
- `POST /api/admin/menu/days`
- `POST /api/admin/menu/items`
- `PATCH /api/admin/menu/items/:id`
- `GET /api/admin/orders?date=YYYY-MM-DD`

## Notes

This is a **starter zip**, not a finished production app. The main architecture, file structure, Prisma models, starter controllers, routes, and UI pages are already laid out so you can continue fast.
