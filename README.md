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

## Bank statement PDF extraction

The payments upload flow now supports real PDF bank statement imports.

### Backend
- Endpoint: `POST /api/payments/upload-statement`
- Accepted formats:
  - `multipart/form-data` with a `statement` PDF file and optional `franchise_name`
  - JSON fallback for manual imports
- Extraction logic file: `backend/app/services/statement_parser.py`
- Dependencies added: `pdfplumber`, `pypdf`

### Frontend
- Payments screen now supports:
  - PDF upload mode
  - Manual JSON import mode

### Notes
- Best results come from text-based bank statement PDFs with visible date, description, and amount columns.
- Image-only scanned PDFs are not supported in this build because OCR was intentionally not added.


## Bank import support

The payments import flow now supports these uploaded statement types:
- PDF (text-based statements)
- CSV
- Excel `.xlsx`
- Excel `.xls`
- JSON API fallback

Supported bank profiles and heuristics:
- Nedbank
- ABSA
- FNB
- Standard Bank
- Capitec

Notes:
- Bank selection is optional in the frontend; auto-detect is attempted first.
- CSV and Excel parsing use column mapping heuristics for common exported statement layouts.
- PDF parsing still requires text-based PDFs, not scanned image-only statements.
