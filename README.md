# 🖥️ IT Asset Management & Support System

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-orange)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)
![React](https://img.shields.io/badge/React-18-blue)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

سامانه جامع مدیریت دارایی‌های IT و سیستم پشتیبانی فنی برای سازمان‌های متوسط و بزرگ.

**IT Asset Management & Technical Support System** for medium-to-large organizations.

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 📦 **Asset Management** | Track hardware/software with full lifecycle (In Stock → In Use → Retired) |
| 👷 **Employee Management** | Manage staff, departments, and role assignments |
| 🔗 **Asset Assignment** | Assign assets to employees with history tracking |
| 🎫 **Support Tickets** | Create, assign, and resolve IT support requests |
| 🔍 **Inspections** | Schedule and record periodic asset health checks |
| 📊 **Reports & Analytics** | KPIs, charts, exportable summaries |
| 🔐 **Authentication** | JWT-based login with role support (admin, support, viewer) |
| 🌙 **Dark / Light UI** | Modern RTL-first Persian UI built with React + Vite |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                       Browser                           │
│              React 18 + Vite (port 5173)                │
│   Pages: Dashboard · Assets · Employees · Tickets …     │
└─────────────────────┬───────────────────────────────────┘
                      │ REST API (JSON)
┌─────────────────────▼───────────────────────────────────┐
│                FastAPI Backend (port 8000)               │
│  /api/users · /api/assets · /api/tickets · /api/reports  │
│  Auth (JWT) · CORS · Pydantic Schemas · SQLAlchemy ORM  │
└─────────────────────┬───────────────────────────────────┘
                      │ SQLAlchemy
┌─────────────────────▼───────────────────────────────────┐
│              SQLite (dev) / PostgreSQL (prod)            │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Requirements

- **Python** 3.11+
- **Node.js** 18+ and **npm** 9+
- (Optional) **Docker** & **Docker Compose** for containerized setup

---

## 🚀 Quick Start

### Option A — Scripts (Recommended for dev)

**Linux / macOS:**
```bash
git clone https://github.com/salehkheiri1995-png/it-asset-management-system.git
cd it-asset-management-system
cp .env.example .env        # edit values as needed
bash start.sh
```

**Windows:**
```batch
git clone https://github.com/salehkheiri1995-png/it-asset-management-system.git
cd it-asset-management-system
copy .env.example .env
start.bat
```

### Option B — Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

Services will be available at:
- Frontend → http://localhost:5173
- Backend API → http://localhost:8000
- Swagger UI → http://localhost:8000/docs

### Option C — Manual Setup

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate     # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend (new terminal):**
```bash
cd frontend
npm install
npm run dev
```

---

## ⚙️ Configuration

Copy `.env.example` to `.env` and adjust the values:

```ini
# Backend
SECRET_KEY=change-me-in-production
DATABASE_URL=sqlite:///./it_assets.db
BACKEND_CORS_ORIGINS=["http://localhost:5173"]
ACCESS_TOKEN_EXPIRE_MINUTES=60
LOG_LEVEL=info

# Frontend
VITE_API_BASE_URL=http://localhost:8000
```

> ⚠️ **Never commit your `.env` file.** It is already in `.gitignore`.

---

## 📁 Project Structure

```
it-asset-management-system/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app entry point
│   │   ├── database.py      # SQLAlchemy engine + session
│   │   ├── models.py        # ORM models
│   │   ├── schemas.py       # Pydantic request/response schemas
│   │   ├── auth.py          # JWT utilities
│   │   └── routers/         # One router per domain
│   │       ├── users.py
│   │       ├── assets.py
│   │       ├── employees.py
│   │       ├── tickets.py
│   │       ├── assignments.py
│   │       ├── inspections.py
│   │       └── reports.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/           # Route-level page components
│   │   ├── components/      # Shared UI components
│   │   ├── contexts/        # React context (Auth, etc.)
│   │   ├── services/        # Axios API service layer
│   │   └── styles/          # Global CSS (custom.css)
│   ├── index.html
│   └── vite.config.js
├── .env.example
├── docker-compose.yml
├── start.sh
├── start.bat
└── README.md
```

---

## 🔑 Default Credentials (Demo)

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| IT Support | `support` | `support123` |

> Change these immediately after first login.

---

## 🗺️ Roadmap

- [ ] Alembic database migrations
- [ ] Role-Based Access Control (RBAC) per endpoint
- [ ] SLA tracking & breach alerts on tickets
- [ ] PDF / Excel export for reports
- [ ] Email/notification on ticket assignment
- [ ] Docker production profile with PostgreSQL
- [ ] i18n support (fa / en)
- [ ] REST API versioning (`/api/v1/`)

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add awesome feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

MIT © 2024 [salehkheiri1995](https://github.com/salehkheiri1995-png)
