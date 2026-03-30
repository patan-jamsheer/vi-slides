import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

export default function StudentDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [question, setQuestion] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [qError, setQError] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  const logout = () => { localStorage.clear(); navigate("/login"); };

  useEffect(() => {
    if (!sessionId) return;
    socket.emit("join-room", sessionId);
    socket.on("session-status", (status: string) => {
      if (status === "paused") setQError("Session is paused by teacher");
      if (status === "ended") setQError("Session has ended");
      if (status === "active") setQError("");
    });
    return () => { socket.off("session-status"); };
  }, [sessionId]);

  const joinSession = async () => {
    if (!code.trim()) return setError("Please enter a code");
    setLoading(true); setError("");
    try {
      const res = await axios.post("http://localhost:5000/api/session/join", { code }, { headers: { Authorization: `Bearer ${token}` } });
      setSessionId(res.data.session._id);
      setJoined(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to join session");
    } finally { setLoading(false); }
  };

  const submitQuestion = async () => {
    if (!question.trim()) return setQError("Please enter a question");
    setSubmitting(true); setQError("");
    try {
      const res = await axios.post("http://localhost:5000/api/question/submit", { sessionId, text: question, isAnonymous }, { headers: { Authorization: `Bearer ${token}` } });
      setAiAnswer(res.data.question.aiAnswer);
      setSubmitted(true);
      setQuestion("");
      setTimeout(() => { setSubmitted(false); setAiAnswer(null); }, 8000);
    } catch (err: any) {
      setQError(err.response?.data?.message || "Failed to submit question");
    } finally { setSubmitting(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.navbar}>
        <span style={s.logo}>Vi-SlideS</span>
        <div style={s.navRight}>
          {joined && <div style={s.sessionBadge}>Session: <strong style={{ color: "#1a1f36" }}>{code}</strong></div>}
          <div style={s.userBadge}>{user.name?.[0]?.toUpperCase()}</div>
          <button style={s.logoutBtn} onClick={logout}>Sign out</button>
        </div>
      </div>

      <div style={s.content}>
        {!joined ? (
          <div style={s.joinWrap}>
            <div style={s.joinCard}>
              <div style={s.joinIcon}>🎓</div>
              <h1 style={s.joinTitle}>Join a Session</h1>
              <p style={s.joinSub}>Enter the session code provided by your teacher</p>
              <div style={s.field}>
                <label style={s.label}>Session Code</label>
                <input style={s.codeInput} type="text" placeholder="ABC123"
                  value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={6} />
              </div>
              {error && <div style={s.errorBox}>{error}</div>}
              <button style={s.primaryBtn} onClick={joinSession} disabled={loading}>
                {loading ? "Joining..." : "Join Session →"}
              </button>
            </div>
          </div>
        ) : (
          <div style={s.sessionWrap}>
            <div style={s.questionCard}>
              <h2 style={s.cardTitle}>Ask a Question</h2>
              <p style={s.cardSub}>Your question will be analyzed by AI. Simple questions get instant answers!</p>

              <div style={s.field}>
                <label style={s.label}>Your Question</label>
                <textarea style={s.textarea} placeholder="Type your question here..."
                  value={question} onChange={e => setQuestion(e.target.value)} rows={4} />
              </div>

              <div style={s.toggleRow}>
                <div>
                  <p style={s.toggleLabel}>Anonymous submission</p>
                  <p style={s.toggleDesc}>Your name won't be shown to the teacher</p>
                </div>
                <div style={{ ...s.toggle, background: isAnonymous ? "#1a1f36" : "#e4e6ef" }}
                  onClick={() => setIsAnonymous(!isAnonymous)}>
                  <div style={{ ...s.toggleDot, transform: isAnonymous ? "translateX(20px)" : "translateX(0)" }} />
                </div>
              </div>

              {qError && <div style={s.errorBox}>{qError}</div>}

              {submitted && (
                <div style={s.resultBox}>
                  <div style={s.resultHeader}>
                    <span style={s.successText}>✅ Question submitted!</span>
                  </div>
                  {aiAnswer ? (
                    <div style={s.aiBox}>
                      <p style={s.aiLabel}>🤖 AI Answer</p>
                      <p style={s.aiText}>{aiAnswer}</p>
                    </div>
                  ) : (
                    <div style={s.teacherBox}>
                      <p style={s.teacherText}>🧑‍🏫 This question has been routed to your teacher for a detailed explanation.</p>
                    </div>
                  )}
                </div>
              )}

              <button style={s.primaryBtn} onClick={submitQuestion} disabled={submitting}>
                {submitting ? "Analysing..." : "Submit Question →"}
              </button>
            </div>

            <div style={s.infoPanel}>
              <div style={s.infoPanelCard}>
                <p style={s.infoPanelTitle}>How it works</p>
                <div style={s.steps}>
                  {[
                    { icon: "✍️", text: "Type your question after the topic introduction" },
                    { icon: "🤖", text: "AI analyses and answers simple questions instantly" },
                    { icon: "🧑‍🏫", text: "Complex questions are sent to your teacher" },
                    { icon: "📊", text: "Teacher gets insights about class understanding" },
                  ].map((step, i) => (
                    <div key={i} style={s.step}>
                      <span style={s.stepIcon}>{step.icon}</span>
                      <p style={s.stepText}>{step.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f5f6fa", fontFamily: "'DM Sans', sans-serif" },
  navbar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 40px", height: "64px", background: "#fff", borderBottom: "1px solid #e4e6ef", position: "sticky", top: 0, zIndex: 100 },
  logo: { fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 700, color: "#1a1f36" },
  navRight: { display: "flex", alignItems: "center", gap: "12px" },
  sessionBadge: { background: "#eef0ff", border: "1px solid #c7d0ff", borderRadius: "6px", padding: "6px 14px", fontSize: "13px", color: "#4f67ff" },
  userBadge: { width: "34px", height: "34px", borderRadius: "50%", background: "#1a1f36", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "14px" },
  logoutBtn: { background: "transparent", border: "1px solid #e4e6ef", color: "#6b7280", padding: "7px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "13px" },
  content: { padding: "40px" },
  joinWrap: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 144px)" },
  joinCard: { background: "#fff", border: "1px solid #e4e6ef", borderRadius: "16px", padding: "48px", width: "100%", maxWidth: "420px", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" },
  joinIcon: { fontSize: "48px", marginBottom: "16px" },
  joinTitle: { fontFamily: "'Playfair Display', serif", fontSize: "26px", fontWeight: 700, color: "#1a1f36", marginBottom: "8px" },
  joinSub: { color: "#6b7280", fontSize: "14px", marginBottom: "32px" },
  field: { display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px", textAlign: "left" },
  label: { fontSize: "13px", fontWeight: 600, color: "#1a1f36" },
  codeInput: { background: "#f5f6fa", border: "1.5px solid #e4e6ef", borderRadius: "8px", padding: "14px", color: "#1a1f36", fontSize: "24px", fontWeight: 700, textAlign: "center", letterSpacing: "6px", outline: "none" },
  primaryBtn: { width: "100%", background: "#1a1f36", color: "#fff", border: "none", borderRadius: "8px", padding: "14px", fontSize: "15px", fontWeight: 600, cursor: "pointer" },
  errorBox: { background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px", color: "#dc2626", fontSize: "13px", marginBottom: "16px" },
  sessionWrap: { display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", maxWidth: "1000px", margin: "0 auto" },
  questionCard: { background: "#fff", border: "1px solid #e4e6ef", borderRadius: "16px", padding: "40px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" },
  cardTitle: { fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: 700, color: "#1a1f36", marginBottom: "6px" },
  cardSub: { color: "#6b7280", fontSize: "13px", marginBottom: "28px" },
  textarea: { width: "100%", background: "#f5f6fa", border: "1.5px solid #e4e6ef", borderRadius: "8px", padding: "14px", color: "#1a1f36", fontSize: "14px", outline: "none", resize: "none", lineHeight: "1.6" },
  toggleRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderTop: "1px solid #e4e6ef", borderBottom: "1px solid #e4e6ef", marginBottom: "20px" },
  toggleLabel: { fontSize: "13px", fontWeight: 600, color: "#1a1f36" },
  toggleDesc: { fontSize: "12px", color: "#6b7280", marginTop: "2px" },
  toggle: { width: "44px", height: "24px", borderRadius: "12px", cursor: "pointer", position: "relative", transition: "background 0.3s" },
  toggleDot: { width: "18px", height: "18px", background: "#fff", borderRadius: "50%", position: "absolute", top: "3px", left: "3px", transition: "transform 0.3s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" },
  resultBox: { background: "#f5f6fa", border: "1px solid #e4e6ef", borderRadius: "10px", padding: "16px", marginBottom: "20px" },
  resultHeader: { marginBottom: "10px" },
  successText: { color: "#059669", fontSize: "13px", fontWeight: 600 },
  aiBox: { background: "#eef0ff", border: "1px solid #c7d0ff", borderRadius: "8px", padding: "14px" },
  aiLabel: { color: "#4f67ff", fontSize: "12px", fontWeight: 700, marginBottom: "6px" },
  aiText: { color: "#1a1f36", fontSize: "14px", lineHeight: "1.6" },
  teacherBox: { background: "#fef3c7", border: "1px solid #fde68a", borderRadius: "8px", padding: "14px" },
  teacherText: { color: "#92400e", fontSize: "13px", lineHeight: "1.5" },
  infoPanel: {},
  infoPanelCard: { background: "#fff", border: "1px solid #e4e6ef", borderRadius: "16px", padding: "28px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" },
  infoPanelTitle: { fontWeight: 700, fontSize: "14px", color: "#1a1f36", marginBottom: "20px" },
  steps: { display: "flex", flexDirection: "column", gap: "16px" },
  step: { display: "flex", gap: "12px", alignItems: "flex-start" },
  stepIcon: { fontSize: "20px", flexShrink: 0 },
  stepText: { color: "#6b7280", fontSize: "13px", lineHeight: "1.5" },
};