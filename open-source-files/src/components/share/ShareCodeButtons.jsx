import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";

export default function ShareCodeButtons({ code, className = "" }) {
  const [copied, setCopied] = useState(false);
  const link = window.location.origin + "/d/" + encodeURIComponent(code);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this ShareCode link", link);
    }
  }

  async function shareLink() {
    if (navigator.share) {
      await navigator.share({ title: "ShareCode link", text: "Use this code: " + code, url: link });
      return;
    }
    await copyLink();
  }

  return (
    <div className={["flex flex-wrap items-center gap-2", className].filter(Boolean).join(" ")}>
      <button type="button" onClick={copyLink} className="tap-44 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:border-cyan-500">
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied link" : "Copy link"}
      </button>
      <button type="button" onClick={shareLink} className="tap-44 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:border-cyan-500">
        <Share2 className="h-4 w-4" /> Share
      </button>
    </div>
  );
}
