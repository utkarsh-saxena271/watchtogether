"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/src/hooks/useAuth";
import { apiLogin, ApiError } from "@/src/lib/api";
import { Input } from "@/src/components/ui/Input";
import { Button } from "@/src/components/ui/Button";

function LoginForm() {
  const { user, loading, setUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedNext = searchParams.get("next");
  const next =
    requestedNext?.startsWith("/") &&
    !requestedNext.startsWith("//") &&
    !requestedNext.includes("\\")
      ? requestedNext
      : "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace(next);
    }
  }, [loading, user, next, router]);

  if (loading || user) return null;

  function validate() {
    let ok = true;
    setEmailError("");
    setPasswordError("");
    setFormError("");
    if (!email.trim()) {
      setEmailError("Email is required.");
      ok = false;
    }
    if (!password) {
      setPasswordError("Password is required.");
      ok = false;
    }
    return ok;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await apiLogin(email.trim(), password);
      setUser(res.data);
      router.push(next);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setFormError("Wrong email or password.");
        } else {
          setFormError(err.message);
        }
      } else {
        setFormError("Something went wrong.");
      }
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      style={{ display: "flex", flexDirection: "column", gap: "20px" }}
    >
      <Input
        label="Email"
        id="login-email"
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
        id="login-password"
        type="password"
        autoComplete="current-password"
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
        id="login-submit"
        type="submit"
        variant="primary"
        disabled={submitting}
        style={{ width: "100%", marginTop: "4px" }}
      >
        {submitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
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
          Sign in
        </h1>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>

        <p
          style={{
            fontSize: "13px",
            color: "var(--muted)",
            marginTop: "24px",
          }}
        >
          No account?{" "}
          <Link
            href="/signup"
            style={{
              color: "var(--text)",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
