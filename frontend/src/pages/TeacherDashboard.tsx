import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

interface Question {
  _id: string;
  text: string;
  isAnonymous: boolean;
  status: string;
  createdAt: string;
}

interface Summary {
  totalQuestions: number;
  durationMinutes: number;
  mood: string;
  questions: Question[];
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const [sessionCode, setSessionCode] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [sessionStatus, setSessionStatus] = useState("waiting");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);

  const logout = () => { localStorage.clear(); navigate("/login"); };

  const createSession = async () => {
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/session/create", {}, { headers: { Authorization: `Bearer ${token}` } });
      setSessionCode(res.data.session.code);
      setSessionId(res.data.session._id);
      setSessionStatus("waiting");
      socket.emit("join-room", res.data.session._id);
    } catch { alert("Failed to create session"); }
    finally { setLoading(false); }
  };

  const updateStatus = async (status: string) => {
    try {
      await axios.patch(`http://localhost:5000/api/session/${sessionId}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      setSessionStatus(status);
      if (status === "ended") {
        const res = await axios.get(`http://localhost:5000/api/session/${sessionId}/summary`, { headers: { Authorization: `Bearer ${token}` } });
        setSummary(res.data);
      }
    } catch { alert("Failed to update status"); }
  };

  useEffect(() => {
    socket.on("new-question", (q: Question) => setQuestions(prev => [...prev, q]));
    return () => { socket.off("new-question"); };
  }, []);

  const statusConfig: Record<string, { color: string; bg: string }> = {
    waiting: { color: "#6b7280", bg: "#f3f4f6" },
    active: { color: "#059669", bg: "#d1fae5" },
    paused: { color: "#d97706", bg: "#fef3c7" },
    ended: { color: "#dc2626", bg: "#fee2e2" },
  };
  const sc = statusConfig[sessionStatus] || statusConfig.waiting;

  return (
    <div style={s.page}>
      {/* Navbar */}
      <div style={s.navbar}>
        <div style={s.navLeft}>
          <span style={s.logo}>Vi-SlideS</span>
          {sessionCode && (
            <div style={s.codePill}>
              Session Code: <strong style={{ color: "#1a1f36", letterSpacing: "2px" }}>{sessionCode}</strong>
            </div>
          )}
        </div>
        <div style={s.navRight}>
          {sessionCode && (
            <div style={{ ...s.statusPill, color: sc.color, background: sc.bg }}>
              ● {sessionStatus.toUpperCase()}
            </div>
          )}
          <div style={s.userBadge}>{user.name?.[0]?.toUpperCase()}</div>
          <button style={s.logoutBtn} onClick={logout}>Sign out</button>
        </div>
      </div>

      <div style={s.content}>
        {!sessionCode ? (
          /* Welcome Screen */
          <div style={s.welcomeWrap}>
            <div style={s.welcomeCard}>
              <div style={s.welcomeIcon}>👨‍🏫</div>
              <h1 style={s.welcomeTitle}>Good to see you, {user.name}!</h1>
              <p style={s.welcomeSub}>Create a session to start receiving student questions in real-time.</p>
              <button style={s.primaryBtn} onClick={createSession} disabled={loading}>
                {loading ? "Creating session..." : "+ Create New Session"}
              </button>
            </div>
            <div style={s.infoGrid}>
              {[
                { icon: "⚡", title: "Real-time Questions", desc: "See student questions appear instantly as they submit" },
                { icon: "🤖", title: "AI Auto-Answers", desc: "Simple questions get answered automatically by AI" },
                { icon: "📊", title: "Mood Insights", desc: "Understand class engagement with mood analysis" },
              ].map(item => (
                <div key={item.title} style={s.infoCard}>
                  <span style={s.infoIcon}>{item.icon}</span>
                  <p style={s.infoTitle}>{item.title}</p>
                  <p style={s.infoDesc}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={s.sessionWrap}>
            {/* Controls */}
            <div style={s.controlBar}>
              <div style={s.controlLeft}>
                <span style={s.controlLabel}>Session Controls</span>
              </div>
              <div style={s.controlBtns}>
                <button style={{ ...s.ctrlBtn, ...s.startBtn, opacity: sessionStatus === "active" || sessionStatus === "ended" ? 0.4 : 1 }}
                  onClick={() => updateStatus("active")} disabled={sessionStatus === "active" || sessionStatus === "ended"}>
                  ▶ Start
                </button>
                <button style={{ ...s.ctrlBtn, ...s.pauseBtn, opacity: sessionStatus !== "active" ? 0.4 : 1 }}
                  onClick={() => updateStatus("paused")} disabled={sessionStatus !== "active"}>
                  ⏸ Pause
                </button>
                <button style={{ ...s.ctrlBtn, ...s.endBtn, opacity: sessionStatus === "ended" ? 0.4 : 1 }}
                  onClick={() => updateStatus("ended")} disabled={sessionStatus === "ended"}>
                  ⏹ End Session
                </button>
              </div>
            </div>

            {/* Summary */}
            {sessionStatus === "ended" && summary ? (
              <div style={s.summaryWrap}>
                <h2 style={s.sectionTitle}>Session Summary</h2>
                <div style={s.statsRow}>
                  {[
                    { label: "Session Code", value: sessionCode },
                    { label: "Total Questions", value: summary.totalQuestions },
                    { label: "Duration", value: `${summary.durationMinutes} min` },
                  ].map(stat => (
                    <div key={stat.label} style={s.statCard}>
                      <p style={s.statValue}>{stat.value}</p>
                      <p style={s.statLabel}>{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div style={s.moodCard}>
                  <p style={s.moodLabel}>Class Mood Analysis</p>
                  <p style={s.moodValue}>{summary.mood}</p>
                </div>
                {summary.questions.length > 0 && (
                  <div style={s.qList}>
                    <p style={s.qListTitle}>All Questions ({summary.questions.length})</p>
                    {summary.questions.map((q, i) => (
                      <div key={q._id} style={s.qItem}>
                        <div style={s.qMeta}>
                          <span style={s.qNum}>Q{i + 1}</span>
                          <span style={{ ...s.qBadge, background: q.status === "ai-answered" ? "#d1fae5" : "#fef3c7", color: q.status === "ai-answered" ? "#059669" : "#d97706" }}>
                            {q.status === "ai-answered" ? "🤖 AI Answered" : "🧑‍🏫 Teacher"}
                          </span>
                          {q.isAnonymous && <span style={s.anonBadge}>Anonymous</span>}
                        </div>
                        <p style={s.qText}>{q.text}</p>
                      </div>
                    ))}
                  </div>
                )}
                <button style={s.primaryBtn} onClick={() => { setSessionCode(""); setSessionId(""); setSessionStatus("waiting"); setQuestions([]); setSummary(null); }}>
                  Start New Session
                </button>
              </div>
            ) : questions.length === 0 ? (
              <div style={s.waitingWrap}>
                <div style={s.waitingCard}>
                  <div style={s.waitingIcon}>⏳</div>
                  <h2 style={s.waitingTitle}>Waiting for questions</h2>
                  <p style={s.waitingSub}>Share the session code <strong style={{ color: "#4f67ff" }}>{sessionCode}</strong> with your students</p>
                  {sessionStatus === "waiting" && <p style={{ color: "#dc2626", fontSize: "13px", marginTop: "12px" }}>⚠️ Click Start to allow students to submit</p>}
                </div>
              </div>
            ) : (
              <div style={s.slideWrap}>
                <div style={s.slideTop}>
                  <p style={s.slideCounter}>Question {currentIndex + 1} of {questions.length}</p>
                  <div style={s.slideNavBtns}>
                    <button style={{ ...s.slideNavBtn, opacity: currentIndex === 0 ? 0.4 : 1 }}
                      onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>← Prev</button>
                    <button style={{ ...s.slideNavBtn, opacity: currentIndex === questions.length - 1 ? 0.4 : 1 }}
                      onClick={() => setCurrentIndex(p => Math.min(questions.length - 1, p + 1))} disabled={currentIndex === questions.length - 1}>Next →</button>
                  </div>
                </div>

                <div style={s.slide}>
                  <div style={s.slideTopRow}>
                    <span style={s.slideMeta}>{questions[currentIndex].isAnonymous ? "🎭 Anonymous" : "🎓 Student"}</span>
                    <span style={{ ...s.qBadge, background: questions[currentIndex].status === "ai-answered" ? "#d1fae5" : "#fef3c7", color: questions[currentIndex].status === "ai-answered" ? "#059669" : "#d97706" }}>
                      {questions[currentIndex].status === "ai-answered" ? "🤖 AI Answered" : "🧑‍🏫 Needs Teacher"}
                    </span>
                  </div>
                  <p style={s.slideQ}>{questions[currentIndex].text}</p>
                </div>

                <div style={s.qSidebar}>
                  <p style={s.qListTitle}>All Questions</p>
                  {questions.map((q, i) => (
                    <div key={q._id} style={{ ...s.qSideItem, background: i === currentIndex ? "#eef0ff" : "#fff", borderColor: i === currentIndex ? "#4f67ff" : "#e4e6ef" }}
                      onClick={() => setCurrentIndex(i)}>
                      <span style={s.qNum}>Q{i + 1}</span>
                      <p style={s.qSideText}>{q.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f5f6fa", fontFamily: "'DM Sans', sans-serif" },
  navbar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 40px", height: "64px", background: "#fff", borderBottom: "1px solid #e4e6ef", position: "sticky", top: 0, zIndex: 100 },
  navLeft: { display: "flex", alignItems: "center", gap: "20px" },
  logo: { fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 700, color: "#1a1f36" },
  codePill: { background: "#eef0ff", border: "1px solid #c7d0ff", borderRadius: "6px", padding: "6px 14px", fontSize: "13px", color: "#4f67ff" },
  navRight: { display: "flex", alignItems: "center", gap: "12px" },
  statusPill: { borderRadius: "6px", padding: "6px 12px", fontSize: "12px", fontWeight: 700 },
  userBadge: { width: "34px", height: "34px", borderRadius: "50%", background: "#1a1f36", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "14px" },
  logoutBtn: { background: "transparent", border: "1px solid #e4e6ef", color: "#6b7280", padding: "7px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "13px" },
  content: { padding: "40px" },
  welcomeWrap: { maxWidth: "900px", margin: "0 auto" },
  welcomeCard: { background: "#fff", border: "1px solid #e4e6ef", borderRadius: "16px", padding: "48px", textAlign: "center", marginBottom: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" },
  welcomeIcon: { fontSize: "48px", marginBottom: "16px" },
  welcomeTitle: { fontFamily: "'Playfair Display', serif", fontSize: "28px", fontWeight: 700, color: "#1a1f36", marginBottom: "8px" },
  welcomeSub: { color: "#6b7280", fontSize: "15px", marginBottom: "32px" },
  primaryBtn: { background: "#1a1f36", color: "#fff", border: "none", borderRadius: "8px", padding: "14px 32px", fontSize: "15px", fontWeight: 600, cursor: "pointer" },
  infoGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" },
  infoCard: { background: "#fff", border: "1px solid #e4e6ef", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" },
  infoIcon: { fontSize: "28px", display: "block", marginBottom: "12px" },
  infoTitle: { fontWeight: 600, fontSize: "14px", color: "#1a1f36", marginBottom: "6px" },
  infoDesc: { color: "#6b7280", fontSize: "13px", lineHeight: "1.6" },
  sessionWrap: { maxWidth: "900px", margin: "0 auto" },
  controlBar: { background: "#fff", border: "1px solid #e4e6ef", borderRadius: "12px", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
  controlLeft: {},
  controlLabel: { fontWeight: 600, fontSize: "14px", color: "#1a1f36" },
  controlBtns: { display: "flex", gap: "10px" },
  ctrlBtn: { border: "none", borderRadius: "6px", padding: "10px 20px", fontSize: "13px", fontWeight: 600, cursor: "pointer", color: "#fff" },
  startBtn: { background: "#059669" },
  pauseBtn: { background: "#d97706" },
  endBtn: { background: "#dc2626" },
  summaryWrap: { background: "#fff", border: "1px solid #e4e6ef", borderRadius: "16px", padding: "40px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" },
  sectionTitle: { fontFamily: "'Playfair Display', serif", fontSize: "24px", fontWeight: 700, color: "#1a1f36", marginBottom: "24px" },
  statsRow: { display: "flex", gap: "16px", marginBottom: "24px" },
  statCard: { flex: 1, background: "#f5f6fa", border: "1px solid #e4e6ef", borderRadius: "10px", padding: "20px", textAlign: "center" },
  statValue: { fontFamily: "'Playfair Display', serif", fontSize: "28px", fontWeight: 700, color: "#1a1f36", marginBottom: "4px" },
  statLabel: { color: "#6b7280", fontSize: "12px" },
  moodCard: { background: "#eef0ff", border: "1px solid #c7d0ff", borderRadius: "10px", padding: "20px", marginBottom: "24px" },
  moodLabel: { color: "#4f67ff", fontSize: "12px", fontWeight: 600, marginBottom: "6px" },
  moodValue: { color: "#1a1f36", fontSize: "16px", fontWeight: 600 },
  qList: { marginBottom: "24px" },
  qListTitle: { fontWeight: 600, fontSize: "14px", color: "#1a1f36", marginBottom: "12px" },
  qItem: { background: "#f5f6fa", border: "1px solid #e4e6ef", borderRadius: "8px", padding: "14px 16px", marginBottom: "8px" },
  qMeta: { display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" },
  qNum: { background: "#1a1f36", color: "#fff", borderRadius: "4px", padding: "2px 8px", fontSize: "11px", fontWeight: 700 },
  qBadge: { borderRadius: "4px", padding: "2px 8px", fontSize: "11px", fontWeight: 600 },
  anonBadge: { background: "#f3f4f6", color: "#6b7280", borderRadius: "4px", padding: "2px 8px", fontSize: "11px" },
  qText: { color: "#1a1f36", fontSize: "14px", lineHeight: "1.5" },
  waitingWrap: { display: "flex", justifyContent: "center", paddingTop: "60px" },
  waitingCard: { background: "#fff", border: "1px solid #e4e6ef", borderRadius: "16px", padding: "60px 48px", textAlign: "center", maxWidth: "480px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" },
  waitingIcon: { fontSize: "56px", marginBottom: "20px" },
  waitingTitle: { fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: 700, color: "#1a1f36", marginBottom: "8px" },
  waitingSub: { color: "#6b7280", fontSize: "14px" },
  slideWrap: {},
  slideTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  slideCounter: { color: "#6b7280", fontSize: "13px", fontWeight: 600 },
  slideNavBtns: { display: "flex", gap: "8px" },
  slideNavBtn: { background: "#fff", border: "1px solid #e4e6ef", color: "#1a1f36", borderRadius: "6px", padding: "8px 20px", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
  slide: { background: "#fff", border: "1px solid #e4e6ef", borderRadius: "16px", padding: "48px", minHeight: "200px", display: "flex", flexDirection: "column", justifyContent: "center", marginBottom: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" },
  slideTopRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  slideMeta: { color: "#6b7280", fontSize: "13px" },
  slideQ: { fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: 600, color: "#1a1f36", lineHeight: "1.6" },
  qSidebar: { background: "#fff", border: "1px solid #e4e6ef", borderRadius: "12px", padding: "20px" },
  qSideItem: { border: "1px solid", borderRadius: "8px", padding: "12px 14px", marginBottom: "8px", cursor: "pointer", display: "flex", gap: "10px", alignItems: "flex-start" },
  qSideText: { fontSize: "13px", color: "#1a1f36", lineHeight: "1.4" },
};