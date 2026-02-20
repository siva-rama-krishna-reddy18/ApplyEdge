"""
main.py — ResumeIQ API
Endpoints:
  POST /analyze        - Analyze resume PDF → score, feedback, ATS check
  POST /match-job      - Match resume against a job description
  POST /rewrite        - Rewrite weak bullet points
  GET  /jobs           - Search real job listings via Adzuna API
"""

import os
import requests as http_requests
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from analyzer import extract_resume_text, analyze_resume, match_job, rewrite_bullets, tailor_resume, generate_interview_qa, generate_resume_pdf, generate_cover_letter
import uvicorn

app = FastAPI(title="ResumeIQ API", version="1.0.0")

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


@app.get("/")
def root():
    return {"status": "running", "message": "ResumeIQ API is live"}


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    """Upload resume PDF → returns score, feedback, ATS check, skills."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files accepted.")
    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 10MB.")
    try:
        resume_text = extract_resume_text(file_bytes)
        if not resume_text.strip():
            raise HTTPException(status_code=422, detail="Could not extract text from PDF.")
        result = analyze_resume(resume_text)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


class JobMatchRequest(BaseModel):
    resume_text: str
    job_description: str


@app.post("/match-job")
def match_job_endpoint(request: JobMatchRequest):
    """Match resume text against a job description."""
    if not request.resume_text.strip() or not request.job_description.strip():
        raise HTTPException(status_code=400, detail="Both resume text and job description required.")
    try:
        result = match_job(request.resume_text, request.job_description)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Job matching failed: {str(e)}")


class RewriteRequest(BaseModel):
    bullets: list[str]
    job_title: str = ""


@app.post("/rewrite")
def rewrite_endpoint(request: RewriteRequest):
    """Rewrite weak resume bullet points to be more impactful."""
    if not request.bullets:
        raise HTTPException(status_code=400, detail="No bullet points provided.")
    try:
        result = rewrite_bullets(request.bullets, request.job_title)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rewrite failed: {str(e)}")




class TailorRequest(BaseModel):
    resume_text: str
    job_description: str


@app.post("/tailor")
def tailor_endpoint(request: TailorRequest):
    """Tailor resume text to match a specific job description."""
    if not request.resume_text.strip() or not request.job_description.strip():
        raise HTTPException(status_code=400, detail="Both resume text and job description required.")
    try:
        return tailor_resume(request.resume_text, request.job_description)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tailoring failed: {str(e)}")


class InterviewRequest(BaseModel):
    resume_text: str
    job_description: str


@app.post("/interview-qa")
def interview_qa_endpoint(request: InterviewRequest):
    """Generate interview questions and ideal answers based on resume and job."""
    if not request.resume_text.strip() or not request.job_description.strip():
        raise HTTPException(status_code=400, detail="Both resume text and job description required.")
    try:
        return generate_interview_qa(request.resume_text, request.job_description)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Interview Q&A generation failed: {str(e)}")



class DownloadResumeRequest(BaseModel):
    resume_text: str
    filename: str = "tailored_resume"


@app.post("/cover-letter")
async def cover_letter_endpoint(payload: dict):
    resume_text      = payload.get("resume_text", "")
    job_description  = payload.get("job_description", "")
    tone             = payload.get("tone", "professional")
    if not resume_text or not job_description:
        raise HTTPException(400, "resume_text and job_description required")
    try:
        result = generate_cover_letter(resume_text, job_description, tone)
        return result
    except Exception as e:
        raise HTTPException(500, str(e))


@app.post("/download-resume")
def download_resume(request: DownloadResumeRequest):
    """Convert tailored resume text to a downloadable PDF."""
    if not request.resume_text.strip():
        raise HTTPException(status_code=400, detail="Resume text is required.")
    try:
        pdf_bytes = generate_resume_pdf(request.resume_text)
        safe_name = request.filename.replace(" ", "_").replace("/", "_")
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{safe_name}.pdf"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

@app.get("/jobs")
def search_jobs(
    keywords: str = "",
    location: str = "us",
    country: str = "us",
    results_per_page: int = 12,
    page: int = 1,
    sort_by: str = "date",         # date | salary
    full_time: int = 0,            # 1 = full-time only
    salary_min: int = 0,
):
    """Search real job listings from Adzuna API."""
    app_id  = os.getenv("ADZUNA_APP_ID")
    app_key = os.getenv("ADZUNA_APP_KEY")
    if not app_id or not app_key:
        raise HTTPException(status_code=503, detail="Adzuna API credentials not configured.")

    params = {
        "app_id":           app_id,
        "app_key":          app_key,
        "results_per_page": results_per_page,
        "content-type":     "application/json",
    }
    if keywords:        params["what"]       = keywords
    if location:        params["where"]      = location
    if sort_by:         params["sort_by"]    = sort_by
    if full_time:       params["full_time"]  = 1
    if salary_min > 0:  params["salary_min"] = salary_min

    # Note: page goes in the URL path only — NOT as a query param
    url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/{page}"
    try:
        r = http_requests.get(url, params=params, timeout=10)
        r.raise_for_status()
        data = r.json()
        # Filter out jobs requiring US citizenship, clearance, etc.
        EXCLUDE_PHRASES = [
            "us citizen", "u.s. citizen", "united states citizen",
            "must be a citizen", "citizenship required", "citizenship is required",
            "security clearance", "secret clearance", "top secret", "ts/sci",
            "active clearance", "clearance required", "dod clearance",
            "us persons only", "u.s. persons only",
            "itar", "export control", "must hold us",
        ]

        def is_excluded(title: str, description: str) -> bool:
            text = (title + " " + description).lower()
            return any(phrase in text for phrase in EXCLUDE_PHRASES)

        jobs = []
        filtered_count = 0
        for j in data.get("results", []):
            title = j.get("title", "")
            desc  = j.get("description", "")
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
        return {
            "total":        data.get("count", 0),
            "page":         page,
            "results":      jobs,
            "filtered_out": filtered_count,
        }
    except http_requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Adzuna API timed out. Try again.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Job search failed: {str(e)}")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)