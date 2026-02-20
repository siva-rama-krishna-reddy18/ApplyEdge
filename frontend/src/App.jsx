import { useState, useRef } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ── Icons ─────────────────────────────────────────────────────────────────────
const UploadIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);
const FileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const XIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const SpinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{animation:"spin .8s linear infinite"}}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);
const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const AlertIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const BriefcaseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);
const PenIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const BookmarkIcon = ({ filled = false }) => (
  <svg width="14" height="14" viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
  </svg>
);
const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);
const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const WandIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/>
    <path d="M17.8 11.8 19 13"/><path d="M15 9h0"/><path d="M17.8 6.2 19 5"/>
    <path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/>
  </svg>
);
const MicIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);
const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const MapPinIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const ClockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const ExternalIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);
const DollarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);
const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

// ── Shared primitives ─────────────────────────────────────────────────────────
function Tag({ children, color = "indigo" }) {
  const colors = {
    indigo: { bg:"#eef0fe", text:"#4f61f5", border:"rgba(79,97,245,0.2)" },
    green:  { bg:"#ecfdf5", text:"#059669", border:"rgba(5,150,105,0.2)" },
    amber:  { bg:"#fffbeb", text:"#d97706", border:"rgba(217,119,6,0.2)" },
    red:    { bg:"#fef2f2", text:"#dc2626", border:"rgba(220,38,38,0.2)" },
    teal:   { bg:"#ecfeff", text:"#0891b2", border:"rgba(8,145,178,0.2)" },
  };
  const c = colors[color] || colors.indigo;
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:4,
      padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:500,
      background:c.bg,color:c.text,border:`1px solid ${c.border}`}}>
      {children}
    </span>
  );
}

function ScoreRing({ score, size = 120, color = "#1B4F8A", light = false }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const fill = circ - (score / 100) * circ;
  const grade = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Needs Work";
  const gradeColor = light ? "rgba(255,255,255,0.7)" : score >= 80 ? "#059669" : score >= 60 ? "#1B4F8A" : score >= 40 ? "#d97706" : "#dc2626";
  const trackColor = light ? "rgba(255,255,255,0.12)" : "#E8EDF5";
  const textColor  = light ? "#FFFFFF" : "#0F1C2E";
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth="10"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth="10" strokeDasharray={circ} strokeDashoffset={fill}
          strokeLinecap="round" style={{transition:"stroke-dashoffset 1s ease"}}/>
        <text x={size/2} y={size/2+2} textAnchor="middle" dominantBaseline="middle"
          style={{fill:textColor,fontSize:size/4,fontWeight:700,fontFamily:"'Sora',sans-serif",
            transform:"rotate(90deg)",transformOrigin:`${size/2}px ${size/2}px`}}>
          {score}
        </text>
      </svg>
      <span style={{fontSize:12,fontWeight:600,color:gradeColor,letterSpacing:"0.04em",textTransform:"uppercase"}}>{grade}</span>
    </div>
  );
}

function ScoreBar({ label, value, light=false }) {
  const color = value >= 75 ? "#059669" : value >= 50 ? "#4A9EE8" : value >= 30 ? "#f59e0b" : "#ef4444";
  const trackBg = light ? "rgba(255,255,255,0.12)" : "#E8EDF5";
  const labelColor = light ? "rgba(255,255,255,0.55)" : "#4B5563";
  const valueColor = light ? "#fff" : color;
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
        <span style={{fontSize:13,color:labelColor,fontWeight:500}}>{label}</span>
        <span style={{fontSize:13,fontWeight:700,color:valueColor}}>{value}</span>
      </div>
      <div style={{height:5,background:trackBg,borderRadius:3,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${value}%`,borderRadius:3,
          background:`linear-gradient(90deg, ${color}cc, ${color})`,
          transition:"width 1s ease"}}/>
      </div>
    </div>
  );
}

function Panel({ title, icon, accent="#1B4F8A", children, flush=false }) {
  return (
    <div style={{background:"#FFFFFF",border:"1px solid #DDE3EE",borderRadius:12,
      overflow:"hidden",boxShadow:"0 1px 3px rgba(15,28,46,0.06)"}}>
      {title && (
        <div style={{padding:"13px 20px",borderBottom:"1px solid #DDE3EE",
          display:"flex",alignItems:"center",gap:8,background:"#FAFBFD"}}>
          <span style={{color:accent,display:"flex",opacity:0.85}}>{icon}</span>
          <span style={{fontSize:13,fontWeight:700,color:"#0F1C2E",letterSpacing:"0.01em"}}>{title}</span>
        </div>
      )}
      <div style={flush ? {} : {padding:20}}>{children}</div>
    </div>
  );
}

// Card = alias for Panel (used by TailorTab, CoverLetterTab, InterviewTab, SavedJobsTab, JobsTab)
function Card({ title, icon, children, accent="#1B4F8A" }) {
  return <Panel title={title} icon={icon} accent={accent}>{children}</Panel>;
}

function PrimaryBtn({ onClick, disabled, children, color="#1B4F8A", small=false }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{display:"inline-flex",alignItems:"center",gap:7,
        padding: small ? "7px 16px" : "10px 22px",
        background: disabled ? "#C5CDD9" : color,
        color:"#fff", border:"none", borderRadius:8,
        fontSize: small ? 12 : 14, fontWeight:600,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: disabled ? "none" : `0 2px 8px ${color}44`,
        transition:"all .15s", letterSpacing:"0.01em"}}>
      {children}
    </button>
  );
}

function OutlineBtn({ onClick, children, small=false }) {
  return (
    <button onClick={onClick}
      style={{display:"inline-flex",alignItems:"center",gap:6,
        padding: small ? "6px 14px" : "9px 18px",
        background:"transparent", color:"#4B5563",
        border:"1.5px solid #DDE3EE", borderRadius:8,
        fontSize: small ? 12 : 13, fontWeight:500,
        cursor:"pointer", transition:"all .15s"}}>
      {children}
    </button>
  );
}

// ── Upload Screen ─────────────────────────────────────────────────────────────
function UploadScreen({ onAnalyzed }) {
  const [drag, setDrag]       = useState(false);
  const [file, setFile]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep]       = useState("");
  const [error, setError]     = useState("");
  const inputRef              = useRef();

  const STEPS = [
    [18, "Parsing document…"],
    [40, "Scoring content quality…"],
    [62, "Checking ATS compatibility…"],
    [82, "Extracting skills & insights…"],
    [96, "Finalizing report…"],
  ];

  const analyze = async (f) => {
    setFile(f); setLoading(true); setError(""); setProgress(0);
    let si = 0;
    const tick = setInterval(() => {
      if (si < STEPS.length) { setProgress(STEPS[si][0]); setStep(STEPS[si][1]); si++; }
      else clearInterval(tick);
    }, 650);
    try {
      const form = new FormData(); form.append("file", f);
      const r = await fetch(`${API}/analyze`, { method:"POST", body:form });
      const d = await r.json();
      clearInterval(tick); setProgress(100); setStep("Complete");
      if (!r.ok) throw new Error(d.detail || "Analysis failed");
      setTimeout(() => onAnalyzed(d, f.name), 400);
    } catch(e) { clearInterval(tick); setError(e.message); setLoading(false); setProgress(0); }
  };

  const onDrop = (e) => { e.preventDefault(); setDrag(false); const f=e.dataTransfer.files[0]; if(f) analyze(f); };

  const CAPABILITIES = [
    { label:"Resume Score",      desc:"AI-powered quality assessment across 5 dimensions" },
    { label:"ATS Analysis",      desc:"Identify and fix applicant tracking system issues" },
    { label:"Job Match",         desc:"Compare your resume against any job description" },
    { label:"Auto-Tailor",       desc:"Section-by-section rewrite with keyword bolding" },
    { label:"Cover Letter",      desc:"Personalized letters in 3 tones with subject line" },
    { label:"Interview Prep",    desc:"10 Q&A pairs based on your resume and target role" },
  ];

  return (
    <div style={{minHeight:"100vh",background:"#0F1C2E",fontFamily:"'Sora',sans-serif",
      display:"flex",flexDirection:"column"}}>

      {/* Navbar */}
      <header style={{padding:"0 40px",height:58,display:"flex",alignItems:"center",
        justifyContent:"space-between",flexShrink:0,
        borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:32,height:32,background:"#1B4F8A",borderRadius:8,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>⚡</div>
          <span style={{fontSize:17,fontWeight:700,color:"#fff",letterSpacing:"-0.02em"}}>ApplyEdge</span>
          <span style={{fontSize:10,padding:"2px 7px",borderRadius:4,marginLeft:2,
            background:"rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.4)",
            fontWeight:700,letterSpacing:"0.08em",border:"1px solid rgba(255,255,255,0.1)"}}>BETA</span>
        </div>
        <span style={{fontSize:12,color:"rgba(255,255,255,0.3)",letterSpacing:"0.02em"}}>AI-Powered Resume Intelligence</span>
      </header>

      {/* Center content */}
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"32px 24px"}}>
        <div style={{width:"100%",maxWidth:960,display:"grid",
          gridTemplateColumns:"1fr 1px 400px",gap:0,alignItems:"center"}}>

          {/* Left — headline + features */}
          <div style={{paddingRight:56}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 12px",
              marginBottom:24,background:"rgba(74,158,232,0.12)",
              border:"1px solid rgba(74,158,232,0.25)",borderRadius:20}}>
              <span style={{fontSize:11,color:"#7EB3F5",fontWeight:700,letterSpacing:"0.08em"}}>AI-POWERED RESUME TOOL</span>
            </div>

            <h1 style={{fontSize:42,fontWeight:800,color:"#FFFFFF",lineHeight:1.18,
              letterSpacing:"-0.03em",marginBottom:14}}>
              Land your next job<br/>
              <span style={{background:"linear-gradient(90deg,#4A9EE8,#7EB3F5)",
                WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
                faster than ever.
              </span>
            </h1>
            <p style={{fontSize:15,color:"rgba(255,255,255,0.45)",lineHeight:1.75,marginBottom:36,maxWidth:440}}>
              Upload your resume and get instant AI analysis, ATS audit, job matching, tailored rewrites, cover letters, and interview prep.
            </p>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px 24px"}}>
              {CAPABILITIES.map((cap,i) => (
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10}}>
                  <div style={{width:20,height:20,borderRadius:6,background:"rgba(27,79,138,0.35)",
                    border:"1px solid rgba(74,158,232,0.3)",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    color:"#4A9EE8",flexShrink:0,marginTop:1}}>
                    <CheckIcon/>
                  </div>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.85)",marginBottom:1}}>{cap.label}</div>
                    <div style={{fontSize:12,color:"rgba(255,255,255,0.35)",lineHeight:1.4}}>{cap.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{alignSelf:"stretch",background:"rgba(255,255,255,0.08)",margin:"0 0"}}/>

          {/* Right — upload card */}
          <div style={{paddingLeft:48}}>
            <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",
              borderRadius:16,overflow:"hidden"}}>
              <div style={{padding:"18px 22px",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
                <div style={{fontSize:15,fontWeight:700,color:"#FFFFFF"}}>Analyze Your Resume</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.35)",marginTop:3}}>PDF or TXT · Free · No account needed</div>
              </div>

              <div style={{padding:22}}>
                {!loading ? (
                  <div
                    onDragOver={e=>{e.preventDefault();setDrag(true)}}
                    onDragLeave={()=>setDrag(false)}
                    onDrop={onDrop}
                    onClick={()=>inputRef.current.click()}
                    style={{border:`2px dashed ${drag?"#4A9EE8":"rgba(255,255,255,0.15)"}`,
                      borderRadius:12,padding:"36px 24px",textAlign:"center",cursor:"pointer",
                      background:drag?"rgba(74,158,232,0.06)":"rgba(255,255,255,0.02)",
                      transition:"all .2s"}}>
                    <input ref={inputRef} type="file" accept=".pdf,.txt" style={{display:"none"}}
                      onChange={e=>e.target.files[0]&&analyze(e.target.files[0])}/>
                    <div style={{width:48,height:48,borderRadius:12,
                      background:"rgba(27,79,138,0.3)",border:"1px solid rgba(74,158,232,0.25)",
                      margin:"0 auto 14px",display:"flex",alignItems:"center",
                      justifyContent:"center",color:"#4A9EE8"}}>
                      <UploadIcon/>
                    </div>
                    <p style={{fontSize:15,fontWeight:600,color:"rgba(255,255,255,0.9)",marginBottom:5}}>
                      Drop your resume here
                    </p>
                    <p style={{fontSize:12,color:"rgba(255,255,255,0.3)",marginBottom:20}}>
                      or click to browse files
                    </p>
                    <button style={{padding:"10px 28px",background:"#1B4F8A",color:"#fff",
                      border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",
                      boxShadow:"0 4px 16px rgba(27,79,138,0.5)"}}>
                      Analyze My Resume
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:12,
                      padding:"14px 16px",background:"rgba(255,255,255,0.04)",
                      border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,marginBottom:18}}>
                      <div style={{width:36,height:36,borderRadius:8,background:"rgba(27,79,138,0.3)",
                        display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>📄</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:600,color:"#fff",
                          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{file?.name}</div>
                        <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:2}}>{step}</div>
                      </div>
                      <div style={{color:"#4A9EE8"}}><SpinIcon/></div>
                    </div>
                    <div style={{height:5,background:"rgba(255,255,255,0.08)",borderRadius:4,overflow:"hidden",marginBottom:8}}>
                      <div style={{height:"100%",borderRadius:4,
                        background:"linear-gradient(90deg,#1B4F8A,#4A9EE8)",
                        width:`${progress}%`,transition:"width .65s ease"}}/>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between"}}>
                      <span style={{fontSize:12,color:"rgba(255,255,255,0.35)"}}>Analyzing…</span>
                      <span style={{fontSize:12,fontWeight:700,color:"#4A9EE8"}}>{progress}%</span>
                    </div>
                  </div>
                )}
                {error && (
                  <div style={{marginTop:12,padding:"10px 14px",background:"rgba(220,38,38,0.1)",
                    border:"1px solid rgba(220,38,38,0.25)",borderRadius:8,
                    fontSize:13,color:"#F87171",display:"flex",gap:8,alignItems:"center"}}>
                    <AlertIcon/> {error}
                  </div>
                )}
              </div>
            </div>

            <div style={{marginTop:16,display:"flex",justifyContent:"center",gap:20}}>
              {["ATS Optimized","AI Powered","Instant Results"].map((t,i) => (
                <div key={i} style={{display:"flex",alignItems:"center",gap:5}}>
                  <span style={{color:"#4A9EE8",fontSize:12}}>✓</span>
                  <span style={{fontSize:12,color:"rgba(255,255,255,0.35)",fontWeight:500}}>{t}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Tab Components (preserved) ────────────────────────────────────────────────
function TailorTab({ resumeText, originalScore }) {
  const [jobDesc, setJobDesc]     = useState("");
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [copied, setCopied]       = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [tailoredScore, setTailoredScore] = useState(null);
  const [scoringLoading, setScoringLoading] = useState(false);

  const run = async () => {
    if (!jobDesc.trim()) return;
    setLoading(true); setResult(null);
    try {
      const r = await fetch(`${API}/tailor`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_text: resumeText, job_description: jobDesc }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail);
      setResult(d);
      // Auto-run score comparison
      scoreTailored(d.tailored_resume);
    } catch(e) { alert(e.message); }
    finally { setLoading(false); }
  };

  const scoreTailored = async (tailoredText) => {
    setScoringLoading(true);
    try {
      const blob = new Blob([tailoredText], { type: "text/plain" });
      const form = new FormData();
      form.append("file", blob, "tailored.txt");
      const r = await fetch(`${API}/analyze`, { method: "POST", body: form });
      const d = await r.json();
      if (r.ok) setTailoredScore(d.overall_score);
    } catch(e) { /* silently fail */ }
    finally { setScoringLoading(false); }
  };

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const r = await fetch(`${API}/download-resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_text: result.tailored_resume, filename: "tailored_resume" }),
      });
      if (!r.ok) throw new Error("PDF generation failed");
      const blob = await r.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = "tailored_resume.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch(e) { alert(e.message); }
    finally { setDownloading(false); }
  };

  const copy = () => {
    navigator.clipboard.writeText(result.tailored_resume);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <Card title="Auto-Tailor Resume for a Job" icon={<WandIcon/>} accent="#7c3aed">
        <p style={{fontSize:13,color:"#6b7280",marginBottom:12,lineHeight:1.6}}>
          Paste a job description and AI will rewrite your resume to maximize match —
          reordering bullet points, adding keywords, and strengthening impact statements.
        </p>
        <textarea placeholder="Paste job description here…"
          value={jobDesc} onChange={e=>setJobDesc(e.target.value)}
          style={{width:"100%",height:180,padding:"12px 14px",border:"1.5px solid #e3e6ef",
            borderRadius:10,resize:"vertical",fontSize:13,fontFamily:"'Plus Jakarta Sans',sans-serif",
            color:"#374151",outline:"none",lineHeight:1.6,background:"#f9fafb"}}/>
        <button onClick={run} disabled={!jobDesc.trim()||loading}
          style={{marginTop:12,padding:"10px 24px",background:"#7c3aed",color:"#fff",
            border:"none",borderRadius:9,fontSize:14,fontWeight:600,cursor:"pointer",
            display:"flex",alignItems:"center",gap:8,
            opacity:(!jobDesc.trim()||loading)?0.5:1,
            boxShadow:"0 3px 12px rgba(124,58,237,0.3)"}}>
          {loading ? <><SpinIcon/>Tailoring resume…</> : <><WandIcon/>Tailor My Resume</>}
        </button>
      </Card>

      {result && (
        <>
          {/* Improvement summary */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Card title="Changes Made" icon={<CheckIcon/>} accent="#059669">
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {result.changes_made?.map((c,i) => (
                  <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                    <div style={{width:20,height:20,borderRadius:6,background:"#ecfdf5",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      color:"#059669",flexShrink:0,marginTop:1}}><CheckIcon/></div>
                    <span style={{fontSize:13,color:"#374151",lineHeight:1.5}}>{c}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Keywords Added" icon={<StarIcon/>} accent="#7c3aed">
              <div style={{marginBottom:10,display:"flex",flexWrap:"wrap",gap:7}}>
                {result.keywords_added?.map((k,i) => (
                  <span key={i} style={{padding:"3px 10px",background:"#f5f3ff",
                    border:"1px solid rgba(124,58,237,0.2)",borderRadius:20,
                    fontSize:12,fontWeight:500,color:"#7c3aed"}}>{k}</span>
                ))}
              </div>
              {result.match_improvement && (
                <div style={{padding:"8px 12px",background:"#ecfdf5",borderRadius:8,
                  fontSize:13,fontWeight:600,color:"#059669"}}>
                  📈 {result.match_improvement}
                </div>
              )}
            </Card>
          </div>

          {/* Score comparison */}
          {(tailoredScore !== null || scoringLoading) && (
            <div style={{background:"#fff",border:"1px solid #e3e6ef",borderRadius:14,
              padding:20,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#1a1d2e",marginBottom:16,
                display:"flex",alignItems:"center",gap:8}}>
                <span>📊</span> Score Comparison
              </div>
              <div style={{display:"flex",alignItems:"center",gap:0,justifyContent:"center"}}>
                {/* Before */}
                <div style={{textAlign:"center",flex:1}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#9ea3b5",textTransform:"uppercase",
                    letterSpacing:"0.08em",marginBottom:8}}>Before</div>
                  <div style={{fontSize:48,fontWeight:800,
                    color: originalScore>=80?"#059669":originalScore>=60?"#4f61f5":originalScore>=40?"#d97706":"#dc2626",
                    lineHeight:1}}>
                    {originalScore}
                  </div>
                  <div style={{fontSize:11,color:"#9ea3b5",marginTop:4}}>/ 100</div>
                </div>
                {/* Arrow */}
                <div style={{fontSize:28,color:"#e3e6ef",margin:"0 8px",paddingBottom:8}}>→</div>
                {/* After */}
                <div style={{textAlign:"center",flex:1}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#9ea3b5",textTransform:"uppercase",
                    letterSpacing:"0.08em",marginBottom:8}}>After</div>
                  {scoringLoading ? (
                    <div style={{fontSize:13,color:"#9ea3b5",paddingTop:12}}>Scoring…</div>
                  ) : (
                    <>
                      <div style={{fontSize:48,fontWeight:800,
                        color: tailoredScore>=80?"#059669":tailoredScore>=60?"#4f61f5":tailoredScore>=40?"#d97706":"#dc2626",
                        lineHeight:1}}>
                        {tailoredScore}
                      </div>
                      <div style={{fontSize:11,color:"#9ea3b5",marginTop:4}}>/ 100</div>
                    </>
                  )}
                </div>
                {/* Delta badge */}
                {tailoredScore !== null && !scoringLoading && (
                  <div style={{position:"absolute",left:"50%",transform:"translateX(-50%)",
                    marginTop:0}}>
                  </div>
                )}
              </div>
              {tailoredScore !== null && !scoringLoading && (() => {
                const delta = tailoredScore - originalScore;
                const color = delta > 0 ? "#059669" : delta < 0 ? "#dc2626" : "#9ea3b5";
                const label = delta > 0 ? `+${delta} improvement` : delta < 0 ? `${delta} pts` : "No change";
                return (
                  <div style={{textAlign:"center",marginTop:12}}>
                    <span style={{padding:"4px 16px",borderRadius:20,fontSize:13,fontWeight:700,
                      background: delta>0?"#ecfdf5":delta<0?"#fef2f2":"#f3f4f6",
                      color}}>
                      {delta > 0 ? "📈" : delta < 0 ? "📉" : "➡️"} {label}
                    </span>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Tailored resume */}
          <Card title="Your Tailored Resume" icon={<FileIcon/>} accent="#7c3aed">
            <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginBottom:10}}>
              <button onClick={copy}
                style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",
                  background: copied ? "#ecfdf5" : "#f5f3ff",
                  border:`1px solid ${copied ? "rgba(5,150,105,0.3)" : "rgba(124,58,237,0.2)"}`,
                  borderRadius:8,fontSize:12,fontWeight:600,
                  color: copied ? "#059669" : "#7c3aed",cursor:"pointer"}}>
                <CopyIcon/>{copied ? "Copied!" : "Copy Text"}
              </button>
              <button onClick={downloadPdf} disabled={downloading}
                style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",
                  background: downloading ? "#f9fafb" : "#4f61f5",
                  border:"none",borderRadius:8,fontSize:12,fontWeight:600,
                  color: downloading ? "#9ea3b5" : "#fff",
                  cursor: downloading ? "not-allowed" : "pointer",
                  boxShadow: downloading ? "none" : "0 2px 8px rgba(79,97,245,0.3)"}}>
                {downloading ? <><SpinIcon/>Generating PDF…</> : <><DownloadIcon/>Download PDF</>}
              </button>
            </div>
            <pre style={{whiteSpace:"pre-wrap",fontSize:12.5,fontFamily:"'Fira Code',monospace",
              color:"#374151",lineHeight:1.8,background:"#f9fafb",padding:16,
              borderRadius:10,border:"1px solid #e3e6ef",maxHeight:500,overflowY:"auto"}}>
              {result.tailored_resume}
            </pre>
          </Card>
        </>
      )}
    </div>
  );
}


// ── Cover Letter Tab ──────────────────────────────────────────────────────────
function CoverLetterTab({ resumeText }) {
  const [jobDesc, setJobDesc]   = useState("");
  const [tone, setTone]         = useState("professional");
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [copied, setCopied]     = useState(false);

  const TONES = [
    { value:"professional",   label:"Professional",   desc:"Formal & polished" },
    { value:"conversational", label:"Conversational", desc:"Warm & personable" },
    { value:"enthusiastic",   label:"Enthusiastic",   desc:"Energetic & passionate" },
  ];

  const run = async () => {
    if (!jobDesc.trim()) return;
    setLoading(true); setResult(null);
    try {
      const r = await fetch(`${API}/cover-letter`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ resume_text: resumeText, job_description: jobDesc, tone }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail);
      setResult(d);
    } catch(e) { alert(e.message); }
    finally { setLoading(false); }
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <Card title="Cover Letter Generator" icon={<FileIcon/>} accent="#0891b2">
        <p style={{fontSize:13,color:"#6b7280",marginBottom:14,lineHeight:1.6}}>
          Generate a personalized cover letter tailored to the job description,
          using your actual resume achievements and metrics.
        </p>

        {/* Tone selector */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:600,color:"#374151",marginBottom:8}}>Tone</div>
          <div style={{display:"flex",gap:8}}>
            {TONES.map(t => (
              <button key={t.value} onClick={() => setTone(t.value)}
                style={{flex:1,padding:"8px 12px",borderRadius:9,
                  border: tone===t.value ? "2px solid #0891b2" : "1.5px solid #e3e6ef",
                  background: tone===t.value ? "#ecfeff" : "#fff",
                  cursor:"pointer",transition:"all 0.15s"}}>
                <div style={{fontSize:12,fontWeight:700,
                  color: tone===t.value ? "#0891b2" : "#374151"}}>{t.label}</div>
                <div style={{fontSize:11,color:"#9ea3b5",marginTop:2}}>{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <textarea placeholder="Paste job description here…"
          value={jobDesc} onChange={e=>setJobDesc(e.target.value)}
          style={{width:"100%",height:160,padding:"12px 14px",border:"1.5px solid #e3e6ef",
            borderRadius:10,resize:"vertical",fontSize:13,
            fontFamily:"'Plus Jakarta Sans',sans-serif",color:"#374151",
            outline:"none",lineHeight:1.6,background:"#f9fafb"}}/>

        <button onClick={run} disabled={!jobDesc.trim()||loading}
          style={{marginTop:12,padding:"10px 24px",background:"#0891b2",color:"#fff",
            border:"none",borderRadius:9,fontSize:14,fontWeight:600,cursor:"pointer",
            display:"flex",alignItems:"center",gap:8,
            opacity:(!jobDesc.trim()||loading)?0.5:1,
            boxShadow:"0 3px 12px rgba(8,145,178,0.3)"}}>
          {loading ? <><SpinIcon/>Generating cover letter…</> : <><FileIcon/>Generate Cover Letter</>}
        </button>
      </Card>

      {result && (
        <>
          {/* Meta info */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Card title="Application Details" icon={<BriefcaseIcon/>} accent="#0891b2">
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div>
                  <div style={{fontSize:11,fontWeight:600,color:"#9ea3b5",
                    textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:3}}>Role</div>
                  <div style={{fontSize:13,fontWeight:600,color:"#1a1d2e"}}>{result.job_title}</div>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:600,color:"#9ea3b5",
                    textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:3}}>Company</div>
                  <div style={{fontSize:13,fontWeight:600,color:"#1a1d2e"}}>{result.company_name}</div>
                </div>
              </div>
            </Card>
            <Card title="Suggested Email Subject" icon={<StarIcon/>} accent="#0891b2">
              <div style={{padding:"10px 12px",background:"#ecfeff",border:"1px solid rgba(8,145,178,0.2)",
                borderRadius:8,fontSize:13,color:"#0891b2",fontWeight:500,lineHeight:1.5}}>
                {result.subject_line}
              </div>
              <button onClick={() => copy(result.subject_line)}
                style={{marginTop:8,display:"flex",alignItems:"center",gap:5,
                  padding:"5px 10px",background:"#f9fafb",border:"1px solid #e3e6ef",
                  borderRadius:7,fontSize:11,fontWeight:600,color:"#6b7280",cursor:"pointer"}}>
                <CopyIcon/> Copy subject
              </button>
            </Card>
          </div>

          {/* Key requirements matched */}
          {result.key_requirements?.length > 0 && (
            <Card title="Key Requirements Addressed" icon={<CheckIcon/>} accent="#059669">
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {result.key_requirements.map((r,i) => (
                  <span key={i} style={{padding:"4px 12px",background:"#ecfdf5",
                    border:"1px solid rgba(5,150,105,0.2)",borderRadius:20,
                    fontSize:12,fontWeight:500,color:"#059669"}}>✓ {r}</span>
                ))}
              </div>
            </Card>
          )}

          {/* Cover letter body */}
          <Card title="Your Cover Letter" icon={<FileIcon/>} accent="#0891b2">
            <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginBottom:12}}>
              <button onClick={() => copy(result.cover_letter)}
                style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",
                  background: copied ? "#ecfdf5" : "#ecfeff",
                  border:`1px solid ${copied ? "rgba(5,150,105,0.3)" : "rgba(8,145,178,0.2)"}`,
                  borderRadius:8,fontSize:12,fontWeight:600,
                  color: copied ? "#059669" : "#0891b2",cursor:"pointer"}}>
                <CopyIcon/>{copied ? "Copied!" : "Copy Letter"}
              </button>
            </div>
            <div style={{whiteSpace:"pre-wrap",fontSize:13.5,
              fontFamily:"'Plus Jakarta Sans',sans-serif",
              color:"#1a1d2e",lineHeight:1.9,background:"#f9fafb",padding:20,
              borderRadius:10,border:"1px solid #e3e6ef"}}>
              {result.cover_letter}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}


// ── Interview Tab ─────────────────────────────────────────────────────────────
function InterviewTab({ resumeText }) {
  const [jobDesc, setJobDesc]   = useState("");
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [openIdx, setOpenIdx]   = useState(null);

  const CATEGORY_COLORS = {
    Behavioral:   { bg:"#eef0fe", text:"#4f61f5", border:"rgba(79,97,245,0.2)" },
    Technical:    { bg:"#ecfeff", text:"#0891b2", border:"rgba(8,145,178,0.2)" },
    Situational:  { bg:"#fffbeb", text:"#d97706", border:"rgba(217,119,6,0.2)" },
    General:      { bg:"#f0fdf4", text:"#059669", border:"rgba(5,150,105,0.2)" },
  };

  const run = async () => {
    if (!jobDesc.trim()) return;
    setLoading(true); setResult(null); setOpenIdx(null);
    try {
      const r = await fetch(`${API}/interview-qa`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ resume_text: resumeText, job_description: jobDesc }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail);
      setResult(d);
    } catch(e) { alert(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <Card title="Interview Prep — Q&A Generator" icon={<MicIcon/>} accent="#0891b2">
        <p style={{fontSize:13,color:"#6b7280",marginBottom:12,lineHeight:1.6}}>
          Paste the job description and get 10 likely interview questions with
          personalized ideal answers based on YOUR resume — behavioral, technical, and situational.
        </p>
        <textarea placeholder="Paste job description here…"
          value={jobDesc} onChange={e=>setJobDesc(e.target.value)}
          style={{width:"100%",height:160,padding:"12px 14px",border:"1.5px solid #e3e6ef",
            borderRadius:10,resize:"vertical",fontSize:13,fontFamily:"'Plus Jakarta Sans',sans-serif",
            color:"#374151",outline:"none",lineHeight:1.6,background:"#f9fafb"}}/>
        <button onClick={run} disabled={!jobDesc.trim()||loading}
          style={{marginTop:12,padding:"10px 24px",background:"#0891b2",color:"#fff",
            border:"none",borderRadius:9,fontSize:14,fontWeight:600,cursor:"pointer",
            display:"flex",alignItems:"center",gap:8,
            opacity:(!jobDesc.trim()||loading)?0.5:1,
            boxShadow:"0 3px 12px rgba(8,145,178,0.3)"}}>
          {loading ? <><SpinIcon/>Generating questions…</> : <><MicIcon/>Generate Interview Q&A</>}
        </button>
      </Card>

      {result && (
        <>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Card title="Topics to Study" icon={<StarIcon/>} accent="#0891b2">
              <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                {result.key_topics_to_study?.map((t,i) => (
                  <span key={i} style={{padding:"3px 10px",background:"#ecfeff",
                    border:"1px solid rgba(8,145,178,0.2)",borderRadius:20,
                    fontSize:12,fontWeight:500,color:"#0891b2"}}>{t}</span>
                ))}
              </div>
            </Card>
            <Card title="Avoid These Mistakes" icon={<XIcon/>} accent="#dc2626">
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {result.red_flags_to_avoid?.map((f,i) => (
                  <div key={i} style={{display:"flex",gap:7,alignItems:"flex-start"}}>
                    <div style={{width:18,height:18,borderRadius:5,background:"#fef2f2",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      color:"#dc2626",flexShrink:0,marginTop:1}}><XIcon/></div>
                    <span style={{fontSize:12.5,color:"#374151",lineHeight:1.5}}>{f}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card title={`10 Interview Questions — ${result.role || "Role"}`} icon={<MicIcon/>} accent="#0891b2">
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {result.questions?.map((q, i) => {
                const cc = CATEGORY_COLORS[q.category] || CATEGORY_COLORS.General;
                const isOpen = openIdx === i;
                return (
                  <div key={i} style={{border:"1px solid #e3e6ef",borderRadius:10,overflow:"hidden",
                    transition:"border-color .15s",
                    ...(isOpen ? {borderColor:"#0891b2"} : {})}}>
                    {/* Question row */}
                    <button onClick={() => setOpenIdx(isOpen ? null : i)}
                      style={{width:"100%",padding:"13px 16px",background: isOpen ? "#ecfeff" : "#fff",
                        border:"none",cursor:"pointer",display:"flex",alignItems:"center",
                        gap:10,textAlign:"left",transition:"background .15s"}}>
                      <span style={{width:24,height:24,borderRadius:7,background:"#0891b2",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        color:"#fff",fontSize:11,fontWeight:700,flexShrink:0}}>
                        {i+1}
                      </span>
                      <span style={{flex:1,fontSize:13.5,fontWeight:600,color:"#1a1d2e",lineHeight:1.4}}>
                        {q.question}
                      </span>
                      <span style={{padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:600,
                        background:cc.bg,color:cc.text,border:`1px solid ${cc.border}`,
                        whiteSpace:"nowrap",flexShrink:0}}>
                        {q.category}
                      </span>
                      <span style={{color:"#9ea3b5",flexShrink:0,
                        transform: isOpen ? "rotate(180deg)" : "rotate(0)",
                        transition:"transform .2s"}}><ChevronDown/></span>
                    </button>
                    {/* Answer */}
                    {isOpen && (
                      <div style={{padding:"14px 16px",borderTop:"1px solid #e3e6ef",background:"#fafbff"}}>
                        <div style={{fontSize:11,fontWeight:700,color:"#0891b2",
                          fontFamily:"'Fira Code',monospace",letterSpacing:"0.08em",marginBottom:8}}>
                          IDEAL ANSWER
                        </div>
                        <p style={{fontSize:13,color:"#374151",lineHeight:1.75,marginBottom:10}}>
                          {q.ideal_answer}
                        </p>
                        <div style={{display:"flex",gap:7,padding:"9px 12px",background:"#fffbeb",
                          border:"1px solid rgba(217,119,6,0.2)",borderRadius:8,alignItems:"flex-start"}}>
                          <span style={{fontSize:14}}>💡</span>
                          <span style={{fontSize:12.5,color:"#92400e",lineHeight:1.5}}>{q.tip}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}


// ── Saved Jobs Tab ────────────────────────────────────────────────────────────
function SavedJobsTab({ savedJobs, unsaveJob }) {
  const fmtSalary = (min, max) => {
    if (!min && !max) return null;
    const fmt = n => "$" + Math.round(n/1000) + "k";
    if (min && max) return `${fmt(min)} – ${fmt(max)}`;
    if (min) return `From ${fmt(min)}`;
    return `Up to ${fmt(max)}`;
  };

  if (savedJobs.length === 0) return (
    <div style={{textAlign:"center",padding:"64px 24px",background:"#fff",
      borderRadius:14,border:"2px dashed #e3e6ef"}}>
      <div style={{fontSize:40,marginBottom:12}}>🔖</div>
      <p style={{fontSize:16,fontWeight:700,color:"#1a1d2e",marginBottom:6}}>No saved jobs yet</p>
      <p style={{fontSize:13,color:"#9ea3b5",lineHeight:1.6}}>
        Browse jobs in the <strong>🔍 Find Jobs</strong> tab and click the bookmark icon to save them here.
      </p>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontSize:13,color:"#6b7280",fontFamily:"'Fira Code',monospace"}}>
          {savedJobs.length} saved job{savedJobs.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(380px,1fr))",gap:12}}>
        {savedJobs.map((job, i) => {
          const salary = fmtSalary(job.salary_min, job.salary_max);
          return (
            <div key={i} style={{background:"#fff",border:"1px solid #e3e6ef",borderRadius:12,
              padding:18,boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div style={{flex:1,minWidth:0}}>
                  <h3 style={{fontSize:14,fontWeight:700,color:"#1a1d2e",marginBottom:4,
                    lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {job.title}
                  </h3>
                  <p style={{fontSize:13,fontWeight:500,color:"#4f61f5"}}>{job.company}</p>
                </div>
                <button onClick={()=>unsaveJob(job.id)}
                  title="Remove bookmark"
                  style={{background:"#fef2f2",border:"1px solid rgba(220,38,38,0.15)",
                    borderRadius:7,padding:"5px 8px",cursor:"pointer",
                    color:"#dc2626",flexShrink:0,marginLeft:8,display:"flex",alignItems:"center",gap:4,
                    fontSize:11,fontWeight:600}}>
                  <BookmarkIcon filled={true}/> Remove
                </button>
              </div>

              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:10}}>
                {job.location && (
                  <span style={{display:"flex",alignItems:"center",gap:4,fontSize:12,color:"#6b7280"}}>
                    <MapPinIcon/>{job.location}
                  </span>
                )}
                {salary && (
                  <span style={{display:"flex",alignItems:"center",gap:4,
                    fontSize:12,color:"#059669",fontWeight:600}}>
                    <DollarIcon/>{salary}
                  </span>
                )}
              </div>

              <p style={{fontSize:12,color:"#6b7280",lineHeight:1.6,marginBottom:12,
                display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
                {job.description}
              </p>

              <a href={job.url} target="_blank" rel="noopener noreferrer"
                style={{display:"inline-flex",alignItems:"center",gap:6,padding:"8px 16px",
                  background:"#4f61f5",color:"#fff",borderRadius:8,fontSize:13,fontWeight:600,
                  textDecoration:"none",boxShadow:"0 2px 8px rgba(79,97,245,0.3)"}}>
                <ExternalIcon/> Apply Now
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Jobs Tab ──────────────────────────────────────────────────────────────────
function JobsTab({ resumeSkills = [], savedJobs = [], saveJob, unsaveJob, isJobSaved }) {
  const suggestedKeyword = resumeSkills.slice(0, 2).join(" ") || "";
  const [keywords, setKeywords]   = useState(suggestedKeyword);
  const [location, setLocation]   = useState("");
  const [country, setCountry]     = useState("us");
  const [sortBy, setSortBy]       = useState("date");
  const [fullTime, setFullTime]   = useState(false);
  const [jobs, setJobs]           = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [searched, setSearched]   = useState(false);
  const [filteredOut, setFilteredOut] = useState(0);
  const [error, setError]         = useState("");

  const COUNTRIES = [
    {code:"us",label:"🇺🇸 USA"},{code:"gb",label:"🇬🇧 UK"},
    {code:"in",label:"🇮🇳 India"},{code:"au",label:"🇦🇺 Australia"},
    {code:"ca",label:"🇨🇦 Canada"},{code:"de",label:"🇩🇪 Germany"},
    {code:"fr",label:"🇫🇷 France"},{code:"sg",label:"🇸🇬 Singapore"},
  ];

  const search = async (pg = 1) => {
    setLoading(true); setError(""); if (pg===1) setJobs([]);
    try {
      const params = new URLSearchParams({
        keywords, location, country, sort_by: sortBy,
        full_time: fullTime ? 1 : 0, page: pg, results_per_page: 12,
      });
      const r = await fetch(`${API}/jobs?${params}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Search failed");
      setJobs(pg === 1 ? d.results : prev => [...prev, ...d.results]);
      setTotal(d.total); setPage(pg); setSearched(true); setFilteredOut(d.filtered_out || 0);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const fmtSalary = (min, max) => {
    if (!min && !max) return null;
    const fmt = n => "$" + Math.round(n/1000) + "k";
    if (min && max) return `${fmt(min)} – ${fmt(max)}`;
    if (min) return `From ${fmt(min)}`;
    return `Up to ${fmt(max)}`;
  };

  const fmtDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const diff = Math.floor((Date.now() - d) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7)  return `${diff}d ago`;
    if (diff < 30) return `${Math.floor(diff/7)}w ago`;
    return d.toLocaleDateString("en-US", {month:"short", day:"numeric"});
  };

  const inputStyle = {
    padding:"9px 12px", border:"1.5px solid #e3e6ef", borderRadius:8,
    fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif",
    color:"#374151", outline:"none", background:"#fff",
    transition:"border-color .15s",
  };
  const selectStyle = { ...inputStyle, cursor:"pointer", appearance:"none",
    backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ea3b5' stroke-width='2.5' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat:"no-repeat", backgroundPosition:"right 10px center", paddingRight:30,
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>

      {/* Search Bar */}
      <div style={{background:"#fff",border:"1px solid #e3e6ef",borderRadius:14,
        padding:20,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>

        {resumeSkills.length > 0 && (
          <div style={{marginBottom:12,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span style={{fontSize:12,color:"#6b7280",fontFamily:"'Fira Code',monospace"}}>Suggested from resume:</span>
            {resumeSkills.slice(0,6).map((s,i) => (
              <button key={i} onClick={()=>setKeywords(s)}
                style={{padding:"3px 10px",background:"#eef0fe",border:"1px solid rgba(79,97,245,0.2)",
                  borderRadius:20,fontSize:12,color:"#4f61f5",cursor:"pointer",fontWeight:500}}>
                {s}
              </button>
            ))}
          </div>
        )}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <div style={{position:"relative",display:"flex",alignItems:"center"}}>
            <span style={{position:"absolute",left:10,color:"#9ea3b5"}}><SearchIcon/></span>
            <input style={{...inputStyle,width:"100%",paddingLeft:32}}
              placeholder="Job title, skills, keywords…"
              value={keywords} onChange={e=>setKeywords(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&search(1)}/>
          </div>
          <div style={{position:"relative",display:"flex",alignItems:"center"}}>
            <span style={{position:"absolute",left:10,color:"#9ea3b5"}}><MapPinIcon/></span>
            <input style={{...inputStyle,width:"100%",paddingLeft:32}}
              placeholder="City, state (optional)"
              value={location} onChange={e=>setLocation(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&search(1)}/>
          </div>
        </div>

        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          <select style={{...selectStyle,flex:1,minWidth:120}} value={country} onChange={e=>setCountry(e.target.value)}>
            {COUNTRIES.map(c=><option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
          <select style={{...selectStyle,flex:1,minWidth:120}} value={sortBy} onChange={e=>setSortBy(e.target.value)}>
            <option value="date">Sort: Latest</option>
            <option value="salary">Sort: Salary</option>
            <option value="relevance">Sort: Relevance</option>
          </select>
          <label style={{display:"flex",alignItems:"center",gap:7,fontSize:13,color:"#374151",cursor:"pointer",whiteSpace:"nowrap"}}>
            <input type="checkbox" checked={fullTime} onChange={e=>setFullTime(e.target.checked)}
              style={{accentColor:"#4f61f5",width:15,height:15}}/>
            Full-time only
          </label>
          <button onClick={()=>search(1)} disabled={loading}
            style={{padding:"9px 20px",background:"#4f61f5",color:"#fff",border:"none",
              borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",
              display:"flex",alignItems:"center",gap:7,
              boxShadow:"0 3px 12px rgba(79,97,245,0.3)",
              opacity:loading?0.6:1,whiteSpace:"nowrap"}}>
            {loading ? <><SpinIcon/>Searching…</> : <><SearchIcon/>Search Jobs</>}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{padding:"12px 16px",background:"#fef2f2",border:"1px solid rgba(220,38,38,0.2)",
          borderRadius:10,display:"flex",gap:8,alignItems:"center",color:"#dc2626",fontSize:13}}>
          <AlertIcon/>{error}
        </div>
      )}

      {/* Results count */}
      {searched && !loading && (
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
          <span style={{fontSize:13,color:"#6b7280",fontFamily:"'Fira Code',monospace"}}>
            {total.toLocaleString()} jobs found
            {keywords && <> for "<strong style={{color:"#374151"}}>{keywords}</strong>"</>}
          </span>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {filteredOut > 0 && (
              <span style={{fontSize:11,padding:"3px 10px",background:"#fef2f2",
                border:"1px solid rgba(220,38,38,0.2)",borderRadius:20,color:"#dc2626",fontWeight:500}}>
                🚫 {filteredOut} citizenship/clearance jobs hidden
              </span>
            )}
            <span style={{fontSize:12,color:"#9ea3b5"}}>Powered by Adzuna</span>
          </div>
        </div>
      )}

      {/* Job Cards */}
      {jobs.length > 0 && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(380px,1fr))",gap:12}}>
          {jobs.map((job,i) => {
            const salary = fmtSalary(job.salary_min, job.salary_max);
            return (
              <a key={i} href={job.url} target="_blank" rel="noopener noreferrer"
                style={{textDecoration:"none",display:"block"}}>
                <div style={{
                  background:"#fff",border:"1px solid #e3e6ef",borderRadius:12,padding:18,
                  boxShadow:"0 1px 4px rgba(0,0,0,0.05)",cursor:"pointer",
                  transition:"border-color .15s, box-shadow .15s, transform .15s",
                  height:"100%",
                }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor="#4f61f5";e.currentTarget.style.boxShadow="0 4px 16px rgba(79,97,245,0.12)";e.currentTarget.style.transform="translateY(-2px)";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="#e3e6ef";e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.05)";e.currentTarget.style.transform="translateY(0)";}}>

                  {/* Header */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <div style={{flex:1,minWidth:0}}>
                      <h3 style={{fontSize:14,fontWeight:700,color:"#1a1d2e",marginBottom:4,
                        lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {job.title}
                      </h3>
                      <p style={{fontSize:13,fontWeight:500,color:"#4f61f5"}}>{job.company}</p>
                    </div>
                    <div style={{display:"flex",gap:6,flexShrink:0,marginLeft:8}}>
                      <button
                        onClick={e=>{e.preventDefault();e.stopPropagation();isJobSaved&&isJobSaved(job.id)?unsaveJob(job.id):saveJob&&saveJob(job);}}
                        title={isJobSaved&&isJobSaved(job.id)?"Unsave job":"Save job"}
                        style={{
                          background: isJobSaved&&isJobSaved(job.id) ? "#eef0fe" : "#f9fafb",
                          border:`1px solid ${isJobSaved&&isJobSaved(job.id) ? "rgba(79,97,245,0.3)" : "#e3e6ef"}`,
                          borderRadius:7,padding:"5px 7px",cursor:"pointer",
                          color: isJobSaved&&isJobSaved(job.id) ? "#4f61f5" : "#9ea3b5",
                          display:"flex",alignItems:"center",
                        }}>
                        <BookmarkIcon filled={!!(isJobSaved&&isJobSaved(job.id))}/>
                      </button>
                      <span style={{color:"#9ea3b5",marginTop:2}}><ExternalIcon/></span>
                    </div>
                  </div>

                  {/* Meta */}
                  <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:10}}>
                    {job.location && (
                      <span style={{display:"flex",alignItems:"center",gap:4,
                        fontSize:12,color:"#6b7280"}}>
                        <MapPinIcon/>{job.location}
                      </span>
                    )}
                    {job.created && (
                      <span style={{display:"flex",alignItems:"center",gap:4,fontSize:12,color:"#6b7280"}}>
                        <ClockIcon/>{fmtDate(job.created)}
                      </span>
                    )}
                    {salary && (
                      <span style={{display:"flex",alignItems:"center",gap:4,fontSize:12,
                        color:"#059669",fontWeight:600}}>
                        <DollarIcon/>{salary}
                      </span>
                    )}
                  </div>

                  {/* Badges */}
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                    {job.category && (
                      <span style={{padding:"2px 8px",background:"#eef0fe",color:"#4f61f5",
                        borderRadius:20,fontSize:11,fontWeight:500}}>
                        {job.category}
                      </span>
                    )}
                    {job.contract && (
                      <span style={{padding:"2px 8px",background:"#ecfdf5",color:"#059669",
                        borderRadius:20,fontSize:11,fontWeight:500,textTransform:"capitalize"}}>
                        {job.contract.replace("_"," ")}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p style={{fontSize:12,color:"#6b7280",lineHeight:1.6,
                    display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
                    {job.description}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {searched && jobs.length === 0 && !loading && !error && (
        <div style={{textAlign:"center",padding:"48px 24px",background:"#fff",
          borderRadius:14,border:"1px solid #e3e6ef"}}>
          <div style={{fontSize:36,marginBottom:12}}>🔍</div>
          <p style={{fontSize:15,fontWeight:600,color:"#374151",marginBottom:6}}>No jobs found</p>
          <p style={{fontSize:13,color:"#9ea3b5"}}>Try different keywords or a broader location</p>
        </div>
      )}

      {/* Load more */}
      {jobs.length > 0 && jobs.length < total && (
        <div style={{textAlign:"center"}}>
          <button onClick={()=>search(page+1)} disabled={loading}
            style={{padding:"10px 28px",background:"#fff",border:"1.5px solid #4f61f5",
              color:"#4f61f5",borderRadius:9,fontSize:13,fontWeight:600,cursor:"pointer",
              transition:"all .15s"}}>
            {loading ? "Loading…" : `Load more (${total - jobs.length} remaining)`}
          </button>
        </div>
      )}

      {!searched && (
        <div style={{textAlign:"center",padding:"48px 24px",background:"#fff",
          borderRadius:14,border:"2px dashed #e3e6ef"}}>
          <div style={{fontSize:36,marginBottom:12}}>💼</div>
          <p style={{fontSize:15,fontWeight:600,color:"#374151",marginBottom:6}}>Find Real Job Listings</p>
          <p style={{fontSize:13,color:"#9ea3b5",lineHeight:1.6}}>
            Search thousands of live jobs from Adzuna.<br/>
            Keywords are pre-filled from your resume skills!
          </p>
        </div>
      )}
    </div>
  );
}

// ── Results Screen ────────────────────────────────────────────────────────────


// ── Results Screen ────────────────────────────────────────────────────────────
function ResultsScreen({ data, filename, onReset }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [savedJobs, setSavedJobs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("applyedge_saved") || "[]"); }
    catch { return []; }
  });
  const saveJob   = (job) => { const u=[...savedJobs.filter(j=>j.id!==job.id),job]; setSavedJobs(u); localStorage.setItem("applyedge_saved",JSON.stringify(u)); };
  const unsaveJob = (id)  => { const u=savedJobs.filter(j=>j.id!==id); setSavedJobs(u); localStorage.setItem("applyedge_saved",JSON.stringify(u)); };
  const isJobSaved = (id) => savedJobs.some(j=>j.id===id);

  const [jobDesc,         setJobDesc]         = useState("");
  const [matchResult,     setMatchResult]     = useState(null);
  const [matchLoading,    setMatchLoading]    = useState(false);
  const [rewriteResult,   setRewriteResult]   = useState(null);
  const [rewriteLoading,  setRewriteLoading]  = useState(false);
  const [jobTitle,        setJobTitle]        = useState("");
  const [selectedBullets, setSelectedBullets] = useState(data.weak_bullets || []);

  const scoreColor = data.overall_score>=80?"#059669":data.overall_score>=60?"#1B4F8A":data.overall_score>=40?"#d97706":"#dc2626";

  const runMatch = async () => {
    if (!jobDesc.trim()) return;
    setMatchLoading(true); setMatchResult(null);
    try {
      const r = await fetch(`${API}/match-job`, { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ resume_text: data.resume_text, job_description: jobDesc }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.detail);
      setMatchResult(d);
    } catch(e) { alert(e.message); } finally { setMatchLoading(false); }
  };

  const runRewrite = async () => {
    if (!selectedBullets.length) return;
    setRewriteLoading(true); setRewriteResult(null);
    try {
      const r = await fetch(`${API}/rewrite`, { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ bullets: selectedBullets, job_title: jobTitle }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.detail);
      setRewriteResult(d);
    } catch(e) { alert(e.message); } finally { setRewriteLoading(false); }
  };

  const NAV = [
    { id:"overview",  emoji:"📊", label:"Overview",      group:"Analysis" },
    { id:"ats",       emoji:"🛡️", label:"ATS Check",     group:"Analysis" },
    { id:"job-match", emoji:"🎯", label:"Job Match",     group:"Optimize" },
    { id:"rewrite",   emoji:"✏️", label:"Bullet Rewrite",group:"Optimize" },
    { id:"tailor",    emoji:"✨", label:"Tailor Resume", group:"Optimize" },
    { id:"cover",     emoji:"📝", label:"Cover Letter",  group:"Apply" },
    { id:"interview", emoji:"🎤", label:"Interview Prep",group:"Apply" },
    { id:"jobs",      emoji:"🔍", label:"Find Jobs",     group:"Apply" },
    { id:"saved",     emoji:"🔖", label:"Saved Jobs",    group:"Apply", badge: savedJobs.length||null },
  ];

  const groups = ["Analysis","Optimize","Apply"];
  const ta = { width:"100%", padding:"11px 14px", background:"#FAFBFD",
    border:"1.5px solid #DDE3EE", borderRadius:9, resize:"vertical",
    fontSize:13, fontFamily:"'Sora',sans-serif", color:"#0F1C2E",
    outline:"none", lineHeight:1.65 };

  return (
    <div style={{minHeight:"100vh",background:"#F4F6FB",fontFamily:"'Sora',sans-serif",display:"flex",flexDirection:"column"}}>

      {/* Top bar */}
      <header style={{background:"#0F1C2E",padding:"0 32px",height:56,
        display:"flex",alignItems:"center",justifyContent:"space-between",
        flexShrink:0,position:"sticky",top:0,zIndex:20,
        borderBottom:"1px solid rgba(255,255,255,0.08)",
        boxShadow:"0 2px 12px rgba(0,0,0,0.3)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:30,height:30,background:"#1B4F8A",borderRadius:7,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>⚡</div>
          <span style={{fontSize:16,fontWeight:700,color:"#FFFFFF",letterSpacing:"-0.02em"}}>ApplyEdge</span>
          <div style={{width:1,height:18,background:"rgba(255,255,255,0.2)",margin:"0 10px"}}/>
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",
            background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8}}>
            <span style={{fontSize:14}}>📄</span>
            <span style={{fontSize:12,fontWeight:500,color:"#E2E8F0",maxWidth:200,
              overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{filename}</span>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 14px",
            background: data.overall_score>=60?"rgba(16,185,129,0.2)":"rgba(220,38,38,0.2)",
            border:`1.5px solid ${data.overall_score>=60?"rgba(16,185,129,0.5)":"rgba(220,38,38,0.5)"}`,
            borderRadius:20}}>
            <span style={{fontSize:14,fontWeight:800,color: data.overall_score>=60?"#34D399":"#F87171"}}>
              {data.overall_score}/100
            </span>
            <span style={{fontSize:12,fontWeight:600,color:"#CBD5E1"}}>
              {data.overall_score>=80?"Excellent":data.overall_score>=60?"Good":data.overall_score>=40?"Fair":"Needs Work"}
            </span>
          </div>
          <button onClick={onReset}
            style={{padding:"6px 16px",background:"rgba(255,255,255,0.08)",
              border:"1.5px solid rgba(255,255,255,0.2)",borderRadius:8,
              color:"#E2E8F0",fontSize:13,fontWeight:600,cursor:"pointer",
              display:"flex",alignItems:"center",gap:6}}>
            ← New Resume
          </button>
        </div>
      </header>

      <div style={{flex:1,display:"flex"}}>

        {/* Sidebar */}
        <aside style={{width:218,flexShrink:0,background:"#FFFFFF",
          borderRight:"1px solid #DDE3EE",
          position:"sticky",top:56,height:"calc(100vh - 56px)",
          overflowY:"auto",padding:"20px 0"}}>
          {groups.map(group => (
            <div key={group} style={{marginBottom:6}}>
              <div style={{padding:"4px 18px 8px",fontSize:10,fontWeight:700,
                color:"#9CA3AF",letterSpacing:"0.1em",textTransform:"uppercase"}}>
                {group}
              </div>
              {NAV.filter(n=>n.group===group).map(n=>(
                <button key={n.id} onClick={()=>setActiveTab(n.id)}
                  style={{width:"100%",display:"flex",alignItems:"center",gap:9,
                    padding:"9px 18px",border:"none",cursor:"pointer",textAlign:"left",
                    background: activeTab===n.id?"#EEF3FB":"transparent",
                    borderLeft: activeTab===n.id?"3px solid #1B4F8A":"3px solid transparent",
                    transition:"all .12s"}}>
                  <span style={{fontSize:15}}>{n.emoji}</span>
                  <span style={{fontSize:13,fontWeight:activeTab===n.id?600:400,
                    color:activeTab===n.id?"#1B4F8A":"#4B5563",flex:1}}>
                    {n.label}
                  </span>
                  {n.badge ? (
                    <span style={{fontSize:10,fontWeight:700,minWidth:18,height:18,
                      borderRadius:10,background:"#1B4F8A",color:"#fff",
                      display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px"}}>
                      {n.badge}
                    </span>
                  ) : null}
                </button>
              ))}
              <div style={{height:1,background:"#EEF0F5",margin:"10px 18px 4px"}}/>
            </div>
          ))}
        </aside>

        {/* Main */}
        <main style={{flex:1,padding:"28px 32px",overflowY:"auto",minWidth:0}}>

          {/* Breadcrumb */}
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:20}}>
            <span style={{fontSize:12,color:"#9CA3AF"}}>ApplyEdge</span>
            <span style={{fontSize:12,color:"#D1D5DB"}}>/</span>
            <span style={{fontSize:12,fontWeight:600,color:"#1B4F8A"}}>
              {NAV.find(n=>n.id===activeTab)?.label}
            </span>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:16}}>

            {/* ── OVERVIEW ── */}
            {activeTab==="overview" && (<>
              {/* Score hero */}
              <div style={{background:"#0F1C2E",borderRadius:14,padding:28,
                display:"flex",alignItems:"center",gap:32,flexWrap:"wrap"}}>
                <ScoreRing score={data.overall_score} color={scoreColor} size={130} light={true}/>
                <div style={{flex:1,minWidth:220}}>
                  <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.35)",
                    letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>Resume Report</div>
                  <h2 style={{fontSize:22,fontWeight:800,color:"#fff",marginBottom:6,letterSpacing:"-0.02em"}}>
                    Analysis Complete
                  </h2>
                  <p style={{fontSize:13,color:"rgba(255,255,255,0.45)",marginBottom:22,lineHeight:1.6}}>
                    {data.experience_years} years experience · {data.education}
                  </p>
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>
                    <ScoreBar label="Clarity"           value={data.scores?.clarity||0} light={true}/>
                    <ScoreBar label="Impact"            value={data.scores?.impact||0} light={true}/>
                    <ScoreBar label="Keywords"          value={data.scores?.keywords||0} light={true}/>
                    <ScoreBar label="Structure"         value={data.scores?.structure||0} light={true}/>
                    <ScoreBar label="ATS Compatibility" value={data.scores?.ats_compatibility||0} light={true}/>
                  </div>
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <Panel title="Strengths" icon={<CheckIcon/>} accent="#059669">
                  <div style={{display:"flex",flexDirection:"column",gap:9}}>
                    {(data.strengths||[]).map((s,i)=>(
                      <div key={i} style={{display:"flex",gap:9,alignItems:"flex-start"}}>
                        <div style={{width:20,height:20,borderRadius:6,background:"#ECFDF5",
                          display:"flex",alignItems:"center",justifyContent:"center",
                          color:"#059669",flexShrink:0,marginTop:1}}><CheckIcon/></div>
                        <span style={{fontSize:13,color:"#374151",lineHeight:1.55}}>{s}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
                <Panel title="Weaknesses" icon={<XIcon/>} accent="#DC2626">
                  <div style={{display:"flex",flexDirection:"column",gap:9}}>
                    {(data.weaknesses||[]).map((w,i)=>(
                      <div key={i} style={{display:"flex",gap:9,alignItems:"flex-start"}}>
                        <div style={{width:20,height:20,borderRadius:6,background:"#FEF2F2",
                          display:"flex",alignItems:"center",justifyContent:"center",
                          color:"#DC2626",flexShrink:0,marginTop:1}}><XIcon/></div>
                        <span style={{fontSize:13,color:"#374151",lineHeight:1.55}}>{w}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>

              {(data.missing_sections||[]).length>0 && (
                <Panel title="Missing Sections" icon={<AlertIcon/>} accent="#D97706">
                  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                    {data.missing_sections.map((s,i)=><Tag key={i} color="amber">{s}</Tag>)}
                  </div>
                </Panel>
              )}

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <Panel title="Technical Skills" icon={<CheckIcon/>} accent="#1B4F8A">
                  <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                    {(data.skills?.technical||[]).map((s,i)=><Tag key={i} color="indigo">{s}</Tag>)}
                    {!data.skills?.technical?.length && <span style={{fontSize:13,color:"#9CA3AF"}}>None detected</span>}
                  </div>
                </Panel>
                <Panel title="Soft Skills" icon={<CheckIcon/>} accent="#0891b2">
                  <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                    {(data.skills?.soft||[]).map((s,i)=><Tag key={i} color="teal">{s}</Tag>)}
                    {!data.skills?.soft?.length && <span style={{fontSize:13,color:"#9CA3AF"}}>None detected</span>}
                  </div>
                </Panel>
              </div>

              <Panel title="Improvement Tips" icon={<StarIcon/>} accent="#1B4F8A">
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {(data.improvement_tips||[]).map((tip,i)=>(
                    <div key={i} style={{display:"flex",gap:14,padding:"12px 0",
                      borderBottom:i<data.improvement_tips.length-1?"1px solid #EEF0F5":"none"}}>
                      <div style={{width:6,borderRadius:3,background:"#1B4F8A",flexShrink:0,alignSelf:"stretch"}}/>
                      <div>
                        <div style={{fontSize:11,fontWeight:700,color:"#1B4F8A",
                          textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>{tip.area}</div>
                        <div style={{fontSize:13,color:"#4B5563",lineHeight:1.6}}>{tip.tip}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </>)}

            {/* ── ATS ── */}
            {activeTab==="ats" && (<>
              <Panel title="ATS Compatibility Score" icon={<CheckIcon/>}
                accent={data.scores?.ats_compatibility>=70?"#059669":"#D97706"}>
                <div style={{display:"flex",alignItems:"center",gap:24,flexWrap:"wrap"}}>
                  <ScoreRing score={data.scores?.ats_compatibility||0} size={100}
                    color={data.scores?.ats_compatibility>=70?"#059669":"#D97706"}/>
                  <p style={{flex:1,fontSize:13,color:"#4B5563",lineHeight:1.7}}>
                    ATS systems automatically screen resumes before a recruiter sees them. A low score means your resume may be rejected before any human reviews it.
                  </p>
                </div>
              </Panel>
              <Panel title="ATS Issues Found" icon={<AlertIcon/>} accent="#DC2626">
                {(data.ats_issues||[]).length===0 ? (
                  <div style={{display:"flex",alignItems:"center",gap:8,color:"#059669",
                    padding:"12px 0",fontSize:14,fontWeight:600}}>
                    <CheckIcon/> No ATS issues detected — great job!
                  </div>
                ) : (
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {data.ats_issues.map((issue,i)=>(
                      <div key={i} style={{display:"flex",gap:10,padding:"11px 14px",
                        background:"#FEF2F2",border:"1px solid rgba(220,38,38,0.15)",borderRadius:8}}>
                        <div style={{color:"#DC2626",flexShrink:0,marginTop:1}}><AlertIcon/></div>
                        <span style={{fontSize:13,color:"#374151",lineHeight:1.5}}>{issue}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </>)}

            {/* ── JOB MATCH ── */}
            {activeTab==="job-match" && (<>
              <Panel title="Paste Job Description" icon={<BriefcaseIcon/>} accent="#1B4F8A">
                <textarea placeholder="Paste the full job description here…"
                  value={jobDesc} onChange={e=>setJobDesc(e.target.value)}
                  style={{...ta,height:180}}/>
                <div style={{marginTop:12}}>
                  <PrimaryBtn onClick={runMatch} disabled={!jobDesc.trim()||matchLoading}>
                    {matchLoading?<><SpinIcon/>Analyzing match…</>:<><BriefcaseIcon/>Match My Resume</>}
                  </PrimaryBtn>
                </div>
              </Panel>
              {matchResult && (<>
                <Panel title="Match Result" icon={<StarIcon/>}
                  accent={matchResult.match_score>=70?"#059669":matchResult.match_score>=50?"#D97706":"#DC2626"}>
                  <div style={{display:"flex",alignItems:"center",gap:28,flexWrap:"wrap"}}>
                    <ScoreRing score={matchResult.match_score}
                      color={matchResult.match_score>=70?"#059669":matchResult.match_score>=50?"#D97706":"#DC2626"}/>
                    <div style={{flex:1}}>
                      <div style={{marginBottom:8}}><Tag color={matchResult.match_score>=70?"green":matchResult.match_score>=50?"amber":"red"}>{matchResult.verdict}</Tag></div>
                      <p style={{fontSize:13,color:"#4B5563",lineHeight:1.7,marginBottom:10}}>{matchResult.summary}</p>
                      <div style={{padding:"10px 14px",borderRadius:8,fontSize:13,fontWeight:600,
                        background:matchResult.should_apply?"#ECFDF5":"#FEF2F2",
                        color:matchResult.should_apply?"#059669":"#DC2626"}}>
                        {matchResult.should_apply?"✅ You should apply for this role!":"⚠️ Consider improving your match score before applying."}
                      </div>
                    </div>
                  </div>
                </Panel>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  <Panel title="Matched Skills" icon={<CheckIcon/>} accent="#059669">
                    <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                      {(matchResult.matched_skills||[]).map((s,i)=><Tag key={i} color="green">{s}</Tag>)}
                    </div>
                  </Panel>
                  <Panel title="Missing Skills" icon={<XIcon/>} accent="#DC2626">
                    <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                      {(matchResult.missing_skills||[]).map((s,i)=><Tag key={i} color="red">{s}</Tag>)}
                    </div>
                  </Panel>
                </div>
                <Panel title="Missing Keywords" icon={<AlertIcon/>} accent="#D97706">
                  <p style={{fontSize:12,color:"#9CA3AF",marginBottom:10}}>Add these keywords to pass ATS filters for this role:</p>
                  <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                    {(matchResult.missing_keywords||[]).map((k,i)=><Tag key={i} color="amber">{k}</Tag>)}
                  </div>
                </Panel>
                <Panel title="Recommendations" icon={<StarIcon/>} accent="#1B4F8A">
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {(matchResult.recommendations||[]).map((r,i)=>(
                      <div key={i} style={{display:"flex",gap:12,padding:"10px 14px",
                        background:"#EEF3FB",border:"1px solid rgba(27,79,138,0.15)",borderRadius:8}}>
                        <span style={{color:"#1B4F8A",fontWeight:700,flexShrink:0}}>{i+1}.</span>
                        <span style={{fontSize:13,color:"#374151",lineHeight:1.5}}>{r}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
              </>)}
            </>)}

            {/* ── REWRITE ── */}
            {activeTab==="rewrite" && (<>
              <Panel title="Rewrite Weak Bullet Points" icon={<PenIcon/>} accent="#1B4F8A">
                <p style={{fontSize:13,color:"#6B7280",marginBottom:14,lineHeight:1.6}}>
                  Select weak bullet points to rewrite with stronger, metrics-focused language:
                </p>
                <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
                  {(data.weak_bullets||[]).map((b,i)=>(
                    <label key={i} style={{display:"flex",gap:10,padding:"11px 14px",
                      background:selectedBullets.includes(b)?"#EEF3FB":"#FAFBFD",
                      border:`1.5px solid ${selectedBullets.includes(b)?"#1B4F8A":"#DDE3EE"}`,
                      borderRadius:9,cursor:"pointer",transition:"all .15s"}}>
                      <input type="checkbox" checked={selectedBullets.includes(b)}
                        onChange={e=>setSelectedBullets(p=>e.target.checked?[...p,b]:p.filter(x=>x!==b))}
                        style={{marginTop:2,accentColor:"#1B4F8A"}}/>
                      <span style={{fontSize:13,color:"#374151",lineHeight:1.5}}>{b}</span>
                    </label>
                  ))}
                </div>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <input placeholder="Target job title (optional)"
                    value={jobTitle} onChange={e=>setJobTitle(e.target.value)}
                    style={{flex:1,padding:"9px 12px",background:"#FAFBFD",
                      border:"1.5px solid #DDE3EE",borderRadius:8,fontSize:13,
                      fontFamily:"'Sora',sans-serif",outline:"none",color:"#0F1C2E"}}/>
                  <PrimaryBtn onClick={runRewrite} disabled={!selectedBullets.length||rewriteLoading}>
                    {rewriteLoading?<><SpinIcon/>Rewriting…</>:<><PenIcon/>Rewrite Selected</>}
                  </PrimaryBtn>
                </div>
              </Panel>
              {rewriteResult && (
                <Panel title="Improved Bullets" icon={<StarIcon/>} accent="#059669">
                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    {(rewriteResult.rewrites||[]).map((rw,i)=>(
                      <div key={i} style={{borderRadius:10,overflow:"hidden",border:"1px solid #DDE3EE"}}>
                        <div style={{padding:"10px 16px",background:"#FEF2F2",borderBottom:"1px solid #DDE3EE"}}>
                          <div style={{fontSize:10,fontWeight:700,color:"#DC2626",letterSpacing:"0.1em",marginBottom:5}}>ORIGINAL</div>
                          <p style={{fontSize:13,color:"#374151",lineHeight:1.5}}>{rw.original}</p>
                        </div>
                        <div style={{padding:"10px 16px",background:"#ECFDF5",borderBottom:"1px solid #DDE3EE"}}>
                          <div style={{fontSize:10,fontWeight:700,color:"#059669",letterSpacing:"0.1em",marginBottom:5}}>IMPROVED</div>
                          <p style={{fontSize:13,color:"#374151",lineHeight:1.5,fontWeight:500}}>{rw.improved}</p>
                        </div>
                        <div style={{padding:"8px 16px",background:"#FAFBFD"}}>
                          <span style={{fontSize:11,color:"#6B7280",fontStyle:"italic"}}>💡 {rw.reason}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              )}
            </>)}

            {activeTab==="tailor"    && <TailorTab    resumeText={data.resume_text} originalScore={data.overall_score}/>}
            {activeTab==="cover"     && <CoverLetterTab resumeText={data.resume_text}/>}
            {activeTab==="interview" && <InterviewTab  resumeText={data.resume_text}/>}
            {activeTab==="saved"     && <SavedJobsTab  savedJobs={savedJobs} unsaveJob={unsaveJob}/>}
            {activeTab==="jobs"      && <JobsTab
              resumeSkills={[...(data.skills?.technical||[]),...(data.skills?.soft||[])]}
              savedJobs={savedJobs} saveJob={saveJob} unsaveJob={unsaveJob} isJobSaved={isJobSaved}/>}

          </div>
        </main>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [result,   setResult]   = useState(null);
  const [filename, setFilename] = useState("");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Fira+Code:wght@300;400;500&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'Sora',sans-serif; background:#F4F6FB; }
        @keyframes spin { to { transform:rotate(360deg); } }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-thumb { background:#C5CDD9; border-radius:4px; }
        textarea:focus { border-color:#1B4F8A !important; box-shadow:0 0 0 3px rgba(27,79,138,0.1) !important; }
        input:focus    { border-color:#1B4F8A !important; box-shadow:0 0 0 3px rgba(27,79,138,0.1) !important; }
        button:hover   { opacity:0.88; }
      `}</style>
      {result
        ? <ResultsScreen data={result} filename={filename} onReset={()=>{setResult(null);setFilename("");}}/>
        : <UploadScreen  onAnalyzed={(d,name)=>{setResult(d);setFilename(name);}}/>
      }
    </>
  );
}
