"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/src/hooks/useAuth";
import { apiSignup, ApiError } from "@/src/lib/api";
import { Input } from "@/src/components/ui/Input";
import { Button } from "@/src/components/ui/Button";

export default function SignupPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  if (loading || user) return null;

  function validate() {
    let ok = true;
    setUsernameError("");
    setEmailError("");
    setPasswordError("");
    setFormError("");
    if (!username.trim()) {
      setUsernameError("Username is required.");
      ok = false;
    }
    if (!email.trim()) {
      setEmailError("Email is required.");
      ok = false;
    }
    if (!password || password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      ok = false;
    }
    return ok;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await apiSignup(username.trim(), email.trim(), password);
      router.push("/login");
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError("Something went wrong.");
      }
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "360px" }}>
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-instrument-serif)",
            fontSize: "18px",
            letterSpacing: "-0.02em",
            color: "var(--text)",
            textDecoration: "none",
            display: "block",
            marginBottom: "40px",
          }}
        >
          watchtogether
        </Link>

        <h1
          style={{
            fontFamily: "var(--font-instrument-serif)",
            fontSize: "clamp(1.6rem, 4vw, 2rem)",
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            color: "var(--text)",
            marginBottom: "32px",
          }}
        >
          Create an account
        </h1>

        <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <Input
            label="Username"
            id="signup-username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (usernameError) setUsernameError("");
              if (formError) setFormError("");
            }}
            error={usernameError}
          />
          <Input
            label="Email"
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError("");
              if (formError) setFormError("");
            }}
            error={emailError}
          />
          <Input
            label="Password"
            id="signup-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError("");
              if (formError) setFormError("");
            }}
            error={passwordError}
          />

          {formError && (
            <p role="alert" style={{ fontSize: "13px", color: "var(--danger)", margin: 0 }}>
              {formError}
            </p>
          )}

          <Button
            id="signup-submit"
            type="submit"
            variant="primary"
            disabled={submitting}
            style={{ width: "100%", marginTop: "4px" }}
          >
            {submitting ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p
          style={{
            fontSize: "13px",
            color: "var(--muted)",
            marginTop: "24px",
          }}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            style={{ color: "var(--text)", textDecoration: "underline", textUnderlineOffset: "3px" }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
