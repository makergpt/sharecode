import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Download, ArrowRight, XCircle, AlertTriangle, CheckCircle2, Shield, ExternalLink, Loader2 } from "lucide-react";
import FilePreview from "@/components/FilePreview";

export default function DownloadTab() {
  const [code, setCode] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle");
  const [downloading, setDownloading] = useState(false);

  const lookup = async () => {
    if (code.length !== 5) return;
    setStatus("loading");
    const results = await base44.entities.SharedFile.filter({ code: code.toUpperCase(), is_active: true });
    if (!results.length) { setStatus("not_found"); return; }
    const f = results[0];
    if (f.uses_type !== "unlimited" && f.uses_remaining <= 0) { setStatus("expired"); return; }
    setFile(f); setStatus("ready");
  };

  const handleDownload = async () => {
    if (!file) return;
    setDownloading(true);
    const newRemaining = file.uses_type === "unlimited" ? file.uses_remaining : file.uses_remaining - 1;
    await base44.entities.SharedFile.update(file.id, {
      uses_remaining: newRemaining, total_downloads: (file.total_downloads || 0) + 1,
      is_active: file.uses_type !== "unlimited" && newRemaining <= 0 ? false : true,
    });
    window.open(file.file_url || file.external_url, "_blank");
    setDownloading(false);
    if (file.uses_type !== "unlimited" && newRemaining <= 0) setStatus("expired");
  };

  return (
    <div className="max-w-sm mx-auto py-12 text-center">
      <h2 className="text-xl font-semibold mb-6 text-gray-200">Enter your 5-character code</h2>
      <div className="flex gap-2 mb-6">
        <input value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5))}
          onKeyDown={e => e.key === "Enter" && lookup()}
          placeholder="A B C D E"
          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] text-white placeholder-gray-700 focus:outline-none focus:border-brand" maxLength={5} autoFocus />
        <button onClick={lookup} disabled={code.length !== 5} className="bg-brand hover:bg-brand-soft disabled:opacity-40 text-black rounded-xl px-4 transition">
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {status === "loading" && <div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>}
      {status === "not_found" && <div className="flex items-center justify-center gap-2 text-red-400"><XCircle className="w-5 h-5" />Code not found</div>}
      {status === "expired" && <div className="flex items-center justify-center gap-2 text-yellow-400"><AlertTriangle className="w-5 h-5" />This code has expired</div>}

      {status === "ready" && file && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-6 text-left">
          <p className="font-semibold text-white mb-1 truncate">{file.file_name}</p>
          {file.file_size > 0 && <p className="text-gray-400 text-sm mb-3">{(file.file_size / 1024 / 1024).toFixed(2)} MB</p>}
          <div className="flex items-center gap-4 mb-4 text-sm">
            {file.virus_check_status === "clean" && <span className="flex items-center gap-1 text-green-400"><CheckCircle2 className="w-4 h-4" />Virus Free</span>}
            {file.virus_check_status === "suspicious" && <span className="flex items-center gap-1 text-red-400"><AlertTriangle className="w-4 h-4" />Suspicious</span>}
            {file.integrity_status === "ok" && <span className="flex items-center gap-1 text-green-400"><Shield className="w-4 h-4" />Intact</span>}
          </div>
          <p className="text-gray-500 text-xs mb-4">{file.uses_type === "unlimited" ? "Unlimited downloads" : `${file.uses_remaining} use${file.uses_remaining !== 1 ? "s" : ""} remaining`}</p>
          <FilePreview file={file} />
          <button onClick={handleDownload} disabled={downloading || file.integrity_status === "broken"}
            className="w-full bg-brand hover:bg-brand-soft disabled:opacity-40 text-black font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2">
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : file.source_type !== "direct" ? <ExternalLink className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            {file.integrity_status === "broken" ? "File Unavailable" : file.source_type !== "direct" ? "Open File" : "Download"}
          </button>
        </div>
      )}
    </div>
  );
}
