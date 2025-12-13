/**
 * demoattendee — src/app/login/page.tsx
 *
 * Brief: Login page component for administrators.
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Login page UI and submit handler. */
export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to dashboard
        router.push("/");
        router.refresh();
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          {!logoError ? (
            <img
              src="/assets/logo.png"
              alt="VolunteerGelp"
              className="login-logo"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="login-logo-fallback" aria-hidden>
              <svg width="140" height="54" viewBox="0 0 280 108" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="VolunteerGelp logo">
                <rect rx="12" width="280" height="108" fill="rgba(255,255,255,0.02)"/>
                <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="white" fontFamily="Inter, system-ui, -apple-system, 'Segoe UI', Roboto" fontWeight="700" fontSize="28">VolunteerGelp</text>
              </svg>
            </div>
          )}
          <p className="muted">Admin Login</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="message error" style={{ marginBottom: "1rem" }}>
              {error}
            </div>
          )}

          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              autoFocus
              disabled={loading}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              disabled={loading}
            />
          </label>

          <button type="submit" disabled={loading} className="login-button">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
