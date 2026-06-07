"use client";

import { useCallback, useState } from "react";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

function CopyIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function CopyIconButton({
  text,
  label = "نسخ",
  className = "",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");

  const onCopy = useCallback(async () => {
    const ok = await copyText(text);
    setState(ok ? "ok" : "fail");
    window.setTimeout(() => setState("idle"), 2000);
  }, [text]);

  const title =
    state === "ok" ? "تم النسخ" : state === "fail" ? "تعذر النسخ" : label;

  return (
    <button
      type="button"
      className={`tbl-copy-btn${className ? ` ${className}` : ""}`}
      onClick={() => void onCopy()}
      title={title}
      aria-label={title}
    >
      <CopyIcon />
    </button>
  );
}
