"""
analyzer.py — Core AI logic for ResumeIQ
Uses Groq LLaMA 3 for all analysis. Returns structured JSON.
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
MODEL = "llama-3.3-70b-versatile"  # Use 70B for better structured output quality


# ── PDF Text Extraction ───────────────────────────────────────────────────────
def extract_resume_text(file_bytes: bytes) -> str:
    reader = pypdf.PdfReader(io.BytesIO(file_bytes))
    pages = []
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
        temperature=0.3,
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
    system = """You are an expert resume reviewer and career coach with 15 years of experience.
Analyze the resume and return ONLY valid JSON with this exact structure:
{
  "overall_score": <integer 0-100>,
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
  "ats_issues": ["issue1", "issue2"],
  "missing_sections": ["section1"],
  "improvement_tips": [
    {"area": "area name", "tip": "specific actionable tip"},
    {"area": "area name", "tip": "specific actionable tip"},
    {"area": "area name", "tip": "specific actionable tip"}
  ],
  "weak_bullets": ["bullet1", "bullet2", "bullet3"]
}
Be specific and actionable. Focus on real improvements."""

    user = f"Analyze this resume:\n\n{resume_text}"
    raw = call_groq(system, user, max_tokens=2048)
    result = parse_json(raw)
    result["resume_text"] = resume_text  # always attach full text
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
    raw = call_groq(system, user, max_tokens=1024)
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
    raw = call_groq(system, user, max_tokens=1024)
    return parse_json(raw)


# ── Resume Tailor ─────────────────────────────────────────────────────────────
def tailor_resume(resume_text: str, job_description: str) -> dict:
    job_trimmed = job_description[:2000]

    # ── Step 1: Get metadata (small call, just JSON) ──────────────────────────
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

    # ── Step 2: Split resume into sections so nothing gets truncated ──────────
    import re

    SECTION_RE = re.compile(
        r'^(PROFESSIONAL SUMMARY|SUMMARY|OBJECTIVE|PROFILE|'
        r'PROFESSIONAL EXPERIENCE|WORK EXPERIENCE|EXPERIENCE|EMPLOYMENT|'
        r'TECHNICAL SKILLS|SKILLS|COMPETENCIES|'
        r'EDUCATION|'
        r'PROJECTS|'
        r'CERTIFICATIONS?|CERTIFICATES|LICENSES|'
        r'ACHIEVEMENTS?|AWARDS|HONORS|'
        r'PUBLICATIONS?|RESEARCH|'
        r'VOLUNTEER|LANGUAGES|INTERESTS)\s*:?\s*$',
        re.IGNORECASE | re.MULTILINE
    )

    def split_sections(text):
        """Split resume into list of (header, content) tuples."""
        lines   = text.strip().splitlines()
        sections = []
        header_block = []  # name + contact before first section
        cur_header = None
        cur_lines  = []
        for line in lines:
            stripped = line.strip()
            if SECTION_RE.match(stripped):
                if cur_header is not None:
                    sections.append((cur_header, "\n".join(cur_lines).strip()))
                elif cur_lines:
                    header_block = list(cur_lines)
                cur_header = stripped
                cur_lines  = []
            else:
                cur_lines.append(line)
        if cur_header is not None:
            sections.append((cur_header, "\n".join(cur_lines).strip()))
        return header_block, sections

    def tailor_section(header, content, jd, style_hint):
        """Tailor a single resume section to match the job description."""
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
        "experience": "Keep ALL jobs and ALL bullet points. Only rephrase for keywords.",
        "skills":     "Keep ALL skills. Reorder to put most relevant first. Keep label: value format.",
        "projects":   "Keep ALL projects. Only rephrase bullets.",
        "certifications": "Keep ALL certifications exactly as they are.",
        "education":  "Keep ALL education entries exactly as they are.",
        "summary":    "Rewrite to highlight alignment with the job description.",
    }

    def get_hint(header):
        low = header.lower()
        for key, hint in STYLE_HINTS.items():
            if key in low:
                return hint
        return "Keep all original information. Only rephrase for better keyword match."

    # ── Step 3: Extract keywords to bold from job description ────────────────
    kw_system = """You are a resume keyword analyst.
Extract the most important technical keywords and skills from the job description.
These will be bolded in the resume to catch recruiter and ATS attention.
Return ONLY a JSON array of keywords — no explanation:
["keyword1", "keyword2", "keyword3", ...]
Rules:
- Include: tools, technologies, languages, frameworks, platforms, methodologies
- Include multi-word terms like "CI/CD", "Infrastructure as Code", "REST APIs"
- Max 30 keywords
- Short, exact terms only (no sentences)"""
    kw_raw      = call_groq(kw_system, f"JOB DESCRIPTION:\n{job_trimmed}", max_tokens=400)
    bold_keywords = parse_json(kw_raw) if kw_raw else []
    if not isinstance(bold_keywords, list):
        bold_keywords = []

    def bold_keywords_in_text(text, keywords):
        """Wrap matching keywords with ** in bullet/body/project-name lines."""
        if not keywords:
            return text
        kws_sorted = sorted(keywords, key=len, reverse=True)
        escaped    = [re.escape(k) for k in kws_sorted]
        pattern    = re.compile(
            r'(?<!\*)(' + '|'.join(escaped) + r')(?!\*)',
            re.IGNORECASE
        )
        def replacer(m):
            return f"**{m.group(1)}**"

        result_lines = []
        lines = text.splitlines()
        for idx, line in enumerate(lines):
            stripped = line.strip()
            if not stripped:
                result_lines.append(line)
                continue

            is_bullet      = stripped.startswith(("•","▪","●","-","–","◦"))
            is_body        = len(stripped) > 30 and not stripped.isupper()
            # Project name: short non-bullet line followed by a bullet line
            next_stripped  = lines[idx+1].strip() if idx+1 < len(lines) else ""
            next_is_bullet = next_stripped.startswith(("•","▪","●","-","–","◦","Technologies"))
            is_project_name = (not is_bullet and not stripped.isupper()
                               and len(stripped) < 80 and next_is_bullet)

            if is_bullet or is_body or is_project_name:
                line = pattern.sub(replacer, line)
            result_lines.append(line)
        return "\n".join(result_lines)

    # ── Step 4: Tailor each section independently ─────────────────────────────
    header_block, sections = split_sections(resume_text)
    name_contact = "\n".join(header_block).strip()

    tailored_parts = [name_contact] if name_contact else []

    BOLD_SECTIONS = {"experience", "projects", "summary"}

    for sec_header, sec_content in sections:
        if not sec_content.strip():
            tailored_parts.append(f"\n{sec_header}\n")
            continue
        hint          = get_hint(sec_header)
        tailored_body = tailor_section(sec_header, sec_content, job_trimmed, hint)
        tailored_body = tailored_body.strip()

        # Apply keyword bolding to Experience, Projects, Summary sections
        sec_key = sec_header.lower()
        should_bold = any(k in sec_key for k in BOLD_SECTIONS)
        if should_bold and bold_keywords:
            tailored_body = bold_keywords_in_text(tailored_body, bold_keywords)

        tailored_parts.append(f"\n{sec_header}\n{tailored_body}")

    tailored_text = "\n".join(tailored_parts).strip()

    return {
        "tailored_resume":   tailored_text,
        "changes_made":      meta.get("changes_made", []),
        "keywords_added":    meta.get("keywords_to_add", []),
        "match_improvement": meta.get("match_improvement", ""),
        "bold_keywords":     bold_keywords,
    }


# ── Interview Q&A Generator ───────────────────────────────────────────────────
def generate_interview_qa(resume_text: str, job_description: str) -> dict:
    resume_trimmed = resume_text[:3000]
    job_trimmed    = job_description[:2000]

    # Step 1: Get role, topics, red flags
    meta_system = """You are an expert interview coach.
Return ONLY valid JSON:
{
  "role": "<exact job title from description>",
  "key_topics_to_study": ["topic1", "topic2", "topic3", "topic4", "topic5"],
  "red_flags_to_avoid": ["mistake1", "mistake2", "mistake3"]
}"""
    meta_raw = call_groq(meta_system,
        f"RESUME:\n{resume_trimmed}\n\nJOB:\n{job_trimmed}", max_tokens=500)
    meta = parse_json(meta_raw)

    # Step 2: Generate 5 behavioral + situational questions
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

    # Step 3: Generate 5 technical + general questions
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

    all_questions = qa1.get("questions", []) + qa2.get("questions", [])

    return {
        "role":                meta.get("role", ""),
        "questions":           all_questions[:10],
        "key_topics_to_study": meta.get("key_topics_to_study", []),
        "red_flags_to_avoid":  meta.get("red_flags_to_avoid", []),
    }


# ── Cover Letter Generator ────────────────────────────────────────────────────
def generate_cover_letter(resume_text: str, job_description: str, tone: str = "professional") -> dict:
    job_trimmed    = job_description[:2000]
    resume_trimmed = resume_text[:4000]

    # Step 1: Extract job details
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

    # Step 2: Generate cover letter
    tone_instructions = {
        "professional": "Formal, polished, confident. No slang.",
        "conversational": "Warm and personable. Slightly informal but still professional.",
        "enthusiastic": "High energy, passionate. Show genuine excitement for the role.",
    }
    tone_hint = tone_instructions.get(tone, tone_instructions["professional"])

    cl_system = f"""You are an expert cover letter writer.
Write a compelling, personalized cover letter based on the resume and job description.
Tone: {tone_hint}
Rules:
- 3-4 paragraphs, max 350 words
- Opening: hook that shows genuine interest in THIS specific company/role
- Middle 1: highlight 2-3 most relevant achievements from the resume with numbers/impact
- Middle 2: show how your skills directly address their key requirements
- Closing: confident call to action, no clichés like "I look forward to hearing from you"
- Do NOT use placeholder text like [Your Name] — use the actual name from resume
- Output ONLY the cover letter text, no subject line, no explanation"""

    cl_user = f"RESUME:\n{resume_trimmed}\n\nJOB DESCRIPTION:\n{job_trimmed}\n\nWrite the cover letter:"
    cover_letter = call_groq(cl_system, cl_user, max_tokens=1200)

    # Step 3: Generate subject line
    subj_system = "Write a compelling email subject line for this cover letter application. Return ONLY the subject line, nothing else."
    subj_user   = f"Job: {meta.get('job_title','Software Engineer')} at {meta.get('company_name','the company')}\nCover letter:\n{cover_letter[:400]}"
    subject_line = call_groq(subj_system, subj_user, max_tokens=60).strip().strip('"')

    return {
        "cover_letter":   cover_letter.strip(),
        "subject_line":   subject_line,
        "company_name":   meta.get("company_name", ""),
        "job_title":      meta.get("job_title", ""),
        "key_requirements": meta.get("key_requirements", []),
    }

# ── Resume PDF Generator ──────────────────────────────────────────────────────
def generate_resume_pdf(resume_text: str) -> bytes:
    """Convert plain resume text into a clean ATS-friendly black & white PDF."""
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.lib import colors
    from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer,
        HRFlowable, Table, TableStyle)
    from reportlab.lib.enums import TA_CENTER
    import io, re

    # ── Pre-process: strip markdown the LLM might add ────────────────────────
    def clean_text(text):
        out = []
        for line in text.splitlines():
            line = re.sub(r'^#{1,4}\s*', '', line)
            line = re.sub(r'\*{1,3}([^*\n]+)\*{1,3}', r'\1', line)
            line = re.sub(r'_{1,2}([^_\n]+)_{1,2}', r'\1', line)
            line = re.sub(r'^>\s*', '', line)
            line = re.sub(r'<[^>]+>', '', line)
            out.append(line)
        return '\n'.join(out)

    resume_text = clean_text(resume_text)

    buffer = io.BytesIO()
    BLACK  = colors.HexColor("#000000")
    DARK   = colors.HexColor("#1a1a1a")
    MEDIUM = colors.HexColor("#3a3a3a")
    RGRAY  = colors.HexColor("#bbbbbb")

    doc = SimpleDocTemplate(
        buffer, pagesize=letter,
        leftMargin=0.70*inch, rightMargin=0.70*inch,
        topMargin=0.65*inch,  bottomMargin=0.65*inch,
    )

    # ── Styles ───────────────────────────────────────────────────────────────
    name_style = ParagraphStyle("Name",
        fontName="Helvetica-Bold", fontSize=22,
        textColor=BLACK, alignment=TA_CENTER, spaceAfter=4, leading=26)
    contact_style = ParagraphStyle("Contact",
        fontName="Helvetica", fontSize=9,
        textColor=DARK, alignment=TA_CENTER, spaceAfter=6, leading=13)
    section_style = ParagraphStyle("Section",
        fontName="Helvetica-Bold", fontSize=10.5,
        textColor=BLACK, spaceBefore=12, spaceAfter=3, leading=14)
    # Experience: "Company Name   Location" line — bold
    company_style = ParagraphStyle("Company",
        fontName="Helvetica-Bold", fontSize=10,
        textColor=BLACK, spaceAfter=0, leading=14)
    # Experience: "Job Title   Dates" line — regular dark
    role_style = ParagraphStyle("Role",
        fontName="Helvetica-Oblique", fontSize=9.5,
        textColor=MEDIUM, spaceAfter=3, leading=13)
    # Experience: "Job Title — Company" single-line format
    job_title_style = ParagraphStyle("JobTitle",
        fontName="Helvetica-Bold", fontSize=10,
        textColor=BLACK, spaceAfter=1, leading=14)
    job_meta_style = ParagraphStyle("JobMeta",
        fontName="Helvetica-Oblique", fontSize=9.5,
        textColor=MEDIUM, spaceAfter=3, leading=13)
    # Education: degree line — regular (NOT bold)
    edu_degree_style = ParagraphStyle("EduDegree",
        fontName="Helvetica", fontSize=10,
        textColor=DARK, spaceAfter=1, leading=14)
    edu_meta_style = ParagraphStyle("EduMeta",
        fontName="Helvetica", fontSize=9.5,
        textColor=MEDIUM, spaceAfter=4, leading=13)
    bullet_style = ParagraphStyle("Bullet",
        fontName="Helvetica", fontSize=9.5,
        textColor=DARK, leading=14.5, leftIndent=14, spaceAfter=2)
    body_style = ParagraphStyle("Body",
        fontName="Helvetica", fontSize=9.5,
        textColor=DARK, leading=14.5, spaceAfter=3)
    skill_label_style = ParagraphStyle("SkillLabel",
        fontName="Helvetica-Bold", fontSize=9.5,
        textColor=BLACK, leading=14)
    skill_value_style = ParagraphStyle("SkillValue",
        fontName="Helvetica", fontSize=9.5,
        textColor=DARK, leading=14)

    def safe(t, allow_bold=False):
        """Escape for ReportLab. If allow_bold=True, **text** becomes <b>text</b>."""
        import re as _re
        if allow_bold:
            # Split on **bold** markers, escape non-bold parts normally
            parts   = _re.split(r'\*\*(.+?)\*\*', t)
            escaped = []
            for j, part in enumerate(parts):
                if j % 2 == 1:
                    inner = part.replace("&", "&amp;")
                    escaped.append(f"<b>{inner}</b>")
                else:
                    escaped.append(
                        part.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;"))
            return "".join(escaped)
        return t.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")
    # ATS-priority ordered list
    ATS_ORDER = [
        "summary", "professional summary", "career summary", "executive summary",
        "objective", "career objective", "profile", "professional profile", "about",
        "experience", "work experience", "professional experience", "employment",
        "work history", "career history", "employment history",
        "education", "academic background", "academic credentials",
        "skills", "technical skills", "core competencies", "competencies",
        "technical expertise", "key skills", "areas of expertise",
        "certifications", "certification", "certificates", "licenses",
        "projects", "personal projects", "key projects", "notable projects",
        "achievements", "accomplishments", "key achievements",
        "awards", "honors", "honors & awards", "awards & honors",
        "publications", "research",
        "volunteer", "volunteer experience",
        "languages", "interests", "hobbies",
    ]

    SECTION_TOKENS = {
        "summary", "experience", "education", "skills", "projects",
        "certifications", "certification", "certificates", "achievements",
        "accomplishments", "awards", "honors", "publications", "volunteer",
        "languages", "interests", "profile", "objective", "history",
        "competencies", "expertise", "background", "credentials",
        "employment", "career", "research", "licenses", "hobbies",
    }

    def is_section(s):
        stripped = s.strip().rstrip(":")
        if not stripped or len(stripped) > 65:
            return False
        low = stripped.lower()
        if stripped.isupper() and len(stripped) > 2:
            return True
        if low in ATS_ORDER:
            return True
        words = set(re.sub(r"[^a-z\s]", "", low).split())
        if words & SECTION_TOKENS and len(stripped.split()) <= 5:
            if not any(c in stripped for c in ["•", "@", ".", "http"]):
                return True
        return False

    def ats_rank(key):
        low = key.lower()
        for rank, kw in enumerate(ATS_ORDER):
            if low == kw or kw in low or low in kw:
                return rank
        return 999

    def is_bullet(s):
        return bool(re.match(r'^[•▪●\-–\*◦]\s', s))

    def is_contact_line(s):
        low = s.lower()
        return any(x in low for x in ["@", "linkedin", "github", "http", "phone:"]) \
            or bool(re.search(r"\d{3}[-.\s]\d{3}[-.\s]\d{4}", s)) \
            or bool(re.search(r"\+\d[\d\s\(\)\-]{7,}", s))

    def has_date(s):
        return bool(re.search(
            r"(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|20\d{2}|19\d{2}|present|current)",
            s.lower()))

    # ── Parse header + sections ───────────────────────────────────────────────
    raw_lines    = resume_text.strip().splitlines()
    header_lines = []
    body_start   = 0
    for idx, line in enumerate(raw_lines):
        if line.strip() and is_section(line.strip()):
            body_start = idx
            break
        header_lines.append(line)

    sections_list = []
    cur_key = cur_label = None
    cur_lines = []
    for line in raw_lines[body_start:]:
        s = line.strip()
        if s and is_section(s):
            if cur_key is not None:
                sections_list.append((cur_key, cur_label, list(cur_lines)))
            cur_key   = s.lower().rstrip(":").strip()
            cur_label = s
            cur_lines = []
        else:
            cur_lines.append(line)
    if cur_key is not None:
        sections_list.append((cur_key, cur_label, list(cur_lines)))

    # Sort by ATS rank — unknown sections rank 999 and go last, never dropped
    sections_list.sort(key=lambda x: ats_rank(x[0]))

    # ── Render section content ────────────────────────────────────────────────
    def render_lines(sec_lines, in_edu, in_skills, in_exp):
        out = []
        i = 0
        lines = [l.strip() for l in sec_lines]

        while i < len(lines):
            s = lines[i]
            i += 1
            if not s:
                out.append(Spacer(1, 3))
                continue

            # Bullet point
            if is_bullet(s):
                text = re.sub(r"^[•▪●\-–\*◦]\s*", "", s)
                out.append(Paragraph(f"<bullet>•</bullet> {safe(text, allow_bold=True)}", bullet_style))
                continue

            # Skills: "Label: value" two-column table
            if in_skills and ":" in s:
                parts = s.split(":", 1)
                label = safe(parts[0].strip() + ":")
                value = safe(parts[1].strip()) if len(parts) > 1 else ""
                row = [[Paragraph(label, skill_label_style),
                        Paragraph(value, skill_value_style)]]
                t = Table(row, colWidths=[1.6*inch, 5.3*inch])
                t.setStyle(TableStyle([
                    ("VALIGN",        (0,0),(-1,-1),"TOP"),
                    ("LEFTPADDING",   (0,0),(-1,-1), 0),
                    ("RIGHTPADDING",  (0,0),(-1,-1), 0),
                    ("TOPPADDING",    (0,0),(-1,-1), 1),
                    ("BOTTOMPADDING", (0,0),(-1,-1), 3),
                ]))
                out.append(t)
                continue

            # Education section
            if in_edu:
                if has_date(s) or "|" in s:
                    out.append(Paragraph(safe(s), edu_meta_style))
                else:
                    out.append(Paragraph(safe(s), edu_degree_style))
                continue

            # Experience section — detect company vs role vs title
            if in_exp:
                # Format 1: "Job Title — Company | Location" (single line with em-dash)
                if "—" in s or ("–" in s and not has_date(s)):
                    out.append(Paragraph(safe(s), job_title_style))
                    continue
                # Format 2: next line is a role+date = this line is company
                # Peek at next non-empty line
                next_s = ""
                for j in range(i, len(lines)):
                    if lines[j]:
                        next_s = lines[j]
                        break
                next_has_date = has_date(next_s)
                next_is_bullet = is_bullet(next_s) if next_s else False
                # This line = company if next line has a date (role+date line)
                if next_has_date and not next_is_bullet and not has_date(s):
                    out.append(Paragraph(safe(s), company_style))
                    continue
                # This line has a date = role/title with date
                if has_date(s):
                    out.append(Paragraph(safe(s, allow_bold=True), role_style))
                    continue
                # Default body
                out.append(Paragraph(safe(s, allow_bold=True), body_style))
                continue

            # Default body
            out.append(Paragraph(safe(s, allow_bold=True), body_style))

        return out

    # ── Assemble final document ───────────────────────────────────────────────
    story = []
    first = True

    for line in header_lines:
        s = line.strip()
        if not s:
            continue
        if first:
            story.append(Paragraph(safe(s), name_style))
            first = False
        elif is_contact_line(s) or "|" in s:
            story.append(Paragraph(safe(s), contact_style))
        else:
            story.append(Paragraph(safe(s, allow_bold=True), body_style))

    story.append(HRFlowable(width="100%", thickness=1.5,
        color=BLACK, spaceAfter=8, spaceBefore=4))

    for (key, label, sec_lines) in sections_list:
        in_edu    = any(k in key for k in ["education","academic","credential"])
        in_skills = any(k in key for k in ["skill","competenc","technolog","expertise"])
        in_exp    = any(k in key for k in ["experience","employment","history","career"])

        story.append(Paragraph(safe(label.upper()), section_style))
        story.append(HRFlowable(width="100%", thickness=0.6,
            color=RGRAY, spaceAfter=5, spaceBefore=2))
        story.extend(render_lines(sec_lines, in_edu, in_skills, in_exp))

    doc.build(story)
    return buffer.getvalue()