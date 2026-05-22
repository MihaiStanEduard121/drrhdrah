# 📺 Platformă TV Live Streaming - Ghid Complet de Instalare și Deploy

Acest proiect este o platformă completă de tip **TV Live Streaming Platform** construită cu un stack modern full-stack: **Express (API & backend)** + **React & Vite (Frontend)** + **Tailwind CSS v4** + **Prisma ORM** + **SQLite (implicit în dezvoltare)**, fiind gata de găzduire/deploy pe platforme cloud cum este **Vercel** sau **Cloud Run**.

---

## 🚀 Funcționalități Principale

1. **Pagina Principală (Homepage)**:
   - Afișarea canalelor live cu logo-uri, descrieri, categorii și bife status (Live/Offline).
   - Casetă de căutare instantanee (Search Bar) și filtrare dinamică prin butoane/pills pe categorii.
   - Paginare stilizată.
   - Skeletons de încărcare și state-uri intuitive de căutare goală.

2. **Pagina de Vizionare (Channel Player `/channel/:slug`)**:
   - Player video integrat cu suport pentru iframe-uri YouTube, fluxuri IPTV sau cod embed.
   - Secțiune de recomandare automată cu "Canale Recomandate" similare din aceeași categorie.
   - Share cu copiere automată a link-ului în clipboard.
   - Ecran de mentenanță elegant pentru canalele marcate ca fiind "Offline".

3. **Panou Control Admin (`/admin`)**:
   - Autentificare securizată cu JWT (stocată local, prevenind bug-urile de cookies în iframe).
   - Carduri de statistici rapide (Canale active, canale offline, număr categorii, total posturi).
   - **Tabel Listă complet CRUD**: adăugare, editare, ștergere rapidă a posturilor, plus căutare/filtrare dedicată pentru administratori.
   - **Slug automat**: Generarea automată a adreselor URL direct în timpul tastării numelui (ex. "Kanal D" devine `kanal-d`).
   - **Preview Iframe în timp real**: Formularul de adăugare/editare permite redarea instantanee a playerului pentru a preîntâmpina embed-urile stricate înainte de salvare.
   - Alertă de dialog pentru confirmarea ștergerii (preîntâmpină ștergerile accidentale).

4. **Securitate & Sanitizare**:
   - Protecție integrată împotriva atacurilor XSS prin curățarea riguroasă a tagurilor `<script>` și a handlerelor JavaScript din descrieri sau adrese URL de embed.

---

## 🛠️ Variabile de Mediu necesare (`.env`)

Creați un fișier `.env` în rădăcina proiectului și definiți următoarele chei:

```env
# URL-ul global al aplicației generat în cloud
APP_URL="https://numele-aplicatiei-tale.vercel.app"

# Date implicite de autentificare Admin (Puteți schimba aceste valori)
ADMIN_EMAIL="admin@tvlive.ro"
ADMIN_PASSWORD="AdminPassword123!"

# Cheie secretă necesară pentru criptarea token-urilor JWT
JWT_SECRET="tv-live-streaming-token-super-secret-key-2026"
```

*Notă: În dezvoltare, dacă variabilele de admin nu sunt furnizate, se folosesc automat acreditările de siguranță de mai sus.*

---

## 💻 Instalare și Rulare Locală (În 3 Pași)

Urmați acești pași pentru a porni platforma pe calculatorul dumneavoastră:

### 1. Instalarea Dependențelor
Rulați comanda în terminalul directorului de proiect:
```bash
npm install
```

### 2. Sincronizarea bazei de date Prisma (SQLite)
Se configurează schema locală și se generează automat Prisma Client:
```bash
npx prisma db push
```
*(Baza de date locală se va crea în `/prisma/dev.db`. La prima lansare, serverul va detecta că baza este goală și va insera automat un set de **6 posturi TV românești populare** - Digi24, Pro TV, Digi Sport 1, TVR 1, Kanal D etc.).*

### 3. Pornirea Serverului de Dezvoltare
```bash
npm run dev
```
Aplicația va porni pe: **`http://localhost:3000`**

---

## ☁️ Cum se face Deploy pe Vercel

Pentru a publica aplicația gratuit pe **Vercel**, puteți folosi structura optimizată a build-ului nostru:

### Pasul 1: Conectare GitHub
1. Încărcați codul proiectului într-un repository privat pe **GitHub** (excluzând dosarul `node_modules/` și fișierul de bază de date `/prisma/dev.db` sau `/dist`).
2. Conectați-vă pe contul dumneavoastră de [Vercel](https://vercel.com).

### Pasul 2: Adăugarea Proiectului în Vercel
1. Apăsați pe **"Add New"** -> **"Project"** în dashboard-ul Vercel și selectați repo-ul proaspăt încărcat.
2. În secțiunea **Build and Output Settings**, lăsați setările implicite deoarece scripts-urile din `package.json` sunt optimizate:
   - **Build Command**: `vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs`
   - **Start Command**: `node dist/server.cjs`

### Pasul 3: Configurarea Bazei de Date de Producție (PostgreSQL / Supabase)
Platforma folosește implicit SQLite în dezvoltare. Pentru mediul de producție de tip serverless cum este Vercel (unde fișierele SQLite sunt volatile la fiecare repornire de instanță), este recomandat să folosiți un serviciu SQL gratuit cum este **Supabase**, **Neon** sau **Vercel Postgres**.

1. Creați un proiect PostgreSQL gratuit pe [Neon.tech](https://neon.tech) sau [Supabase](https://supabase.com).
2. Copiați URL-ul conexiunii (ConnectionString) oferit de ei.
3. Actualizați variabila `provider` în schema Prisma `/prisma/schema.prisma` dacă preferați să folosiți postgres:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
4. Adăugați variabila de mediu `DATABASE_URL` în **Environment Variables** din setările proiectului Vercel, cu schema preluată.

### Pasul 4: Adăugarea Variabilelor de Mediu în Vercel
Adăugați în secțiunea Vercel Env:
- `ADMIN_EMAIL` : `admin@tvlive.ro`
- `ADMIN_PASSWORD` : `AlegParolăNouăSecurizată`
- `JWT_SECRET` : `CheieSecretăCriptareJWT`
- `DATABASE_URL` : *(Găzduirea din PostgreSQL/Supabase)*

### Pasul 5: Click pe "Deploy"!
Vercel va executa build-ul, va genera indexul static și va genera API-ul optimizat.
Aplicația dvs. va fi LIVE în doar 2 minute!
