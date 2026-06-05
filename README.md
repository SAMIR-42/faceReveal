# faceReveal 🔍
### AI-Powered Face Personality Analysis

**Live Demo → [facereveal.onrender.com](https://facereveal.onrender.com)**

faceReveal is a web app that analyzes your personality through a selfie. Using real-time face detection, it scans your face and reveals deep personality insights — free preview available, full analysis unlocked via payment.

---

## ✨ How It Works

```
User opens app
      ↓
Takes a selfie via camera
      ↓
Face detection runs (real face check)
      ↓
Personality analysis generated
      ↓
Free insights shown instantly
      ↓
Pay ₹1 → Full detailed analysis unlocked 🔓
```

---

## 🧠 Personality Categories Analyzed

| Category | Category |
|----------|----------|
| Overthinking | Deep Thinker |
| Trust Issues | Emotional Control |
| Confidence | Fear of Loss |
| Social Style | Inner Conflict |
| Introvert/Extrovert | Silent Observer |
| Late Night Thinker | Hidden Strength |
| Self Doubt | Loyal Nature |
| Future Anxiety | Energy Protection |
| Attachment Style | Mental Loops |
| And 20+ more... | |

---

## 🆓 Free vs 💎 Paid

| Free | Paid (₹1) |
|------|-----------|
| Personality type detected | Full detailed insights |
| Basic preview lines | 4 deep analysis lines |
| Instant result | Permanent access |

---

## 🤖 Face Detection

- Uses **face-api.js** with pre-trained ML models
- Real face verification — fake/photo detection
- Camera access via browser getUserMedia API
- Models stored in /models folder — runs client-side
- No face data stored on server — privacy safe

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Face Detection | face-api.js (TensorFlow.js based) |
| Backend | Node.js + Express.js |
| Database | MySQL (mysql2) |
| Payment | Cashfree Payment Gateway |
| Webhook Security | HMAC SHA256 signature verification |
| Deployment | Render + GitHub |

---

## 📁 Project Structure

```
faceReveal/
├── app.js              # Backend — routes, payment, webhook
├── index.html          # Landing + camera page
├── script.js           # Face detection + analysis logic
├── style.css           # Styling
├── models/             # face-api.js ML models (client-side)
├── pages/
│   └── analysis.html   # Result/analysis page
├── assets/             # Images, icons
├── sitemap.xml         # SEO
└── robots.txt          # SEO
```

---

## 💰 Payment Flow

```
User completes face scan
      ↓
Free lines shown
      ↓
User clicks "Unlock Full Analysis"
      ↓
Cashfree checkout (Rs.1)
      ↓
Webhook fires → /webhook
      ↓
HMAC signature verified (timingSafeEqual)
      ↓
DB updated → is_paid = 1
      ↓
Full paid lines served → /paid-lines/:userId ✅
```

---

## 🔒 Security Highlights

- **Webhook HMAC verification** — crypto.timingSafeEqual prevents timing attacks
- **Paid lines server-side only** — never exposed in frontend code
- **No face data stored** — analysis runs client-side, only category saved to DB
- **Payment status DB verified** — frontend cannot fake unlock
- **Raw body capture** — webhook signature validation requires exact payload

---

## 🗄️ Database Schema

```
payments   — user_id, order_id, status, amount
results    — user_id, main_category, free_lines, is_paid
```

---

## ⚙️ Environment Variables

```env
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
DB_PORT=
CASHFREE_APP_ID=
CASHFREE_SECRET_KEY=
PUBLIC_BASE_URL=https://facereveal.onrender.com
PORT=5000
```

---

## 🚀 Run Locally

```bash
git clone https://github.com/SAMIR-42/faceReveal.git
cd faceReveal
npm install
# create .env file with above variables
node app.js
```

---

## 🌐 Live

**[facereveal.onrender.com](https://facereveal.onrender.com)**

---

*Built with ❤️ by Samir*
