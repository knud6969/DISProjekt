# Understory Queue System

Et skalerbart og sikkert **køsystem** udviklet i Node.js og Redis.  
Systemet beskytter webapplikationen mod høj trafik ved at håndtere brugere i en kø,  
så kun et stabilt antal får adgang ad gangen.

---

## 🧩 Funktioner

- Node.js + Express backend med REST API
- Redis som in-memory kødatastore
- PM2 i **cluster mode** for load balancing
- Worker-proces, der gradvist frigiver brugere fra køen
- HTTPS via **Let’s Encrypt / Certbot**
- Twilio-integration for SMS-status til admin
- Rate limiting & sikkerhedslag via Helmet og Express Rate Limit
- Admin-dashboard med session-baseret login

---

## ⚙️ Teknisk arkitektur

---

## 🚀 Kom i gang

### 1️⃣ Klon projektet og installer afhængigheder
```bash
git clone https://github.com/<dit-repo-navn>.git
cd understory-queue-system
npm install

## Start applikation med loadbalancer og pm2
cd ~/app/DISProjekt/understory-queue-system
pm2 start app.js -i max --name queue-app -- 3000 && pm2 start src/workers/queueWorkerEntry.js --name queue-worker && pm2 save

## Tilføj miljøvariabler i .env filen

# Kørsel
NODE_ENV=production

# Redis
REDIS_URL=redis://127.0.0.1:6379

# Hvor brugeren ender når de er "ready" (fallback når token ikke bruges)
QUEUE_REDIRECT_URL=https://lamineyamalerenwanker.app/done

ADMIN_PASS=Understory2025
SESSION_SECRET=UnderstorySecretKey

TWILIO_ACCOUNT_SID=AC8f21936bf7872e324f32060ce7a9e16b
TWILIO_AUTH_TOKEN=63e6fd9d76bc2ffcd3bf85efc7d73143
TWILIO_SERVICE_SID=MG7db6ce8397ad1256c9c0ddb41f3a27f9
ADMIN_PHONE=+4551387519   # dit eget verificerede nummer


## Loadtest

autocannon -c 300 -d 20 -p 10 --insecure -m POST \
  -H "Content-Type: application/json" \
  -b '{"userId":"loadtest"}' \
  https://lamineyamalerenwanker.app/queue/join

## Logs

pm2 logs queue-app
pm2 logs queue-worker