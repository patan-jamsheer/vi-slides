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

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

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
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(
        "http://localhost:5000/api/session/join",
        { code },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSessionId(res.data.session._id);
      setJoined(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to join session");
    } finally {
      setLoading(false);
    }
  };

  const submitQuestion = async () => {
    if (!question.trim()) return setQError("Please enter a question");
    setSubmitting(true);
    setQError("");
    try {
      const res = await axios.post(
        "http://localhost:5000/api/question/submit",
        { sessionId, text: question, isAnonymous },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAiAnswer(res.data.question.aiAnswer);
      setSubmitted(true);
      setQuestion("");
      setTimeout(() => {
        setSubmitted(false);
        setAiAnswer(null);
      }, 8000);
    } catch (err: any) {
      setQError(err.response?.data?.message || "Failed to submit question");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.navbar}>
        <span style={styles.logo}>Vi-SlideS</span>
        <button style={styles.logout} onClick={logout}>Logout</button>
      </div>

      <div style={styles.content}>
        <h1 style={styles.title}>Welcome, {user.name} 🎓</h1>

        {!joined ? (
          <div style={styles.card}>
            <p style={styles.cardTitle}>Enter Session Code</p>
            <p style={styles.sub}>Ask your teacher for the session code</p>
            <input
              style={styles.input}
              type="text"
              placeholder="e.g. ABC123"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
            {error && <p style={styles.error}>{error}</p>}
            <button style={styles.btn} onClick={joinSession} disabled={loading}>
              {loading ? "Joining..." : "Join Session →"}
            </button>
          </div>
        ) : (
          <div style={styles.card}>
            <p style={styles.cardTitle}>Ask a Question 💬</p>
            <p style={styles.sub}>
              Session: <span style={{ color: "#6c63ff", fontWeight: 700 }}>{code}</span>
            </p>

            <textarea
              style={styles.textarea}
              placeholder="Type your question here..."
              value={question}
              onChange={e => setQuestion(e.target.value)}
              rows={4}
            />

            <div style={styles.toggleRow}>
              <span style={{ color: "#888899", fontSize: "14px" }}>Submit anonymously</span>
              <div
                style={{ ...styles.toggle, background: isAnonymous ? "#6c63ff" : "#2a2a3a" }}
                onClick={() => setIsAnonymous(!isAnonymous)}
              >
                <div style={{
                  ...styles.toggleDot,
                  transform: isAnonymous ? "translateX(20px)" : "translateX(0px)",
                }} />
              </div>
            </div>

            {qError && <p style={styles.error}>{qError}</p>}

            {submitted && (
              <div style={styles.answerBox}>
                <p style={{ color: "#4caf50", fontSize: "14px", marginBottom: "8px" }}>
                  ✅ Question submitted!
                </p>
                {aiAnswer ? (
                  <div style={styles.aiAnswer}>
                    <p style={styles.aiLabel}>🤖 AI Answer:</p>
                    <p style={styles.aiText}>{aiAnswer}</p>
                  </div>
                ) : (
                  <p style={{ color: "#ff9800", fontSize: "13px" }}>
                    🧑‍🏫 Your question needs teacher attention
                  </p>
                )}
              </div>
            )}

            <button style={styles.btn} onClick={submitQuestion} disabled={submitting}>
              {submitting ? "Analysing question..." : "Submit Question →"}
            </button>
          </div>
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
  logout: {
    background: "transparent", border: "1px solid #2a2a3a",
    color: "#888899", padding: "8px 20px", borderRadius: "8px", cursor: "pointer",
  },
  content: { padding: "60px 40px", display: "flex", flexDirection: "column", alignItems: "center" },
  title: { fontFamily: "'Syne', sans-serif", fontSize: "36px", fontWeight: 800, marginBottom: "40px" },
  card: {
    background: "#13131a", border: "1px solid #2a2a3a",
    borderRadius: "20px", padding: "48px 40px",
    width: "100%", maxWidth: "480px", textAlign: "center",
  },
  cardTitle: { fontFamily: "'Syne', sans-serif", fontSize: "22px", fontWeight: 700, marginBottom: "8px" },
  sub: { color: "#888899", fontSize: "14px", marginBottom: "24px" },
  input: {
    width: "100%", background: "#0a0a0f",
    border: "1px solid #2a2a3a", borderRadius: "10px",
    padding: "14px 16px", color: "#f0f0f5",
    fontSize: "24px", fontWeight: 700, textAlign: "center",
    letterSpacing: "6px", outline: "none", marginBottom: "16px",
  },
  textarea: {
    width: "100%", background: "#0a0a0f",
    border: "1px solid #2a2a3a", borderRadius: "10px",
    padding: "14px 16px", color: "#f0f0f5",
    fontSize: "15px", outline: "none",
    marginBottom: "16px", resize: "none",
  },
  toggleRow: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: "20px",
  },
  toggle: {
    width: "44px", height: "24px", borderRadius: "12px",
    cursor: "pointer", position: "relative", transition: "background 0.3s",
  },
  toggleDot: {
    width: "18px", height: "18px", background: "#fff",
    borderRadius: "50%", position: "absolute",
    top: "3px", left: "3px", transition: "transform 0.3s",
  },
  btn: {
    width: "100%", background: "#6c63ff", color: "#fff",
    border: "none", borderRadius: "10px", padding: "14px",
    fontSize: "16px", fontWeight: 600, cursor: "pointer",
  },
  error: { color: "#ff6584", fontSize: "14px", marginBottom: "12px" },
  answerBox: {
    background: "#0a0a0f", border: "1px solid #2a2a3a",
    borderRadius: "10px", padding: "16px", marginBottom: "12px",
    textAlign: "left",
  },
  aiAnswer: { marginTop: "8px" },
  aiLabel: { color: "#6c63ff", fontSize: "13px", fontWeight: 700, marginBottom: "4px" },
  aiText: { color: "#f0f0f5", fontSize: "14px", lineHeight: "1.6" },
};