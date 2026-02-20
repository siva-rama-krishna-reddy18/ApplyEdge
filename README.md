# ⚡ ApplyEdge

> AI resume intelligence platform — score, optimize, tailor, and apply smarter.

Built with **FastAPI**, **React**, and **Groq LLaMA 3.3 70B**.

---

## Features

- 📊 **Resume Score** — AI scoring across Clarity, Impact, Keywords, Structure, ATS
- 🛡️ **ATS Audit** — detect and fix applicant tracking system issues  
- 🎯 **Job Match** — paste any job description, get a match score + missing skills
- ✏️ **Bullet Rewrite** — AI rewrites weak bullet points with stronger language
- ✨ **Auto-Tailor** — section-by-section resume rewrite with keyword bolding
- 📝 **Cover Letter** — personalized letters in 3 tones with subject line
- 🎤 **Interview Prep** — 10 Q&A pairs based on your resume + target role
- 🔍 **Job Search** — live job listings via Adzuna API
- 🔖 **Saved Jobs** — bookmark jobs for later

---

## Tech Stack

| Layer    | Tech                                   |
|----------|----------------------------------------|
| Frontend | React + Vite                           |
| Backend  | FastAPI + Python                       |
| AI       | Groq (LLaMA 3.3 70B)                  |
| PDF      | ReportLab                              |
| Jobs     | Adzuna API                             |
| Deploy   | Vercel (frontend) + Render (backend)   |

---

## Local Setup

### Backend
```bash
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # fill in your API keys
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env       # set VITE_API_URL=http://localhost:8000
npm run dev
```

---

## Environment Variables

**Backend `.env`**
```
GROQ_API_KEY=
ADZUNA_APP_ID=
ADZUNA_APP_KEY=
FRONTEND_URL=https://your-app.vercel.app
```

**Frontend `.env`**
```
VITE_API_URL=https://your-api.onrender.com
```

---

## Deploy

- **Backend → [Render](https://render.com)** — `render.yaml` is included, just connect your repo
- **Frontend → [Vercel](https://vercel.com)** — set root directory to `frontend/`, framework to Vite

---

## License

MIT
