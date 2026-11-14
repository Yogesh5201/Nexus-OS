"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, LogIn, LogOut } from "lucide-react";
import { Avatar } from "@/components/auth/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/store/useAuthStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import {
  updateProfile,
  uploadAvatar,
  signOut,
  authErrorMessage,
} from "@/services/auth";
import { getUserDisplayName } from "@/lib/userProfile";
import { cn } from "@/lib/utils";

const PROVIDER_LABELS: Record<string, string> = {
  "google.com": "Google",
  "github.com": "GitHub",
  password: "Email",
};

/**
 * Account settings backed by Firebase. Authenticated users can edit their
 * display name, upload a profile picture (Firebase Storage) and sign out.
 * Guests get a prompt to sign in. Local display name still works offline.
 */
export function AccountSection() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const exitGuest = useAuthStore((s) => s.exitGuest);

  const localName = useSettingsStore((s) => s.displayName);
  const setLocalName = useSettingsStore((s) => s.setDisplayName);
  const pushNotification = useNotificationStore((s) => s.push);

  const fileInput = useRef<HTMLInputElement>(null);
  const [savingName, setSavingName] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const isAuthed = status === "authenticated" && !!user;
  // Authenticated → edit the Firebase name; guest → edit the local name.
  const [name, setName] = useState(isAuthed ? user?.displayName ?? "" : localName);

  const photoURL = isAuthed ? user?.photoURL : null;
  // Show the resolved name (never a full email); the email is the sub-line below.
  const headingName = isAuthed ? getUserDisplayName(user) : localName.trim() || "Guest";

  async function saveName() {
    const trimmed = name.trim();
    if (!trimmed) return;

    if (!isAuthed) {
      setLocalName(trimmed);
      pushNotification({ title: "Display name updated", kind: "success" });
      return;
    }

    setSavingName(true);
    try {
      const updated = await updateProfile({ displayName: trimmed });
      setUser(updated);
      setLocalName(trimmed);
      pushNotification({ title: "Profile updated", kind: "success" });
    } catch (err) {
      pushNotification({
        title: "Couldn't update profile",
        message: authErrorMessage(err),
        kind: "error",
      });
    } finally {
      setSavingName(false);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      pushNotification({ title: "Please choose an image file", kind: "warning" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      pushNotification({ title: "Image must be under 5 MB", kind: "warning" });
      return;
    }

    setUploading(true);
    try {
      const updated = await uploadAvatar(file);
      setUser(updated);
      pushNotification({ title: "Profile picture updated", kind: "success" });
    } catch (err) {
      pushNotification({
        title: "Upload failed",
        message: authErrorMessage(err),
        kind: "error",
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } catch (err) {
      pushNotification({
        title: "Sign-out failed",
        message: authErrorMessage(err),
        kind: "error",
      });
      setSigningOut(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h2 className="text-xl font-semibold text-text">Account</h2>
      <p className="mb-5 text-sm text-muted">
        {isAuthed ? "Your NEXUS profile & cloud sync" : "Your NEXUS profile"}
      </p>

      {/* Identity card */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative">
          <Avatar
            name={headingName}
            photoURL={photoURL}
            className="h-14 w-14 text-xl"
          />
          {isAuthed && (
            <button
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              aria-label="Change profile picture"
              className={cn(
                "absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full",
                "accent-gradient text-black/80 shadow-glow transition-transform hover:scale-110 disabled:opacity-60"
              )}
            >
              {uploading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Camera className="h-3 w-3" />
              )}
            </button>
          )}
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-text">
            {headingName}
          </div>
          <div className="truncate text-xs text-muted">
            {isAuthed
              ? user?.email ?? "Signed in"
              : status === "guest"
                ? "Guest · local only"
                : "Local profile"}
          </div>
          {isAuthed && user && user.providers.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {user.providers.map((p) => (
                <span
                  key={p}
                  className="rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent"
                >
                  {PROVIDER_LABELS[p] ?? p}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Display name */}
      <div className="space-y-3 rounded-xl bg-glass/30 p-4">
        <div>
          <div className="text-sm font-medium text-text">Display name</div>
          <div className="text-xs text-muted">Shown across the OS</div>
        </div>
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="max-w-xs"
            placeholder="Your name"
          />
          <Button
            variant="primary"
            onClick={saveName}
            disabled={savingName || !name.trim() || name.trim() === (isAuthed ? user?.displayName : localName)}
          >
            {savingName && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </div>

      {/* Session actions */}
      <div className="mt-4">
        {isAuthed ? (
          <Button variant="danger" onClick={handleSignOut} disabled={signingOut}>
            {signingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Sign out
          </Button>
        ) : (
          <>
            <Button variant="primary" onClick={exitGuest}>
              <LogIn className="h-4 w-4" />
              Sign in to NEXUS
            </Button>
            <p className="mt-3 rounded-xl border border-border/10 bg-glass/30 p-3 text-xs text-muted">
              Sign in with Google, GitHub or email to enable cross-device cloud
              sync and a synced profile.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
