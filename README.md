# System y'Ibanze - Sisitemu y'Ubutegetsi bw'Ibanze 🇷🇼

Sisitemu y'Ubutegetsi bw'Ibanze y'u Rwanda ihuza Abaturage n'Inzego z'Ubutegetsi.

## Imiterere y'Inzego
- **Akarere (District)** → Umuyobozi w'Akarere
- **Umurenge (Sector)** → ES w'Umurenge
- **Akagari (Cell)** → ES w'Akagari
- **Umudugudu (Village)** → Umukuru w'Umudugudu
- **Umuturage (Citizen)** → Abaturage

## Tech Stack
- Frontend: React.js + Tailwind CSS
- Backend: Express.js (Node.js)
- Database: MySQL
- Auth: JWT + NIDA API Validation

## Gutangira (Getting Started)

### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

### USSD Support
The backend includes a simulated USSD endpoint for mobile gateway testing:
- `POST /api/ussd`
- Request body: `sessionId`, `phoneNumber`, `text`
- Response contains `message` and `endSession`

### Development Notes
- If `NIDA_API_URL` is not configured, the backend falls back to a development NIDA simulation.
- This makes registration and ID validation work locally without an external NIDA service.
