import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      if (res.data.user.role === "teacher") navigate("/teacher/dashboard");
      else navigate("/student/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>Vi-SlideS</div>
        <p style={styles.sub}>Welcome back 👋</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login →"}
          </button>
        </form>

        <p style={styles.link}>
          No account?{" "}
          <Link to="/register" style={{ color: "#6c63ff" }}>Register here</Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh", display: "flex",
    alignItems: "center", justifyContent: "center",
    background: "linear-gradient(135deg, #0a0a0f 0%, #13131a 100%)",
  },
  card: {
    background: "#13131a", border: "1px solid #2a2a3a",
    borderRadius: "20px", padding: "48px 40px",
    width: "100%", maxWidth: "400px",
    boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
  },
  logo: {
    fontFamily: "'Syne', sans-serif", fontSize: "28px",
    fontWeight: 800, color: "#6c63ff", marginBottom: "8px",
  },
  sub: { color: "#888899", marginBottom: "32px", fontSize: "15px" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  input: {
    background: "#0a0a0f", border: "1px solid #2a2a3a",
    borderRadius: "10px", padding: "14px 16px",
    color: "#f0f0f5", fontSize: "15px", outline: "none",
  },
  btn: {
    background: "#6c63ff", color: "#fff",
    border: "none", borderRadius: "10px",
    padding: "14px", fontSize: "16px",
    fontWeight: 600, cursor: "pointer", marginTop: "8px",
  },
  error: { color: "#ff6584", fontSize: "14px" },
  link: { color: "#888899", marginTop: "24px", textAlign: "center", fontSize: "14px" },
};