"""
main.py — ApplyEdge API v4.0
Changes from v3:
  - generate_resume_pdf now imported from resume_generators (FAANG style)
  - generate_resume_docx added (new FAANG-style Word download)
  - /download-resume    → uses resume_generators.generate_resume_pdf
  - /download-resume-docx → NEW endpoint, returns .docx
  - All other routes unchanged
"""

import os
import sqlite3
import uuid
from datetime import datetime
from typing import Optional

import requests as http_requests
import uvicorn
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from analyzer import (
    extract_resume_text, analyze_resume, match_job,
    rewrite_bullets, tailor_resume, generate_interview_qa,
    generate_cover_letter,
)
# FAANG-style resume export (replaces old generate_resume_pdf from analyzer)
from resume_generators import generate_resume_pdf, generate_resume_docx

app = FastAPI(title="ApplyEdge API", version="4.0.0")

# ── CORS ──────────────────────────────────────────────────────
import os as _os
_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
_frontend = _os.getenv("FRONTEND_URL")
if _frontend:
    _origins.append(_frontend)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── DATABASE ──────────────────────────────────────────────────
DB_PATH = "applyedge.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS resume_versions (
            id           TEXT PRIMARY KEY,
            user_id      TEXT NOT NULL,
            name         TEXT NOT NULL,
            content      TEXT NOT NULL,
            target_role  TEXT,
            score        INTEGER,
            word_count   INTEGER,
            created_at   TEXT NOT NULL,
            updated_at   TEXT NOT NULL,
            is_active    INTEGER DEFAULT 0
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS interview_sessions (
            id               TEXT PRIMARY KEY,
            user_id          TEXT NOT NULL,
            job_title        TEXT,
            job_description  TEXT,
            resume_text      TEXT,
            questions        TEXT,
            answers          TEXT,
            grades           TEXT,
            overall_score    INTEGER,
            status           TEXT DEFAULT 'in_progress',
            created_at       TEXT NOT NULL,
            updated_at       TEXT NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS job_applications (
            id              TEXT PRIMARY KEY,
            user_id         TEXT NOT NULL,
            job_title       TEXT NOT NULL,
            company         TEXT NOT NULL,
            job_url         TEXT,
            job_description TEXT,
            location        TEXT,
            salary          TEXT,
            status          TEXT DEFAULT 'applied',
            notes           TEXT,
            interview_date  TEXT,
            contact_name    TEXT,
            contact_email   TEXT,
            resume_version  TEXT,
            created_at      TEXT NOT NULL,
            updated_at      TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

init_db()

def row_to_dict(row):
    return dict(row) if row else None

def count_words(text: str) -> int:
    return len(text.split())

import json as _json

def call_claude(prompt: str, system: str = "") -> str:
    groq_key   = os.getenv("GROQ_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")

    if groq_key:
        resp = http_requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {groq_key}"},
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    *([ {"role":"system","content":system} ] if system else []),
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.2,
            },
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]

    elif openai_key:
        resp = http_requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {openai_key}"},
            json={
                "model": "gpt-4o-mini",
                "messages": [
                    *([ {"role":"system","content":system} ] if system else []),
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.2,
            },
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]

    raise HTTPException(503, "No AI API key configured. Set GROQ_API_KEY or OPENAI_API_KEY.")


# ══════════════════════════════════════════════════════════════
# FEATURE 1 — RESUME VERSION MANAGER
# ══════════════════════════════════════════════════════════════

class CreateVersionRequest(BaseModel):
    user_id: str
    name: str
    content: str
    target_role: Optional[str] = None

class UpdateVersionRequest(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None
    target_role: Optional[str] = None
    score: Optional[int] = None


@app.get("/api/versions/{user_id}")
def get_versions(user_id: str):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM resume_versions WHERE user_id=? ORDER BY updated_at DESC",
        (user_id,)
    ).fetchall()
    conn.close()
    return {"versions": [row_to_dict(r) for r in rows], "total": len(rows)}


@app.post("/api/versions")
def create_version(req: CreateVersionRequest):
    if not req.name.strip() or not req.content.strip():
        raise HTTPException(400, "Name and content are required.")
    conn = get_db()
    vid = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    conn.execute("""
        INSERT INTO resume_versions
            (id, user_id, name, content, target_role, word_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (vid, req.user_id, req.name, req.content,
          req.target_role, count_words(req.content), now, now))
    conn.commit()
    version = row_to_dict(conn.execute(
        "SELECT * FROM resume_versions WHERE id=?", (vid,)
    ).fetchone())
    conn.close()
    return {"success": True, "version": version}


@app.put("/api/versions/{user_id}/{version_id}")
def update_version(user_id: str, version_id: str, req: UpdateVersionRequest):
    conn = get_db()
    existing = conn.execute(
        "SELECT * FROM resume_versions WHERE id=? AND user_id=?",
        (version_id, user_id)
    ).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(404, "Version not found.")
    now         = datetime.utcnow().isoformat()
    name        = req.name        or existing["name"]
    content     = req.content     or existing["content"]
    target_role = req.target_role or existing["target_role"]
    score       = req.score if req.score is not None else existing["score"]
    conn.execute("""
        UPDATE resume_versions
        SET name=?, content=?, target_role=?, score=?, word_count=?, updated_at=?
        WHERE id=? AND user_id=?
    """, (name, content, target_role, score, count_words(content), now, version_id, user_id))
    conn.commit()
    updated = row_to_dict(conn.execute(
        "SELECT * FROM resume_versions WHERE id=?", (version_id,)
    ).fetchone())
    conn.close()
    return {"success": True, "version": updated}


@app.delete("/api/versions/{user_id}/{version_id}")
def delete_version(user_id: str, version_id: str):
    conn = get_db()
    if not conn.execute(
        "SELECT id FROM resume_versions WHERE id=? AND user_id=?",
        (version_id, user_id)
    ).fetchone():
        conn.close()
        raise HTTPException(404, "Version not found.")
    conn.execute("DELETE FROM resume_versions WHERE id=? AND user_id=?",
                 (version_id, user_id))
    conn.commit()
    conn.close()
    return {"success": True, "deleted_id": version_id}


@app.post("/api/versions/{user_id}/{version_id}/duplicate")
def duplicate_version(user_id: str, version_id: str):
    conn = get_db()
    original = conn.execute(
        "SELECT * FROM resume_versions WHERE id=? AND user_id=?",
        (version_id, user_id)
    ).fetchone()
    if not original:
        conn.close()
        raise HTTPException(404, "Version not found.")
    new_id = str(uuid.uuid4())
    now    = datetime.utcnow().isoformat()
    conn.execute("""
        INSERT INTO resume_versions
            (id, user_id, name, content, target_role, word_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (new_id, user_id, f"Copy of {original['name']}",
          original["content"], original["target_role"],
          original["word_count"], now, now))
    conn.commit()
    new_version = row_to_dict(conn.execute(
        "SELECT * FROM resume_versions WHERE id=?", (new_id,)
    ).fetchone())
    conn.close()
    return {"success": True, "version": new_version}


@app.put("/api/versions/{user_id}/{version_id}/activate")
def activate_version(user_id: str, version_id: str):
    conn = get_db()
    conn.execute("UPDATE resume_versions SET is_active=0 WHERE user_id=?", (user_id,))
    conn.execute("UPDATE resume_versions SET is_active=1 WHERE id=? AND user_id=?",
                 (version_id, user_id))
    conn.commit()
    conn.close()
    return {"success": True, "active_version_id": version_id}


@app.get("/api/versions/{user_id}/compare/{id1}/{id2}")
def compare_versions(user_id: str, id1: str, id2: str):
    conn = get_db()
    v1 = row_to_dict(conn.execute(
        "SELECT * FROM resume_versions WHERE id=? AND user_id=?", (id1, user_id)
    ).fetchone())
    v2 = row_to_dict(conn.execute(
        "SELECT * FROM resume_versions WHERE id=? AND user_id=?", (id2, user_id)
    ).fetchone())
    conn.close()
    if not v1 or not v2:
        raise HTTPException(404, "One or both versions not found.")
    return {
        "version1": v1, "version2": v2,
        "comparison": {
            "word_count_diff": (v1["word_count"] or 0) - (v2["word_count"] or 0),
            "score_diff":      (v1["score"] or 0) - (v2["score"] or 0),
            "newer":           v1["id"] if v1["updated_at"] > v2["updated_at"] else v2["id"],
        },
    }


# ══════════════════════════════════════════════════════════════
# FEATURE 2 — INTERVIEW SIMULATOR
# ══════════════════════════════════════════════════════════════

class StartInterviewRequest(BaseModel):
    user_id: str
    job_title: str
    job_description: str
    resume_text: str
    num_questions: int = 8

class GradeAnswerRequest(BaseModel):
    session_id: str
    user_id: str
    question_index: int
    answer: str


@app.post("/api/interview/start")
def start_interview(req: StartInterviewRequest):
    prompt = f"""
You are an expert technical interviewer. Generate exactly {req.num_questions} interview questions
for this role and candidate.

Job Title: {req.job_title}
Job Description: {req.job_description[:1000]}
Resume Summary: {req.resume_text[:1500]}

Return ONLY a JSON array of objects. Each object must have:
- "question": the interview question (string)
- "type": one of "behavioral", "technical", "situational", "experience"
- "difficulty": one of "easy", "medium", "hard"

Return ONLY the JSON array, no other text.
"""
    raw = call_claude(prompt)
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    try:
        questions = _json.loads(raw)
    except Exception:
        raise HTTPException(500, "Failed to parse questions from AI. Try again.")

    conn = get_db()
    sid = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    conn.execute("""
        INSERT INTO interview_sessions
            (id, user_id, job_title, job_description, resume_text,
             questions, answers, grades, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (sid, req.user_id, req.job_title, req.job_description,
          req.resume_text, _json.dumps(questions),
          _json.dumps([None] * len(questions)),
          _json.dumps([None] * len(questions)),
          now, now))
    conn.commit()
    conn.close()

    return {
        "session_id": sid,
        "questions": questions,
        "total_questions": len(questions),
        "job_title": req.job_title,
    }


@app.post("/api/interview/grade")
def grade_answer(req: GradeAnswerRequest):
    conn = get_db()
    session = conn.execute(
        "SELECT * FROM interview_sessions WHERE id=? AND user_id=?",
        (req.session_id, req.user_id)
    ).fetchone()
    if not session:
        conn.close()
        raise HTTPException(404, "Session not found.")

    questions = _json.loads(session["questions"])
    answers   = _json.loads(session["answers"])
    grades    = _json.loads(session["grades"])

    if req.question_index >= len(questions):
        conn.close()
        raise HTTPException(400, "Invalid question index.")

    question = questions[req.question_index]

    prompt = f"""
You are a senior technical interviewer grading a candidate's answer. Be STRICT and HONEST.

GRADING SCALE — follow this exactly:
- 90-100: Exceptional. Specific examples, quantified impact, perfectly structured (STAR method), addresses all aspects. Very rare.
- 75-89:  Good. Clear answer with examples, mostly complete, minor gaps.
- 55-74:  Average. Some relevant content but missing examples, vague, or incomplete.
- 35-54:  Below average. Mostly generic, no specific examples, misses key points.
- 0-34:   Poor. Off-topic, too short, no substance, or completely wrong.

DEDUCT points for:
- No specific examples (-20)
- No measurable results or numbers (-10)
- Vague or generic answer (-15)
- Does not address the actual question (-25)
- Answer under 3 sentences (-20)

Job Title: {session['job_title']}
Question: {question['question']}
Question Type: {question['type']}
Candidate's Answer: {req.answer}

Return ONLY a JSON object with:
- "score": integer 0-100 (be strict, most answers score 40-70)
- "verdict": one of "Excellent", "Good", "Average", "Poor"
- "strengths": array of 2-3 short strings about what was good
- "improvements": array of 2-3 short strings about what was missing or weak
- "ideal_points": array of 3-4 key points the ideal answer should include
- "tip": one short actionable tip to improve this answer

Return ONLY the JSON object, no other text.
"""
    raw = call_claude(prompt)
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    try:
        grade = _json.loads(raw)
    except Exception:
        raise HTTPException(500, "Failed to parse grade from AI.")

    score = grade.get("score", 50)
    if score >= 90:   grade["verdict"] = "Excellent"
    elif score >= 75: grade["verdict"] = "Good"
    elif score >= 55: grade["verdict"] = "Average"
    else:             grade["verdict"] = "Poor"

    answers[req.question_index] = req.answer
    grades[req.question_index]  = grade
    now = datetime.utcnow().isoformat()

    all_answered = all(a is not None for a in answers)
    overall_score, status = None, "in_progress"
    if all_answered:
        scored = [g["score"] for g in grades if g and "score" in g]
        overall_score = int(sum(scored) / len(scored)) if scored else 0
        status = "completed"

    conn.execute("""
        UPDATE interview_sessions
        SET answers=?, grades=?, overall_score=?, status=?, updated_at=?
        WHERE id=?
    """, (_json.dumps(answers), _json.dumps(grades),
          overall_score, status, now, req.session_id))
    conn.commit()
    conn.close()

    return {
        "question_index": req.question_index,
        "grade": grade,
        "answered": sum(1 for a in answers if a is not None),
        "total": len(questions),
        "session_complete": all_answered,
        "overall_score": overall_score,
    }


@app.get("/api/interview/session/{session_id}")
def get_session(session_id: str):
    conn = get_db()
    session = conn.execute(
        "SELECT * FROM interview_sessions WHERE id=?", (session_id,)
    ).fetchone()
    conn.close()
    if not session:
        raise HTTPException(404, "Session not found.")
    data = row_to_dict(session)
    data["questions"] = _json.loads(data["questions"] or "[]")
    data["answers"]   = _json.loads(data["answers"]   or "[]")
    data["grades"]    = _json.loads(data["grades"]    or "[]")
    return data


@app.get("/api/interview/history/{user_id}")
def get_interview_history(user_id: str):
    conn = get_db()
    rows = conn.execute("""
        SELECT id, user_id, job_title, overall_score, status, created_at, updated_at
        FROM interview_sessions WHERE user_id=? ORDER BY created_at DESC
    """, (user_id,)).fetchall()
    conn.close()
    return {"sessions": [row_to_dict(r) for r in rows], "total": len(rows)}


# ══════════════════════════════════════════════════════════════
# FEATURE 3 — JOB APPLICATION TRACKER
# ══════════════════════════════════════════════════════════════

VALID_STATUSES = ["applied", "screening", "interview", "offer", "rejected"]

class CreateApplicationRequest(BaseModel):
    user_id: str
    job_title: str
    company: str
    job_url: Optional[str] = None
    job_description: Optional[str] = None
    location: Optional[str] = None
    salary: Optional[str] = None
    notes: Optional[str] = None
    resume_version: Optional[str] = None

class UpdateApplicationRequest(BaseModel):
    job_title: Optional[str] = None
    company: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    interview_date: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    salary: Optional[str] = None
    location: Optional[str] = None

class UpdateStatusRequest(BaseModel):
    status: str


@app.post("/api/applications")
def create_application(req: CreateApplicationRequest):
    if not req.job_title.strip() or not req.company.strip():
        raise HTTPException(400, "Job title and company are required.")
    conn = get_db()
    aid = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    conn.execute("""
        INSERT INTO job_applications
            (id, user_id, job_title, company, job_url, job_description,
             location, salary, status, notes, resume_version, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'applied', ?, ?, ?, ?)
    """, (aid, req.user_id, req.job_title, req.company, req.job_url,
          req.job_description, req.location, req.salary,
          req.notes, req.resume_version, now, now))
    conn.commit()
    app_data = row_to_dict(conn.execute(
        "SELECT * FROM job_applications WHERE id=?", (aid,)
    ).fetchone())
    conn.close()
    return {"success": True, "application": app_data}


@app.get("/api/applications/{user_id}")
def get_applications(user_id: str, status: Optional[str] = None):
    conn = get_db()
    if status:
        rows = conn.execute(
            "SELECT * FROM job_applications WHERE user_id=? AND status=? ORDER BY updated_at DESC",
            (user_id, status)
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM job_applications WHERE user_id=? ORDER BY updated_at DESC",
            (user_id,)
        ).fetchall()
    conn.close()
    return {"applications": [row_to_dict(r) for r in rows], "total": len(rows)}


@app.put("/api/applications/{application_id}")
def update_application(application_id: str, req: UpdateApplicationRequest):
    conn = get_db()
    existing = conn.execute(
        "SELECT * FROM job_applications WHERE id=?", (application_id,)
    ).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(404, "Application not found.")
    if req.status and req.status not in VALID_STATUSES:
        raise HTTPException(400, f"Status must be one of: {VALID_STATUSES}")
    now            = datetime.utcnow().isoformat()
    job_title      = req.job_title      or existing["job_title"]
    company        = req.company        or existing["company"]
    status         = req.status         or existing["status"]
    notes          = req.notes          if req.notes is not None else existing["notes"]
    interview_date = req.interview_date or existing["interview_date"]
    contact_name   = req.contact_name   or existing["contact_name"]
    contact_email  = req.contact_email  or existing["contact_email"]
    salary         = req.salary         or existing["salary"]
    location       = req.location       or existing["location"]
    conn.execute("""
        UPDATE job_applications
        SET job_title=?, company=?, status=?, notes=?,
            interview_date=?, contact_name=?, contact_email=?,
            salary=?, location=?, updated_at=?
        WHERE id=?
    """, (job_title, company, status, notes, interview_date,
          contact_name, contact_email, salary, location, now, application_id))
    conn.commit()
    updated = row_to_dict(conn.execute(
        "SELECT * FROM job_applications WHERE id=?", (application_id,)
    ).fetchone())
    conn.close()
    return {"success": True, "application": updated}


@app.put("/api/applications/{application_id}/status")
def update_status(application_id: str, req: UpdateStatusRequest):
    if req.status not in VALID_STATUSES:
        raise HTTPException(400, f"Status must be one of: {VALID_STATUSES}")
    conn = get_db()
    if not conn.execute(
        "SELECT id FROM job_applications WHERE id=?", (application_id,)
    ).fetchone():
        conn.close()
        raise HTTPException(404, "Application not found.")
    conn.execute(
        "UPDATE job_applications SET status=?, updated_at=? WHERE id=?",
        (req.status, datetime.utcnow().isoformat(), application_id)
    )
    conn.commit()
    conn.close()
    return {"success": True, "application_id": application_id, "new_status": req.status}


@app.delete("/api/applications/{application_id}")
def delete_application(application_id: str):
    conn = get_db()
    if not conn.execute(
        "SELECT id FROM job_applications WHERE id=?", (application_id,)
    ).fetchone():
        conn.close()
        raise HTTPException(404, "Application not found.")
    conn.execute("DELETE FROM job_applications WHERE id=?", (application_id,))
    conn.commit()
    conn.close()
    return {"success": True, "deleted_id": application_id}


@app.get("/api/applications/{user_id}/stats")
def get_application_stats(user_id: str):
    conn = get_db()
    rows = conn.execute(
        "SELECT status FROM job_applications WHERE user_id=?", (user_id,)
    ).fetchall()
    conn.close()
    counts = {s: 0 for s in VALID_STATUSES}
    for r in rows:
        s = r["status"]
        if s in counts:
            counts[s] += 1
    total       = len(rows)
    responded   = counts["screening"] + counts["interview"] + counts["offer"]
    interviewed = counts["interview"] + counts["offer"]
    return {
        "total":          total,
        "by_status":      counts,
        "response_rate":  round((responded   / total * 100), 1) if total else 0,
        "interview_rate": round((interviewed / total * 100), 1) if total else 0,
        "offer_rate":     round((counts["offer"] / total * 100), 1) if total else 0,
    }


# ══════════════════════════════════════════════════════════════
# EXISTING ROUTES
# ══════════════════════════════════════════════════════════════

@app.get("/")
def root():
    return {"status": "running", "message": "ApplyEdge API v4.0 is live",
            "features": ["resume-versions", "interview-simulator", "application-tracker"]}


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    if not file.filename.lower().endswith((".pdf", ".txt")):
        raise HTTPException(status_code=400, detail="Only PDF or TXT files accepted.")
    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 10MB.")
    try:
        resume_text = extract_resume_text(file_bytes)
        if not resume_text.strip():
            raise HTTPException(status_code=422, detail="Could not extract text from PDF.")
        return analyze_resume(resume_text)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


class JobMatchRequest(BaseModel):
    resume_text: str
    job_description: str

@app.post("/match-job")
def match_job_endpoint(request: JobMatchRequest):
    if not request.resume_text.strip() or not request.job_description.strip():
        raise HTTPException(400, "Both fields required.")
    try:
        return match_job(request.resume_text, request.job_description)
    except Exception as e:
        raise HTTPException(500, f"Job matching failed: {str(e)}")


class RewriteRequest(BaseModel):
    bullets: list[str]
    job_title: str = ""

@app.post("/rewrite")
def rewrite_endpoint(request: RewriteRequest):
    if not request.bullets:
        raise HTTPException(400, "No bullet points provided.")
    try:
        return rewrite_bullets(request.bullets, request.job_title)
    except Exception as e:
        raise HTTPException(500, f"Rewrite failed: {str(e)}")


class TailorRequest(BaseModel):
    resume_text: str
    job_description: str

@app.post("/tailor")
def tailor_endpoint(request: TailorRequest):
    if not request.resume_text.strip() or not request.job_description.strip():
        raise HTTPException(400, "Both fields required.")
    try:
        return tailor_resume(request.resume_text, request.job_description)
    except Exception as e:
        raise HTTPException(500, f"Tailoring failed: {str(e)}")


class InterviewRequest(BaseModel):
    resume_text: str
    job_description: str

@app.post("/interview-qa")
def interview_qa_endpoint(request: InterviewRequest):
    if not request.resume_text.strip() or not request.job_description.strip():
        raise HTTPException(400, "Both fields required.")
    try:
        return generate_interview_qa(request.resume_text, request.job_description)
    except Exception as e:
        raise HTTPException(500, f"Interview Q&A failed: {str(e)}")


@app.post("/cover-letter")
async def cover_letter_endpoint(payload: dict):
    resume_text     = payload.get("resume_text", "")
    job_description = payload.get("job_description", "")
    tone            = payload.get("tone", "professional")
    if not resume_text or not job_description:
        raise HTTPException(400, "resume_text and job_description required")
    try:
        return generate_cover_letter(resume_text, job_description, tone)
    except Exception as e:
        raise HTTPException(500, str(e))


# ── DOWNLOAD ENDPOINTS (FAANG-style PDF + DOCX) ───────────────

class DownloadResumeRequest(BaseModel):
    resume_text: str
    filename: str = "resume"


@app.post("/download-resume")
def download_resume_pdf_endpoint(request: DownloadResumeRequest):
    """Download tailored resume as FAANG-style PDF."""
    if not request.resume_text.strip():
        raise HTTPException(400, "Resume text is required.")
    try:
        pdf_bytes = generate_resume_pdf(request.resume_text)
        safe_name = request.filename.replace(" ", "_").replace("/", "_")
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{safe_name}.pdf"'},
        )
    except Exception as e:
        raise HTTPException(500, f"PDF generation failed: {str(e)}")


@app.post("/download-resume-docx")
def download_resume_docx_endpoint(request: DownloadResumeRequest):
    """Download tailored resume as FAANG-style Word document."""
    if not request.resume_text.strip():
        raise HTTPException(400, "Resume text is required.")
    try:
        docx_bytes = generate_resume_docx(request.resume_text)
        safe_name  = request.filename.replace(" ", "_").replace("/", "_")
        return Response(
            content=docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{safe_name}.docx"'},
        )
    except Exception as e:
        raise HTTPException(500, f"DOCX generation failed: {str(e)}")


# ── JOBS SEARCH ───────────────────────────────────────────────

@app.get("/jobs")
def search_jobs(
    keywords: str = "", location: str = "us", country: str = "us",
    results_per_page: int = 12, page: int = 1, sort_by: str = "date",
    full_time: int = 0, salary_min: int = 0,
):
    app_id  = os.getenv("ADZUNA_APP_ID")
    app_key = os.getenv("ADZUNA_APP_KEY")
    if not app_id or not app_key:
        raise HTTPException(503, "Adzuna API credentials not configured.")
    params = {
        "app_id": app_id, "app_key": app_key,
        "results_per_page": results_per_page, "content-type": "application/json",
    }
    if keywords:       params["what"]       = keywords
    if location:       params["where"]      = location
    if sort_by:        params["sort_by"]    = sort_by
    if full_time:      params["full_time"]  = 1
    if salary_min > 0: params["salary_min"] = salary_min

    EXCLUDE_PHRASES = [
        "us citizen","u.s. citizen","united states citizen","must be a citizen",
        "citizenship required","security clearance","secret clearance","top secret",
        "ts/sci","active clearance","clearance required","dod clearance",
        "us persons only","u.s. persons only","itar","export control","must hold us",
    ]
    def is_excluded(title, desc):
        return any(p in (title + " " + desc).lower() for p in EXCLUDE_PHRASES)

    url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/{page}"
    try:
        r = http_requests.get(url, params=params, timeout=10)
        r.raise_for_status()
        data = r.json()
        jobs, filtered_count = [], 0
        for j in data.get("results", []):
            title, desc = j.get("title", ""), j.get("description", "")
            if is_excluded(title, desc):
                filtered_count += 1
                continue
            jobs.append({
                "id":          j.get("id", ""),
                "title":       title,
                "company":     j.get("company", {}).get("display_name", "Unknown"),
                "location":    j.get("location", {}).get("display_name", ""),
                "description": desc[:300] + ("..." if len(desc) > 300 else ""),
                "salary_min":  j.get("salary_min"),
                "salary_max":  j.get("salary_max"),
                "url":         j.get("redirect_url", ""),
                "created":     j.get("created", ""),
                "category":    j.get("category", {}).get("label", ""),
                "contract":    j.get("contract_time", ""),
            })
        return {"total": data.get("count", 0), "page": page,
                "results": jobs, "filtered_out": filtered_count}
    except http_requests.exceptions.Timeout:
        raise HTTPException(504, "Adzuna API timed out.")
    except Exception as e:
        raise HTTPException(500, f"Job search failed: {str(e)}")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
