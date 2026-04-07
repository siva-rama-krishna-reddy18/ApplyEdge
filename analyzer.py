"""
analyzer.py — ApplyEdge Core AI Logic
Updated v4:
  - generate_resume_pdf REMOVED (now in resume_generators.py — FAANG style)
  - call_groq temperature: 0.3 → 0.1 (more consistent scoring)
  - analyze_resume: strict rubric with point deductions (no more 92/100 inflation)
  - Backend sanity checks cap inflated scores
  - All other functions unchanged
"""

import os
import io
import json
import re
import pypdf
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL  = "llama-3.3-70b-versatile"


# ── PDF Text Extraction ───────────────────────────────────────────────────────
def extract_resume_text(file_bytes: bytes) -> str:
    reader = pypdf.PdfReader(io.BytesIO(file_bytes))
    pages  = []
    for page in reader.pages:
        t = page.extract_text()
        if t:
            pages.append(t.strip())
    return "\n\n".join(pages)


# ── Groq call helper ──────────────────────────────────────────────────────────
def call_groq(system: str, user: str, max_tokens: int = 2048) -> str:
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
        temperature=0.1,   # FIXED: was 0.3 — lower = consistent, strict scoring
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content.strip()


def parse_json(text: str) -> dict:
    """Extract JSON from LLM response even if it has extra text."""
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        return json.loads(match.group())
    return json.loads(text)


# ── Resume Analyzer ───────────────────────────────────────────────────────────
def analyze_resume(resume_text: str) -> dict:
    system = """You are a strict, professional resume evaluator with 15 years of recruiting experience.
You score resumes HONESTLY and CRITICALLY. Most resumes have real weaknesses.

SCORING PHILOSOPHY:
- You are NOT trying to encourage the candidate — give an honest assessment
- Score 90+: resume is nearly PERFECT, zero changes needed. Extremely rare.
- Score 80-89: strong but has 1-2 clear fixable weaknesses
- Score 65-79: average with several things to improve
- Score 45-64: needs significant work
- Score below 45: major structural or content problems

SCORING RUBRIC — start at 100 and DEDUCT:
  -20 if NO quantified achievements (no numbers, %, dollar amounts, team sizes)
  -15 if job descriptions are vague (no specific technologies, tools, or outcomes)
  -12 if missing a professional summary or objective section
  -10 if skills section is thin, generic, or missing key tools for the industry
  -10 if education section is incomplete or missing graduation year
  -8  if no clear career progression or logical narrative across roles
  -8  if bullet points use weak verbs (worked on, helped, assisted, responsible for)
  -5  if resume is too long (over 2 pages) or too short (under half a page)
  -5  for each major section missing (projects, certifications, etc.)
  -5  if contact info incomplete (no LinkedIn or GitHub for a tech role)

SUB-SCORE RUBRICS:
  clarity (0-100):   How clear, concise, readable? Penalize jargon, run-ons, vague descriptions.
  impact (0-100):    Do achievements show measurable business/technical impact? Penalize generic.
  keywords (0-100):  Are relevant industry keywords present and specific? Penalize generic lists.
  structure (0-100): Logical flow, consistent formatting, proper sections? Penalize inconsistencies.
  ats_compatibility: Start at 100, deduct:
    -20 if job titles differ from industry standards
    -15 if key tech stack keywords are buried or absent
    -12 if dates formatted inconsistently
    -10 if company names use non-standard abbreviations
    -8  if special characters, tables, or columns would confuse ATS parsers

Return ONLY valid JSON with this exact structure:
{
  "overall_score": <integer 0-100, apply rubric strictly — typical scores 50-75>,
  "resume_text": "<the full resume text>",
  "scores": {
    "clarity": <0-100>,
    "impact": <0-100>,
    "keywords": <0-100>,
    "structure": <0-100>,
    "ats_compatibility": <0-100>
  },
  "skills": {
    "technical": ["skill1", "skill2"],
    "soft": ["skill1", "skill2"]
  },
  "experience_years": <number>,
  "education": "<highest degree and field>",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "ats_issues": ["specific issue1", "specific issue2"],
  "missing_sections": ["section1"],
  "improvement_tips": [
    {"area": "area name", "tip": "specific actionable tip"},
    {"area": "area name", "tip": "specific actionable tip"},
    {"area": "area name", "tip": "specific actionable tip"}
  ],
  "weak_bullets": ["bullet1", "bullet2", "bullet3"]
}
Be specific — not "add more details" but exactly what is missing and where.
Be honest — the candidate needs truth, not encouragement."""

    user   = f"Analyze this resume strictly and honestly:\n\n{resume_text}"
    raw    = call_groq(system, user, max_tokens=2048)
    result = parse_json(raw)

    # ── Backend sanity checks — prevent LLM from ignoring the rubric ──────────
    overall   = result.get("overall_score", 70)
    sub       = result.get("scores", {})
    clarity   = sub.get("clarity",   70)
    impact    = sub.get("impact",    70)
    keywords  = sub.get("keywords",  70)
    structure = sub.get("structure", 70)
    ats       = sub.get("ats_compatibility", 70)

    # Overall must not exceed average sub-score by more than 8 points
    if sub:
        avg_sub = (clarity + impact + keywords + structure + ats) / 5
        if overall > avg_sub + 8:
            result["overall_score"] = int(avg_sub + 4)

    # 3+ weaknesses → cap overall at 78
    if len(result.get("weaknesses", [])) >= 3 and result["overall_score"] > 78:
        result["overall_score"] = 78

    # 2+ ATS issues → cap ats_compatibility at 75
    if len(result.get("ats_issues", [])) >= 2 and ats > 75:
        result["scores"]["ats_compatibility"] = 75

    result["resume_text"] = resume_text
    return result


# ── Job Matcher ───────────────────────────────────────────────────────────────
def match_job(resume_text: str, job_description: str) -> dict:
    system = """You are an expert ATS system and career coach.
Compare the resume to the job description and return ONLY valid JSON:
{
  "match_score": <integer 0-100>,
  "verdict": "<one of: Excellent Match | Good Match | Partial Match | Poor Match>",
  "matched_skills": ["skill1", "skill2"],
  "missing_skills": ["skill1", "skill2"],
  "missing_keywords": ["keyword1", "keyword2"],
  "recommendations": [
    "specific thing to add or change to improve match",
    "specific thing to add or change to improve match",
    "specific thing to add or change to improve match"
  ],
  "should_apply": <true or false>,
  "summary": "<2-3 sentence honest assessment>"
}"""
    user = f"RESUME:\n{resume_text}\n\nJOB DESCRIPTION:\n{job_description}"
    raw  = call_groq(system, user, max_tokens=1024)
    return parse_json(raw)


# ── Bullet Rewriter ───────────────────────────────────────────────────────────
def rewrite_bullets(bullets: list[str], job_title: str = "") -> dict:
    job_context = f" for a {job_title} role" if job_title else ""
    system = """You are an expert resume writer. Rewrite resume bullet points to be more impactful.
Use strong action verbs, add quantification where possible, and show clear impact.
Return ONLY valid JSON:
{
  "rewrites": [
    {"original": "original bullet", "improved": "improved bullet", "reason": "why this is better"},
    {"original": "original bullet", "improved": "improved bullet", "reason": "why this is better"}
  ]
}"""
    user = f"Rewrite these weak resume bullets{job_context}:\n" + "\n".join(f"- {b}" for b in bullets)
    raw  = call_groq(system, user, max_tokens=1024)
    return parse_json(raw)


# ── Resume Tailor ─────────────────────────────────────────────────────────────
def tailor_resume(resume_text: str, job_description: str) -> dict:
    job_trimmed = job_description[:2000]

    # Step 1: Metadata
    meta_system = """You are an expert resume writer.
Analyze how to tailor the resume for the job description.
Return ONLY valid JSON, no extra text:
{
  "changes_made": ["change 1", "change 2", "change 3"],
  "keywords_to_add": ["keyword1", "keyword2", "keyword3"],
  "match_improvement": "Estimated match improved from X% to Y%"
}"""
    meta_raw = call_groq(meta_system,
        f"RESUME:\n{resume_text[:3000]}\n\nJOB DESCRIPTION:\n{job_trimmed}",
        max_tokens=600)
    meta = parse_json(meta_raw)

    # Step 2: Split into sections
    SECTION_RE = re.compile(
        r'^(PROFESSIONAL SUMMARY|SUMMARY|OBJECTIVE|PROFILE|'
        r'PROFESSIONAL EXPERIENCE|WORK EXPERIENCE|EXPERIENCE|EMPLOYMENT|'
        r'TECHNICAL SKILLS|SKILLS|COMPETENCIES|'
        r'EDUCATION|PROJECTS|'
        r'CERTIFICATIONS?|CERTIFICATES|LICENSES|'
        r'ACHIEVEMENTS?|AWARDS|HONORS|'
        r'PUBLICATIONS?|RESEARCH|'
        r'VOLUNTEER|LANGUAGES|INTERESTS)\s*:?\s*$',
        re.IGNORECASE | re.MULTILINE
    )

    def split_sections(text):
        lines, sections, header_block = text.strip().splitlines(), [], []
        cur_header, cur_lines = None, []
        for line in lines:
            stripped = line.strip()
            if SECTION_RE.match(stripped):
                if cur_header is not None:
                    sections.append((cur_header, "\n".join(cur_lines).strip()))
                elif cur_lines:
                    header_block = list(cur_lines)
                cur_header, cur_lines = stripped, []
            else:
                cur_lines.append(line)
        if cur_header is not None:
            sections.append((cur_header, "\n".join(cur_lines).strip()))
        return header_block, sections

    def tailor_section(header, content, jd, style_hint):
        system = f"""You are an expert resume writer.
Rewrite ONLY the {header} section of the resume to better match the job description.
Rules:
- KEEP all original jobs, companies, dates, degrees, project names — do NOT remove any
- Add relevant keywords from the job description naturally
- Strengthen bullet points with more measurable impact where possible
- Do NOT add fake experience or fabricate achievements
- Output ONLY the rewritten section content (no header, no explanation)
{style_hint}"""
        user = f"JOB DESCRIPTION:\n{jd}\n\n{header} SECTION:\n{content}\n\nRewrite this section:"
        return call_groq(system, user, max_tokens=2000)

    STYLE_HINTS = {
        "experience":     "Keep ALL jobs and ALL bullet points. Only rephrase for keywords.",
        "skills":         "Keep ALL skills. Reorder to put most relevant first. Keep label: value format.",
        "projects":       "Keep ALL projects. Only rephrase bullets.",
        "certifications": "Keep ALL certifications exactly as they are.",
        "education":      "Keep ALL education entries exactly as they are.",
        "summary":        "Rewrite to highlight alignment with the job description.",
    }

    def get_hint(header):
        low = header.lower()
        for key, hint in STYLE_HINTS.items():
            if key in low:
                return hint
        return "Keep all original information. Only rephrase for better keyword match."

    # Step 3: Keywords to bold
    kw_system = """You are a resume keyword analyst.
Extract the most important technical keywords and skills from the job description.
Return ONLY a JSON array of keywords — no explanation:
["keyword1", "keyword2", "keyword3", ...]
Rules:
- Include: tools, technologies, languages, frameworks, platforms, methodologies
- Include multi-word terms like "CI/CD", "Infrastructure as Code", "REST APIs"
- Max 30 keywords. Short, exact terms only (no sentences)"""
    kw_raw        = call_groq(kw_system, f"JOB DESCRIPTION:\n{job_trimmed}", max_tokens=400)
    bold_keywords = parse_json(kw_raw) if kw_raw else []
    if not isinstance(bold_keywords, list):
        bold_keywords = []

    def bold_keywords_in_text(text, keywords):
        if not keywords:
            return text
        kws_sorted = sorted(keywords, key=len, reverse=True)
        pattern    = re.compile(
            r'(?<!\*)(' + '|'.join(re.escape(k) for k in kws_sorted) + r')(?!\*)',
            re.IGNORECASE
        )
        result_lines = []
        lines = text.splitlines()
        for idx, line in enumerate(lines):
            stripped = line.strip()
            if not stripped:
                result_lines.append(line); continue
            is_bullet      = stripped.startswith(("•","▪","●","-","–","◦"))
            is_body        = len(stripped) > 30 and not stripped.isupper()
            next_stripped  = lines[idx+1].strip() if idx+1 < len(lines) else ""
            next_is_bullet = next_stripped.startswith(("•","▪","●","-","–","◦","Technologies"))
            is_project_name = (not is_bullet and not stripped.isupper()
                               and len(stripped) < 80 and next_is_bullet)
            if is_bullet or is_body or is_project_name:
                line = pattern.sub(lambda m: f"**{m.group(1)}**", line)
            result_lines.append(line)
        return "\n".join(result_lines)

    # Step 4: Tailor each section
    header_block, sections = split_sections(resume_text)
    name_contact   = "\n".join(header_block).strip()
    tailored_parts = [name_contact] if name_contact else []
    BOLD_SECTIONS  = {"experience", "projects", "summary"}

    for sec_header, sec_content in sections:
        if not sec_content.strip():
            tailored_parts.append(f"\n{sec_header}\n"); continue
        hint          = get_hint(sec_header)
        tailored_body = tailor_section(sec_header, sec_content, job_trimmed, hint).strip()
        sec_key = sec_header.lower()
        if any(k in sec_key for k in BOLD_SECTIONS) and bold_keywords:
            tailored_body = bold_keywords_in_text(tailored_body, bold_keywords)
        tailored_parts.append(f"\n{sec_header}\n{tailored_body}")

    return {
        "tailored_resume":   "\n".join(tailored_parts).strip(),
        "changes_made":      meta.get("changes_made", []),
        "keywords_added":    meta.get("keywords_to_add", []),
        "match_improvement": meta.get("match_improvement", ""),
        "bold_keywords":     bold_keywords,
    }


# ── Interview Q&A Generator ───────────────────────────────────────────────────
def generate_interview_qa(resume_text: str, job_description: str) -> dict:
    resume_trimmed = resume_text[:3000]
    job_trimmed    = job_description[:2000]

    meta_system = """You are an expert interview coach. Return ONLY valid JSON:
{
  "role": "<exact job title from description>",
  "key_topics_to_study": ["topic1", "topic2", "topic3", "topic4", "topic5"],
  "red_flags_to_avoid": ["mistake1", "mistake2", "mistake3"]
}"""
    meta_raw = call_groq(meta_system,
        f"RESUME:\n{resume_trimmed}\n\nJOB:\n{job_trimmed}", max_tokens=500)
    meta = parse_json(meta_raw)

    qa1_system = """You are an expert interview coach.
Generate 5 behavioral and situational interview questions with ideal answers.
Return ONLY valid JSON:
{"questions": [
  {"category": "Behavioral", "question": "...", "ideal_answer": "...(2-3 sentences using STAR)...", "tip": "..."},
  {"category": "Situational", "question": "...", "ideal_answer": "...", "tip": "..."}
]}"""
    qa1_raw = call_groq(qa1_system,
        f"RESUME:\n{resume_trimmed}\n\nJOB:\n{job_trimmed}\n\nGenerate 5 behavioral/situational questions.",
        max_tokens=2000)
    qa1 = parse_json(qa1_raw)

    qa2_system = """You are an expert interview coach.
Generate 5 technical and general interview questions with ideal answers.
Return ONLY valid JSON:
{"questions": [
  {"category": "Technical", "question": "...", "ideal_answer": "...", "tip": "..."},
  {"category": "General", "question": "...", "ideal_answer": "...", "tip": "..."}
]}"""
    qa2_raw = call_groq(qa2_system,
        f"RESUME:\n{resume_trimmed}\n\nJOB:\n{job_trimmed}\n\nGenerate 5 technical/general questions.",
        max_tokens=2000)
    qa2 = parse_json(qa2_raw)

    return {
        "role":                meta.get("role", ""),
        "questions":           (qa1.get("questions", []) + qa2.get("questions", []))[:10],
        "key_topics_to_study": meta.get("key_topics_to_study", []),
        "red_flags_to_avoid":  meta.get("red_flags_to_avoid", []),
    }


# ── Cover Letter Generator ────────────────────────────────────────────────────
def generate_cover_letter(resume_text: str, job_description: str, tone: str = "professional") -> dict:
    job_trimmed    = job_description[:2000]
    resume_trimmed = resume_text[:4000]

    meta_system = """You are an expert career coach.
Extract key details from the job description. Return ONLY valid JSON:
{
  "company_name": "Company name or 'the company' if unknown",
  "job_title": "exact job title",
  "key_requirements": ["req1", "req2", "req3"],
  "company_values": ["value1", "value2"]
}"""
    meta_raw = call_groq(meta_system, f"JOB DESCRIPTION:\n{job_trimmed}", max_tokens=400)
    meta     = parse_json(meta_raw)

    tone_instructions = {
        "professional":   "Formal, polished, confident. No slang.",
        "conversational": "Warm and personable. Slightly informal but still professional.",
        "enthusiastic":   "High energy, passionate. Show genuine excitement for the role.",
    }
    cl_system = f"""You are an expert cover letter writer.
Write a compelling, personalized cover letter based on the resume and job description.
Tone: {tone_instructions.get(tone, tone_instructions['professional'])}
Rules:
- 3-4 paragraphs, max 350 words
- Opening: hook that shows genuine interest in THIS specific company/role
- Middle 1: highlight 2-3 most relevant achievements from the resume with numbers/impact
- Middle 2: show how your skills directly address their key requirements
- Closing: confident call to action, no clichés like "I look forward to hearing from you"
- Do NOT use placeholder text like [Your Name] — use the actual name from resume
- Output ONLY the cover letter text, no subject line, no explanation"""

    cover_letter = call_groq(cl_system,
        f"RESUME:\n{resume_trimmed}\n\nJOB DESCRIPTION:\n{job_trimmed}\n\nWrite the cover letter:",
        max_tokens=1200)

    subj_system  = "Write a compelling email subject line for this cover letter. Return ONLY the subject line, nothing else."
    subject_line = call_groq(subj_system,
        f"Job: {meta.get('job_title','Software Engineer')} at {meta.get('company_name','the company')}\nCover letter:\n{cover_letter[:400]}",
        max_tokens=60).strip().strip('"')

    return {
        "cover_letter":     cover_letter.strip(),
        "subject_line":     subject_line,
        "company_name":     meta.get("company_name", ""),
        "job_title":        meta.get("job_title", ""),
        "key_requirements": meta.get("key_requirements", []),
    }


# ─────────────────────────────────────────────────────────────────────────────
# generate_resume_pdf has been REMOVED from this file.
#
# Resume PDF and DOCX export is now handled by resume_generators.py
# which produces the FAANG-style format (Times New Roman, clean layout,
# 2-line experience headers: Company + Dates / Role + City).
#
# main.py imports it as:
#   from resume_generators import generate_resume_pdf, generate_resume_docx
# ─────────────────────────────────────────────────────────────────────────────
