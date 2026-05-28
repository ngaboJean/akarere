# 🚀 Gutangira System y'Ibanze

## Intambwe zo Gutangira (Step by Step)

---

### 1️⃣ Gushyiraho Database

```bash
# Injira muri MySQL
mysql -u root -p

# Kora database
source database/schema.sql

# Shyiraho amakuru y'igerageza
source database/seed.sql
```

**Cyangwa ukoresha script:**
```bash
cd database
node migrate.js
```

---

### 2️⃣ Gutangira Backend

```bash
cd backend

# Gushyiraho packages
npm install

# Kora .env file
copy .env.example .env
# Hindura amakuru ya database na JWT mu .env

# Gutangira server
npm run dev
```

Backend izaba irimo gukora kuri: **http://localhost:5000**

---

### 3️⃣ Gutangira Frontend

```bash
cd frontend

# Gushyiraho packages
npm install

# Gutangira React app
npm start
```

Frontend izaba irimo gukora kuri: **http://localhost:3000**

---

## 🔑 Abakoresha b'Igerageza

| Uruhare | Indangamuntu | Ijambo Banga |
|---------|-------------|--------------|
| Umuturage | 1199780123456789 | Test@1234 |
| Umukuru w'Umudugudu | 1199780234567890 | Test@1234 |
| ES w'Akagari | 1199780345678901 | Test@1234 |
| ES w'Umurenge | 1199780456789012 | Test@1234 |
| Umuyobozi w'Akarere | 1199780567890123 | Test@1234 |

---

## 📡 API Endpoints Zikomeye

### Auth
| Method | Endpoint | Ibisobanuro |
|--------|----------|-------------|
| POST | `/api/auth/iyandikisha` | Kwiyandikisha |
| POST | `/api/auth/injira` | Kwinjira |
| POST | `/api/auth/refresh` | Guvugurura Token |
| POST | `/api/auth/sohoka` | Gusohoka |
| GET  | `/api/auth/jye` | Amakuru yanjye |

### NIDA
| Method | Endpoint | Ibisobanuro |
|--------|----------|-------------|
| POST | `/api/nida/genzura` | Kugenzura Indangamuntu |

### Ibibazo (Issues)
| Method | Endpoint | Ibisobanuro |
|--------|----------|-------------|
| GET  | `/api/ibibazo` | Gufata ibibazo byose |
| GET  | `/api/ibibazo/:id` | Ikibazo kimwe |
| POST | `/api/ibibazo` | Gutanga ikibazo gishya |
| POST | `/api/ibibazo/:id/shyira-hejuru` | Escalation |
| POST | `/api/ibibazo/:id/emeza` | Kwemeza/Gukemura |
| POST | `/api/ibibazo/:id/inyandiko` | Ohereza ubutumwa bw'ibanga |
| POST | `/api/ibibazo/:id/rating` | Gusuzuma serivisi |

### Impushya (Certificates)
| Method | Endpoint | Ibisobanuro |
|--------|----------|-------------|
| GET  | `/api/impushya` | Gufata impushya |
| POST | `/api/impushya` | Gusaba impushya |
| PUT  | `/api/impushya/:id/emeza` | Kwemeza impushya |
| PUT  | `/api/impushya/:id/anze` | Kwanga impushya |

### Raporo (Reports - District Only)
| Method | Endpoint | Ibisobanuro |
|--------|----------|-------------|
| GET  | `/api/raporo/dashboard` | Analytics ya Dashboard |
| GET  | `/api/raporo/umurenge/:id` | Raporo y'Umurenge |
| GET  | `/api/raporo/export` | Kohereza CSV |

### Inzego (Administrative Units)
| Method | Endpoint | Ibisobanuro |
|--------|----------|-------------|
| GET  | `/api/inzego/akarere` | Akarere yose |
| GET  | `/api/inzego/umurenge?akarere_id=1` | Imirenge |
| GET  | `/api/inzego/akagari?umurenge_id=1` | Akagari |
| GET  | `/api/inzego/umudugudu?akagari_id=1` | Imidugudu |

---

## 🏗️ Imiterere y'Umushinga

```
district_project/
├── database/
│   ├── schema.sql          ← DDL ya MySQL
│   ├── seed.sql            ← Amakuru y'igerageza
│   └── migrate.js          ← Migration script
│
├── backend/
│   ├── src/
│   │   ├── server.js       ← Entry point
│   │   ├── config/
│   │   │   └── database.js ← MySQL connection
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js    ← JWT + RBAC
│   │   │   ├── upload.middleware.js  ← Multer
│   │   │   └── validate.middleware.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js       ← Auth + NIDA
│   │   │   ├── ibibazo.routes.js    ← Issues + Escalation
│   │   │   ├── impushya.routes.js   ← Certificates
│   │   │   ├── raporo.routes.js     ← Analytics
│   │   │   ├── abakoresha.routes.js ← User Management
│   │   │   ├── inzego.routes.js     ← Admin Units
│   │   │   ├── ibikorwa.routes.js   ← Projects
│   │   │   ├── ubutumwa.routes.js   ← Notifications
│   │   │   └── nida.routes.js       ← NIDA API
│   │   ├── services/
│   │   │   └── nida.service.js      ← NIDA Integration
│   │   └── utils/
│   │       └── notifications.js
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── App.js              ← Router
    │   ├── index.js
    │   ├── index.css           ← Tailwind
    │   ├── store/
    │   │   └── authStore.js    ← Zustand State
    │   ├── services/
    │   │   └── api.js          ← Axios
    │   ├── components/
    │   │   └── layout/
    │   │       ├── Sidebar.jsx
    │   │       └── ProtectedRoute.jsx
    │   └── pages/
    │       ├── auth/
    │       │   ├── InjiraPage.jsx       ← Login
    │       │   └── IyandikishaPage.jsx  ← Register + NIDA
    │       ├── umuturage/
    │       │   ├── Dashboard.jsx
    │       │   ├── GutangaIkibazo.jsx   ← Submit Issue
    │       │   ├── IbibazoBye.jsx       ← Issue Tracker
    │       │   └── GusabaImpushya.jsx   ← Certificates
    │       ├── leader/
    │       │   ├── Dashboard.jsx
    │       │   ├── IbibazoBihawe.jsx    ← Issues Table
    │       │   ├── IkibazoCyimbitse.jsx ← Detail + Chat
    │       │   ├── ImpushyaZisabwa.jsx  ← Cert Management
    │       │   └── InyandikoZibanga.jsx ← Internal Messages
    │       └── akarere/
    │           ├── Dashboard.jsx        ← Analytics + Charts
    │           ├── Abakoresha.jsx       ← User Management
    │           ├── Ibikorwa.jsx         ← Projects
    │           └── Raporo.jsx           ← Reports + Export
    ├── tailwind.config.js
    ├── .env
    └── package.json
```

---

## 🔒 Umutekano (Security Features)

- ✅ JWT Authentication (Access + Refresh Tokens)
- ✅ NIDA API Validation (Indangamuntu)
- ✅ RBAC (Role-Based Access Control)
- ✅ Rate Limiting (100 req/15min, 10 auth/15min)
- ✅ Helmet.js (HTTP Security Headers)
- ✅ Input Validation (express-validator)
- ✅ Password Hashing (bcrypt cost 12)
- ✅ CORS Protection
- ✅ SQL Injection Prevention (Parameterized Queries)

---

## 📊 Imiterere y'Inzego (RBAC)

```
admin_akarere  → Byose (Full Access)
    ↓
es_umurenge    → Umurenge + Akagari + Umudugudu
    ↓
es_akagari     → Akagari + Umudugudu
    ↓
umukuru_umudugudu → Umudugudu gusa
    ↓
umuturage      → Ibibazo bye gusa
```

---

*© 2024 System y'Ibanze - Minisiteri y'Ubutegetsi bw'Igihugu - Rwanda 🇷🇼*
