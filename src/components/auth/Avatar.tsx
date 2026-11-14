"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  name?: string | null;
  photoURL?: string | null;
  className?: string;
  /** Tailwind text size for the fallback initial. */
  textClassName?: string;
}

/** First letter of a name/email, used as the gradient fallback avatar. */
function initial(name?: string | null): string {
  const c = name?.trim()?.[0];
  return c ? c.toUpperCase() : "?";
}

/**
 * User avatar: shows the account photo when available, otherwise a gradient
 * tile with the user's initial — matching the existing Account/Settings style.
 */
export function Avatar({ name, photoURL, className, textClassName }: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const showImage = photoURL && !errored;

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl",
        !showImage && "accent-gradient font-bold text-black/80",
        className
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoURL}
          alt={name ?? "Profile"}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setErrored(true)}
        />
      ) : (
        <span className={textClassName}>{initial(name)}</span>
      )}
    </div>
  );
}
