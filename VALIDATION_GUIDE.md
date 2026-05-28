# 🔒 Validation Guide - System y'Ibanze

## Inzego 4 za Validation (4 Layers)

```
Browser → Frontend (Zod) → Backend (express-validator) → Database (MySQL Constraints)
                                    ↓
                          Security Middleware (XSS, SQLi, Rate Limit)
```

---

## Layer 1: Frontend Validation (Zod + React Hook Form)

### Aho Iri: `frontend/src/utils/validators.js`

| Schema | Ikoreshwa Kuri |
|--------|---------------|
| `registerSchema` | Kwiyandikisha |
| `loginSchema` | Kwinjira |
| `nidaSchema` | Kugenzura Indangamuntu |
| `createIssueSchema` | Gutanga Ikibazo |
| `escalateSchema` | Gushyira Hejuru |
| `resolveSchema` | Gukemura Ikibazo |
| `ratingSchema` | Gusuzuma Serivisi |
| `createCertSchema` | Gusaba Impushya |
| `createProjectSchema` | Gushyiraho Umushinga |

### Indangamuntu Validation
```js
// Kugenzura:
// ✓ Imibare 16 gusa
// ✓ Itangira na '1' (Rwanda NID format)
// ✓ Nta ndangagaciro (letters, symbols)
const rwandaID = z.string()
  .regex(/^\d{16}$/)
  .refine(val => val.startsWith('1'));
```

### Ijambo Banga Rikomeye
```js
// Bisabwa:
// ✓ Nibura inyuguti 8
// ✓ Inyuguti nkuru (A-Z)
// ✓ Inyuguti ntoya (a-z)
// ✓ Umubare (0-9)
// ✓ Ikimenyetso kidasanzwe (@$!%*?&-_#)
const strongPassword = z.string()
  .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&\-_#]).{8,}$/);
```

---

## Layer 2: Backend Validation (express-validator)

### Aho Iri: `backend/src/validators/schemas.js`

**Ibikorwa bya Validation:**
- Trim whitespace
- Sanitize HTML (XSS prevention)
- Type coercion (string → int, float)
- Custom validators (Rwanda-specific)
- Cross-field validation (dates, passwords)

---

## Layer 3: Security Middleware

### Aho Iri: `backend/src/middleware/security.middleware.js`

| Middleware | Ibikorwa |
|-----------|---------|
| `authLimiter` | Max 5 login attempts / 15min |
| `nidaLimiter` | Max 10 NIDA checks / hour |
| `generalLimiter` | Max 100 requests / 15min |
| `sanitizeInputs` | Gukuraho XSS, null bytes, script tags |
| `detectSuspiciousActivity` | Gufata SQL injection patterns |
| `requireNIDAVerified` | Kugenzura NIDA mbere yo gutanga ikibazo |
| `checkRequestSize` | Max 10MB per request |

---

## Layer 4: Database Constraints (MySQL)

```sql
-- Indangamuntu: 16 digits itangira na 1
CONSTRAINT chk_indangamuntu CHECK (indangamuntu REGEXP '^1[0-9]{15}$')

-- Telefoni: Rwanda format
CONSTRAINT chk_telephone CHECK (telephone REGEXP '^0[7][2-9][0-9]{7}$')

-- Inyenyeri: 1-5 gusa
CONSTRAINT chk_inyenyeri CHECK (inyenyeri IS NULL OR (inyenyeri BETWEEN 1 AND 5))

-- GPS Coordinates
CONSTRAINT chk_latitude  CHECK (latitude  BETWEEN -90  AND 90)
CONSTRAINT chk_longitude CHECK (longitude BETWEEN -180 AND 180)

-- Project dates
CONSTRAINT chk_dates CHECK (itariki_irangira >= itariki_itangira)

-- Progress: 0-100%
CONSTRAINT chk_aho_bigeze CHECK (aho_bigeze BETWEEN 0 AND 100)
```

---

## NIDA Integration Flow

```
1. Umukoresha ashyiramo indangamuntu (16 digits)
2. Frontend: Zod kugenzura imiterere
3. Auto-trigger: useEffect iyo imibare 16 yuzuye
4. POST /api/nida/genzura (rate limited: 10/hour)
5. Backend: express-validator kugenzura
6. NIDA API call (cyangwa simulation mu dev)
7. Niba yemejwe: Auto-fill amazina
8. Niba yanzwe: Error message isobanutse
9. Kwiyandikisha bisabwa NIDA valid
```

---

## Error Response Format

```json
{
  "success": false,
  "message": "Ikibazo cya mbere (human-readable)",
  "errors": [
    {
      "field": "indangamuntu",
      "message": "Indangamuntu igomba kuba imibare 16.",
      "value": "123"
    }
  ]
}
```

---

## Security Checklist (Production)

- [x] JWT short-lived (15min access, 7d refresh)
- [x] Refresh token rotation
- [x] bcrypt cost 12
- [x] Helmet HTTP headers
- [x] CORS whitelist
- [x] Rate limiting (auth, NIDA, general)
- [x] Input sanitization (XSS)
- [x] SQL injection detection
- [x] Parameterized queries (mysql2)
- [x] File type validation (MIME + extension)
- [x] File size limit (5MB)
- [x] Row-Level Security (users see only their data)
- [x] NIDA verification required
- [x] Database CHECK constraints
- [x] No sensitive data in responses
- [x] Timing attack prevention (login)
- [x] Account suspension invalidates tokens
