import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      if (res.data.user.role === "teacher") navigate("/teacher/dashboard");
      else navigate("/student/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.left}>
        <div style={s.brand}>
          <div style={s.logo}>Vi-SlideS</div>
          <p style={s.tagline}>Join thousands of teachers and students using AI-powered adaptive learning.</p>
          <div style={s.features}>
            {["Question-driven classrooms", "Instant AI answers", "Anonymous submissions", "Real-time insights"].map(f => (
              <div key={f} style={s.feature}>
                <span style={s.featureDot}>✦</span> {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={s.right}>
        <div style={s.card}>
          <h1 style={s.title}>Create account</h1>
          <p style={s.sub}>Get started with Vi-SlideS today</p>

          <form onSubmit={handleSubmit} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>Full name</label>
              <input style={s.input} type="text" placeholder="Your full name"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div style={s.field}>
              <label style={s.label}>Email address</label>
              <input style={s.input} type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div style={s.field}>
              <label style={s.label}>Password</label>
              <input style={s.input} type="password" placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>

            <div style={s.field}>
              <label style={s.label}>I am a</label>
              <div style={s.roleRow}>
                {["student", "teacher"].map(r => (
                  <button key={r} type="button"
                    onClick={() => setForm({ ...form, role: r })}
                    style={{
                      ...s.roleBtn,
                      background: form.role === r ? "#1a1f36" : "#f5f6fa",
                      color: form.role === r ? "#fff" : "#6b7280",
                      border: `1.5px solid ${form.role === r ? "#1a1f36" : "#e4e6ef"}`,
                    }}>
                    {r === "student" ? "🎓 Student" : "👨‍🏫 Teacher"}
                  </button>
                ))}
              </div>
            </div>

            {error && <div style={s.error}>{error}</div>}

            <button style={s.btn} type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Create account →"}
            </button>
          </form>

          <p style={s.link}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#4f67ff", fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", display: "flex" },
  left: { flex: 1, background: "#1a1f36", display: "flex", alignItems: "center", justifyContent: "center", padding: "60px" },
  brand: { maxWidth: "400px" },
  logo: { fontFamily: "'Playfair Display', serif", fontSize: "32px", fontWeight: 700, color: "#ffffff", marginBottom: "20px" },
  tagline: { color: "#9ca3c8", fontSize: "16px", lineHeight: "1.7", marginBottom: "40px" },
  features: { display: "flex", flexDirection: "column", gap: "14px" },
  feature: { color: "#c8cde8", fontSize: "14px", display: "flex", alignItems: "center", gap: "10px" },
  featureDot: { color: "#4f67ff", fontSize: "12px" },
  right: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", background: "#f5f6fa" },
  card: { background: "#ffffff", borderRadius: "16px", padding: "48px", width: "100%", maxWidth: "420px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid #e4e6ef" },
  title: { fontFamily: "'Playfair Display', serif", fontSize: "28px", fontWeight: 700, marginBottom: "8px", color: "#1a1f36" },
  sub: { color: "#6b7280", fontSize: "14px", marginBottom: "32px" },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: 600, color: "#1a1f36" },
  input: { background: "#f5f6fa", border: "1.5px solid #e4e6ef", borderRadius: "8px", padding: "12px 14px", color: "#1a1f36", fontSize: "14px", outline: "none" },
  roleRow: { display: "flex", gap: "12px" },
  roleBtn: { flex: 1, padding: "12px", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer" },
  btn: { background: "#1a1f36", color: "#fff", border: "none", borderRadius: "8px", padding: "14px", fontSize: "15px", fontWeight: 600, cursor: "pointer", marginTop: "4px" },
  error: { background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px", color: "#dc2626", fontSize: "13px" },
  link: { color: "#6b7280", marginTop: "24px", textAlign: "center", fontSize: "13px" },
};