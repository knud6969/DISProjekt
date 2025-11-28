# Understory Queue System

Et simpelt, men fagligt stærkt køsystem bygget til Understory-casen i faget  
**Computernetværk og Distribuerede Systemer (HA(it.))**.

Systemet beskytter en “bagvedliggende” applikation mod høj belastning ved at:
- sætte brugere i kø i Redis,
- slippe dem igennem i kontrollerede batches,
- og redirecte dem sikkert videre med engangstokens.

---

## Arkitektur – kort fortalt

**Teknologistak**

- Node.js + Express
- Redis (kø, tokens, IP-strikes)
- Nginx (reverse proxy + HTTPS + load balancing)
- PM2 (processtyring)
- Twilio (SMS til admin)
- Vanilla HTML/CSS/JS på frontend

**Hovedkomponenter**

- **Express-app (`app.js`)**
  - Public pages: `/`, `/queue/status`, `/done`
  - Queue API: `/queue/join`, `/queue/status/:userId`, `/queue/claim/:token`
  - Admin: `/admin/login`, `/admin`, `/admin/send-sms`
  - Middleware: helmet, morgan, cookies, sessions, rate limiting, IP-ban
- **Redis**
  - `queue:pending` (ZSET) – ventende brugere
  - `queue:ready` (SET) – brugere klar til redirect
  - `queue:user:<userId>` (HASH) – status, timestamps, redirectUrl
  - `queue:token:<token>` (STRING) – engangstokens til redirect
- **Worker (`src/workers/queueWorker.js`)**
  - Kører i separat PM2-proces
  - Hvert **2. sekund**: flytter op til **50** brugere fra `PENDING` → `READY`
  - Giver ca. **25 brugere/sekund** i maks. throughput

---

## Queue-flow

1. **Bruger lander på forsiden** `/`
   - Klikker “Tilmeld kø” → browseren genererer `userId` (UUID) og kalder `/queue/join`.
2. **Join** – `POST /queue/join`
   - Hvis `userId` mangler, genererer serveren selv et UUID.
   - Brugeren sættes i Redis-kø og får sin position retur.
3. **Status** – `GET /queue/status/:userId`
   - Frontend poller periodisk.
   - Hvis `status = waiting` → position, antal foran og ETA.
   - Hvis `status = ready` → serveren udsteder engangstoken.
4. **Redirect** – `GET /queue/claim/:token`
   - Token kan kun bruges én gang.
   - Token slås op i Redis, slettes, og brugeren redirectes til `QUEUE_REDIRECT_URL` (fx `/done` eller Understory-site).

---

## Admin-dashboard

Admin-flow:

- Login via `/admin/login` med kode fra `.env` (`ADMIN_PASS`).
- Efter login: `/admin`
  - Viser mockede kø-statistikker (kølængde, gns. ventetid, brugere i dag).
  - Knap “Send SMS” → kalder `/admin/send-sms`, som sender status til admin via Twilio.

Sessions og cookies:

- `express-session` + `cookie-parser`
- Cookie:
  - `secure: true`
  - `httpOnly: true`
  - `sameSite: "none"` (bag HTTPS + Nginx)
- Admin-beskyttelse via `req.session.isAdmin`.

---

## Sikkerhed og robusthed

- **HTTPS** via Let’s Encrypt (Nginx terminering)
- **Helmet**:
  - Stram Content Security Policy, HSTS, no-sniff, osv.
- **Rate limiting + IP-ban** (Redis-backed)
  - `joinLimiter` og `statusLimiter` med høje limits til loadtest
  - IP-strikes i Redis → midlertidig IP-ban ved misbrug
- **Engangstokens**
  - `queue:token:<token>` slettes efter brug → beskytter redirect flowet
- **Sessions + cookies**
  - Admin login gemmes i session (server-side)
- **Miljøvariabler**
  - Ingen secrets i koden: Redis, Twilio, admin-kode, session-secret osv. i `.env`.
- **Logging**
  - `morgan` HTTP-logging (til PM2 logs)
  - Egen logging ved fejl i controller/service/worker

---

## Miljøvariabler (`.env`)

Eksempel på `.env` (lokalt og på droplet):

```env
NODE_ENV=production

# Redis
REDIS_URL=redis://127.0.0.1:6379

# Queue redirect (hvor brugeren ender efter kø)
QUEUE_REDIRECT_URL=https://lamineyamalerenwanker.app/done

# Admin
ADMIN_PASS=Understory2025
SESSION_SECRET=et_langt_tilfældigt_secret

# Rate limiting (valgfri, har defaults)
JOIN_LIMIT_PER_MIN=20000
STATUS_LIMIT_PER_MIN=60000

# Twilio (SMS til admin)
TWILIO_ACCOUNT_SID=ACXXXXXXXX...
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_SERVICE_SID=MGXXXXXXXX...
ADMIN_PHONE=+45XXXXXX