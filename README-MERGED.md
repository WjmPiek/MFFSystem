# Martinsdirect merged update

This package merges the uploaded backend with the mobile-friendly frontend and fixes the auth and role flow so the app runs consistently.

## Roles
- admin: full system access
- franchisee: upload bank PDFs/statements, allocate payments, edit transactions
- user: read-only dashboard

## Key backend files
- `backend/app/routes.py` - login, auth, user management, payments, reports, password reset
- `backend/app/permissions.py` - token auth and role checks
- `backend/app/models/user.py` - user model
- `backend/app/models/payment.py` - payment transaction model
- `backend/app/__init__.py` - app factory, CORS, default admin seeding

## Key frontend files
- `frontend/src/App.jsx` - mobile-friendly dashboard, login, payments, users, reports, reset modal
- `frontend/src/assets/styles/globals.css` - responsive/mobile styles
- `frontend/public/site.webmanifest` - install icons/manifest
- `frontend/public/sw.js` - service worker

## Render env vars
### Backend
- `SECRET_KEY`
- `DATABASE_URL`
- `FRONTEND_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_NAME`
- `ADMIN_ROLE=admin`

### Frontend
- `VITE_API_URL=https://your-backend-url.onrender.com`

## Default admin
- Email: `wjm@martinsdirect.com`
- Password: `Renette7`

## Verified
- Frontend production build passes
- Backend login, auth, users, payments, and reports endpoints respond successfully
