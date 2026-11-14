"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  Github,
  Mail,
  Lock,
  User as UserIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { useAuthStore } from "@/store/useAuthStore";
import { isFirebaseConfigured } from "@/services/firebase";
import {
  signInWithGoogle,
  signInWithGithub,
  signInWithEmail,
  signUpWithEmail,
  sendPasswordReset,
  authErrorMessage,
} from "@/services/auth";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup" | "reset";
/** Which action is currently in-flight (for granular loading states). */
type Pending = null | "google" | "github" | "email";

/** Inline Google "G" mark (lucide has no brand glyph). */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

/**
 * Full-screen authentication gate. Mirrors the BootScreen aesthetic (radial
 * accent backdrop, gradient wordmark) and uses the shared glass UI primitives.
 *
 * Supports Google, GitHub and email/password sign-in & sign-up, password reset,
 * "remember me" persistence, and an explicit offline-guest path. All actions
 * are real Firebase calls — there is no mock authentication.
 */
export function AuthScreen() {
  const remember = useAuthStore((s) => s.remember);
  const setRemember = useAuthStore((s) => s.setRemember);
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);

  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState<Pending>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const busy = pending !== null;
  const disabled = !isFirebaseConfigured || busy;

  function resetFeedback() {
    setError(null);
    setNotice(null);
  }

  async function runProvider(
    which: Exclude<Pending, null | "email">,
    fn: () => Promise<unknown>
  ) {
    resetFeedback();
    setPending(which);
    try {
      await fn();
      // On success, AuthProvider's listener flips the gate to the Desktop.
    } catch (err) {
      setError(authErrorMessage(err));
      setPending(null);
    }
  }

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    if (disabled) return;
    resetFeedback();
    setPending("email");
    try {
      if (mode === "reset") {
        await sendPasswordReset(email.trim());
        setNotice("Password reset link sent. Check your inbox.");
        setPending(null);
        return;
      }
      if (mode === "signup") {
        await signUpWithEmail(email.trim(), password, name, remember);
      } else {
        await signInWithEmail(email.trim(), password, remember);
      }
      // Success → AuthProvider transitions the gate.
    } catch (err) {
      setError(authErrorMessage(err));
      setPending(null);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    resetFeedback();
  }

  const title =
    mode === "signin"
      ? "Welcome back"
      : mode === "signup"
        ? "Create your account"
        : "Reset your password";
  const subtitle =
    mode === "signin"
      ? "Sign in to sync NEXUS across your devices"
      : mode === "signup"
        ? "Sign up to unlock cloud sync & your profile"
        : "We'll email you a secure reset link";

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center overflow-y-auto p-4">
      {/* Accent radial backdrop, matching the boot sequence. */}
      <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(60%_60%_at_50%_35%,rgb(var(--accent)/0.18),transparent_70%)]" />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="glass-strong relative z-10 w-full max-w-sm rounded-3xl p-7 shadow-glass"
      >
        {/* Brand */}
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-sm font-bold tracking-[0.3em] text-gradient">
              NEXUS
            </span>
          </div>
          <h1 className="text-xl font-semibold text-text">{title}</h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        </div>

        {!isFirebaseConfigured && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Firebase isn&apos;t configured. Add your keys to{" "}
              <code>.env.local</code> to enable sign-in, or continue offline.
            </span>
          </div>
        )}

        {/* OAuth providers (hidden in reset mode) */}
        {mode !== "reset" && (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                variant="secondary"
                onClick={() => runProvider("google", () => signInWithGoogle(remember))}
                disabled={disabled}
              >
                {pending === "google" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <GoogleIcon className="h-4 w-4" />
                )}
                Google
              </Button>
              <Button
                variant="secondary"
                onClick={() => runProvider("github", () => signInWithGithub(remember))}
                disabled={disabled}
              >
                {pending === "github" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Github className="h-4 w-4" />
                )}
                GitHub
              </Button>
            </div>

            <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted/70">
              <span className="h-px flex-1 bg-border/10" />
              or
              <span className="h-px flex-1 bg-border/10" />
            </div>
          </>
        )}

        {/* Email / password form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          {mode === "signup" && (
            <Field icon={UserIcon}>
              <Input
                type="text"
                placeholder="Display name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                disabled={disabled}
                className="pl-9"
              />
            </Field>
          )}

          <Field icon={Mail}>
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={disabled}
              className="pl-9"
            />
          </Field>

          {mode !== "reset" && (
            <Field icon={Lock}>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                minLength={6}
                disabled={disabled}
                className="pl-9"
              />
            </Field>
          )}

          {/* Remember me + forgot password */}
          {mode === "signin" && (
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
                <Switch
                  checked={remember}
                  onCheckedChange={setRemember}
                  aria-label="Remember me"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => switchMode("reset")}
                className="text-xs text-accent transition-colors hover:brightness-125"
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Feedback */}
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {notice && (
            <div className="flex items-start gap-2 rounded-xl border border-success/30 bg-success/10 p-3 text-xs text-success">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={disabled}
          >
            {pending === "email" && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signin"
              ? "Sign in"
              : mode === "signup"
                ? "Create account"
                : "Send reset link"}
          </Button>
        </form>

        {/* Mode switches */}
        <div className="mt-5 text-center text-xs text-muted">
          {mode === "signin" && (
            <>
              Don&apos;t have an account?{" "}
              <button
                onClick={() => switchMode("signup")}
                className="font-medium text-accent transition-colors hover:brightness-125"
              >
                Sign up
              </button>
            </>
          )}
          {mode === "signup" && (
            <>
              Already have an account?{" "}
              <button
                onClick={() => switchMode("signin")}
                className="font-medium text-accent transition-colors hover:brightness-125"
              >
                Sign in
              </button>
            </>
          )}
          {mode === "reset" && (
            <button
              onClick={() => switchMode("signin")}
              className="inline-flex items-center gap-1 font-medium text-accent transition-colors hover:brightness-125"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to sign in
            </button>
          )}
        </div>

        {/* Offline guest path */}
        <div className="mt-6 border-t border-border/10 pt-5">
          <Button
            variant="ghost"
            className="w-full text-muted"
            onClick={continueAsGuest}
            disabled={busy}
          >
            <WifiOff className="h-4 w-4" />
            Continue offline
          </Button>
          <p className="mt-2 text-center text-[11px] text-muted/70">
            Guest mode keeps everything on this device — no cloud sync.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

/** Input wrapper that overlays a leading icon. */
function Field({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <Icon
        className={cn(
          "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/70"
        )}
      />
      {children}
    </div>
  );
}
