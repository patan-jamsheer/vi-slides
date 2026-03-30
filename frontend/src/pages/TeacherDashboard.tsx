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

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const createSession = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/session/create",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const sid = res.data.session._id;
      const code = res.data.session.code;
      setSessionCode(code);
      setSessionId(sid);
      setSessionStatus("waiting");
      socket.emit("join-room", sid);
    } catch (error) {
      alert("Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/session/${sessionId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSessionStatus(status);

      // Fetch summary when session ends
      if (status === "ended") {
        const res = await axios.get(
          `http://localhost:5000/api/session/${sessionId}/summary`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSummary(res.data);
      }
    } catch (error) {
      alert("Failed to update session status");
    }
  };

  useEffect(() => {
    socket.on("new-question", (question: Question) => {
      setQuestions(prev => [...prev, question]);
    });
    return () => { socket.off("new-question"); };
  }, []);

  const getStatusColor = () => {
    if (sessionStatus === "active") return "#4caf50";
    if (sessionStatus === "paused") return "#ff9800";
    if (sessionStatus === "ended") return "#ff6584";
    return "#888899";
  };

  return (
    <div style={styles.page}>
      <div style={styles.navbar}>
        <span style={styles.logo}>Vi-SlideS</span>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {sessionCode && (
            <>
              <div style={styles.codeBadge}>
                Code: <strong style={{ color: "#6c63ff" }}>{sessionCode}</strong>
              </div>
              <div style={{ ...styles.statusBadge, color: getStatusColor(), borderColor: getStatusColor() }}>
                ● {sessionStatus.toUpperCase()}
              </div>
            </>
          )}
          <button style={styles.logout} onClick={logout}>Logout</button>
        </div>
      </div>

      <div style={styles.content}>
        {!sessionCode ? (
          <>
            <h1 style={styles.title}>Welcome, {user.name} 👨‍🏫</h1>
            <p style={styles.sub}>Start a session and share the code with your students</p>
            <button style={styles.btn} onClick={createSession} disabled={loading}>
              {loading ? "Creating..." : "Create Session"}
            </button>
          </>
        ) : (
          <>
            {/* Session Controls */}
            <div style={styles.controls}>
              <button
                style={{ ...styles.controlBtn, background: "#4caf50", opacity: sessionStatus === "active" ? 0.4 : 1 }}
                onClick={() => updateStatus("active")}
                disabled={sessionStatus === "active" || sessionStatus === "ended"}
              >▶ Start</button>
              <button
                style={{ ...styles.controlBtn, background: "#ff9800", opacity: sessionStatus === "paused" ? 0.4 : 1 }}
                onClick={() => updateStatus("paused")}
                disabled={sessionStatus !== "active"}
              >⏸ Pause</button>
              <button
                style={{ ...styles.controlBtn, background: "#ff6584", opacity: sessionStatus === "ended" ? 0.4 : 1 }}
                onClick={() => updateStatus("ended")}
                disabled={sessionStatus === "ended"}
              >⏹ End</button>
            </div>

            {/* Summary View */}
            {sessionStatus === "ended" && summary ? (
              <div style={styles.summaryCard}>
                <h2 style={styles.summaryTitle}>📊 Session Summary</h2>

                <div style={styles.summaryGrid}>
                  <div style={styles.summaryItem}>
                    <p style={styles.summaryValue}>{sessionCode}</p>
                    <p style={styles.summaryLabel}>Session Code</p>
                  </div>
                  <div style={styles.summaryItem}>
                    <p style={styles.summaryValue}>{summary.totalQuestions}</p>
                    <p style={styles.summaryLabel}>Total Questions</p>
                  </div>
                  <div style={styles.summaryItem}>
                    <p style={styles.summaryValue}>{summary.durationMinutes}m</p>
                    <p style={styles.summaryLabel}>Duration</p>
                  </div>
                </div>

                <div style={styles.moodBox}>
                  <p style={styles.moodLabel}>Class Mood</p>
                  <p style={styles.moodValue}>{summary.mood}</p>
                </div>

                {summary.questions.length > 0 && (
                  <div style={styles.questionList}>
                    <p style={styles.listTitle}>All Questions</p>
                    {summary.questions.map((q, i) => (
                      <div key={q._id} style={styles.questionItem}>
                        <span style={{ color: "#888899", fontSize: "12px" }}>Q{i + 1} {q.isAnonymous ? "🎭" : "🎓"}</span>
                        <p style={styles.questionItemText}>{q.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                <button style={styles.btn} onClick={() => {
                  setSessionCode("");
                  setSessionId("");
                  setSessionStatus("waiting");
                  setQuestions([]);
                  setSummary(null);
                }}>
                  Start New Session
                </button>
              </div>
            ) : questions.length === 0 ? (
              <div style={styles.waiting}>
                <div style={styles.waitingIcon}>⏳</div>
                <h2 style={styles.waitingText}>Waiting for questions...</h2>
                <p style={styles.sub}>Share code <strong style={{ color: "#6c63ff" }}>{sessionCode}</strong> with students</p>
              </div>
            ) : (
              <div style={styles.slideContainer}>
                <div style={styles.slideNav}>
                  <p style={styles.slideCount}>Question {currentIndex + 1} of {questions.length}</p>
                </div>

                <div style={styles.slide}>
                  <div style={styles.slideHeader}>
                    {questions[currentIndex].isAnonymous ? "🎭 Anonymous" : "🎓 Student"}
                  </div>
                  <p style={styles.slideQuestion}>{questions[currentIndex].text}</p>
                  <div style={styles.slideStatus}>
                    Status: <span style={{ color: "#6c63ff" }}>{questions[currentIndex].status}</span>
                  </div>
                </div>

                <div style={styles.navBtns}>
                  <button
                    style={{ ...styles.navBtn, opacity: currentIndex === 0 ? 0.4 : 1 }}
                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                  >← Prev</button>
                  <button
                    style={{ ...styles.navBtn, opacity: currentIndex === questions.length - 1 ? 0.4 : 1 }}
                    onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    disabled={currentIndex === questions.length - 1}
                  >Next →</button>
                </div>

                <div style={styles.questionList}>
                  <p style={styles.listTitle}>All Questions ({questions.length})</p>
                  {questions.map((q, i) => (
                    <div
                      key={q._id}
                      style={{ ...styles.questionItem, border: `1px solid ${i === currentIndex ? "#6c63ff" : "#2a2a3a"}` }}
                      onClick={() => setCurrentIndex(i)}
                    >
                      <span style={{ color: "#888899", fontSize: "12px" }}>Q{i + 1}</span>
                      <p style={styles.questionItemText}>{q.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#0a0a0f" },
  navbar: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", padding: "20px 40px",
    borderBottom: "1px solid #2a2a3a",
  },
  logo: { fontFamily: "'Syne', sans-serif", fontSize: "22px", fontWeight: 800, color: "#6c63ff" },
  codeBadge: {
    background: "#13131a", border: "1px solid #2a2a3a",
    borderRadius: "8px", padding: "8px 16px", fontSize: "14px", color: "#f0f0f5",
  },
  statusBadge: {
    border: "1px solid", borderRadius: "8px",
    padding: "8px 16px", fontSize: "12px", fontWeight: 700,
  },
  logout: {
    background: "transparent", border: "1px solid #2a2a3a",
    color: "#888899", padding: "8px 20px", borderRadius: "8px", cursor: "pointer",
  },
  content: { padding: "40px", display: "flex", flexDirection: "column", alignItems: "center" },
  title: { fontFamily: "'Syne', sans-serif", fontSize: "36px", fontWeight: 800, marginBottom: "12px" },
  sub: { color: "#888899", fontSize: "15px", marginBottom: "32px" },
  btn: {
    background: "#6c63ff", color: "#fff", border: "none",
    borderRadius: "12px", padding: "16px 40px",
    fontSize: "16px", fontWeight: 600, cursor: "pointer",
  },
  controls: { display: "flex", gap: "12px", marginBottom: "40px" },
  controlBtn: {
    color: "#fff", border: "none", borderRadius: "10px",
    padding: "12px 28px", fontSize: "15px", fontWeight: 600, cursor: "pointer",
  },
  summaryCard: {
    background: "#13131a", border: "1px solid #2a2a3a",
    borderRadius: "20px", padding: "48px 40px",
    width: "100%", maxWidth: "600px", textAlign: "center",
  },
  summaryTitle: { fontFamily: "'Syne', sans-serif", fontSize: "28px", fontWeight: 800, marginBottom: "32px" },
  summaryGrid: { display: "flex", gap: "16px", justifyContent: "center", marginBottom: "32px" },
  summaryItem: {
    background: "#0a0a0f", border: "1px solid #2a2a3a",
    borderRadius: "12px", padding: "20px 28px",
  },
  summaryValue: { fontFamily: "'Syne', sans-serif", fontSize: "28px", fontWeight: 800, color: "#6c63ff" },
  summaryLabel: { color: "#888899", fontSize: "12px", marginTop: "4px" },
  moodBox: {
    background: "#0a0a0f", border: "1px solid #6c63ff",
    borderRadius: "12px", padding: "24px",
    marginBottom: "32px",
  },
  moodLabel: { color: "#888899", fontSize: "12px", marginBottom: "8px" },
  moodValue: { fontFamily: "'Syne', sans-serif", fontSize: "20px", fontWeight: 700 },
  waiting: { textAlign: "center", marginTop: "40px" },
  waitingIcon: { fontSize: "64px", marginBottom: "24px" },
  waitingText: { fontFamily: "'Syne', sans-serif", fontSize: "28px", fontWeight: 700, marginBottom: "12px" },
  slideContainer: { width: "100%", maxWidth: "700px" },
  slideNav: { textAlign: "center", marginBottom: "16px" },
  slideCount: { color: "#888899", fontSize: "14px" },
  slide: {
    background: "#13131a", border: "1px solid #6c63ff",
    borderRadius: "20px", padding: "48px", textAlign: "center",
    marginBottom: "24px", minHeight: "220px",
    display: "flex", flexDirection: "column", justifyContent: "center",
  },
  slideHeader: { color: "#888899", fontSize: "13px", marginBottom: "20px" },
  slideQuestion: { fontFamily: "'Syne', sans-serif", fontSize: "24px", fontWeight: 700, lineHeight: "1.5", marginBottom: "20px" },
  slideStatus: { color: "#888899", fontSize: "13px" },
  navBtns: { display: "flex", gap: "16px", justifyContent: "center", marginBottom: "40px" },
  navBtn: {
    background: "#13131a", color: "#f0f0f5",
    border: "1px solid #2a2a3a", borderRadius: "10px",
    padding: "12px 32px", fontSize: "15px", cursor: "pointer",
  },
  questionList: { width: "100%", textAlign: "left" },
  listTitle: { color: "#888899", fontSize: "13px", marginBottom: "12px" },
  questionItem: {
    background: "#13131a", border: "1px solid #2a2a3a",
    borderRadius: "10px", padding: "14px 16px",
    marginBottom: "8px", cursor: "pointer",
  },
  questionItemText: { fontSize: "14px", color: "#f0f0f5", marginTop: "4px" },
};