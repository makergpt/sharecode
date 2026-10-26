import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Upload, Cloud, HardDrive, Copy, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import ShareCodeButtons from "@/components/share/ShareCodeButtons";

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

async function ensureUniqueCode() {
  let code, existing;
  do {
    code = generateCode();
    existing = await base44.entities.SharedFile.filter({ code });
  } while (existing.length > 0);
  return code;
}

export default function UploadTab() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [sourceType, setSourceType] = useState("direct");
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [externalUrl, setExternalUrl] = useState("");
  const [externalName, setExternalName] = useState("");
  const [usesType, setUsesType] = useState("single");
  const [usesCount, setUsesCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [checkStatus, setCheckStatus] = useState("");
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef();

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Upload className="w-12 h-12 text-gray-600 mb-4" />
        <p className="text-gray-300 text-lg mb-2">Sign in to upload files</p>
        <p className="text-gray-500 text-sm mb-6">Create an account to get shareable codes</p>
        <button onClick={() => base44.auth.loginWithProvider("google", "/upload")}
          className="w-full max-w-xs flex items-center justify-center gap-2 mx-auto bg-white hover:bg-gray-100 text-gray-900 font-medium px-5 py-2.5 rounded-lg text-sm transition mb-3">
          <GoogleIcon className="w-5 h-5" /> Continue with Google
        </button>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate("/login")} className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition">Login</button>
          <button onClick={() => navigate("/register")} className="px-5 py-2 bg-brand hover:bg-brand-soft text-black font-semibold rounded-lg text-sm transition">Register</button>
        </div>
      </div>
    );
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setSourceType("direct"); }
  };

  const runChecks = async (fileName, fileUrl, fileSize, fileType) => {
    try {
      return await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this file for safety. File: ${fileName}, Size: ${fileSize} bytes, Type: ${fileType || "unknown"}. Return JSON: {"virus_check_status":"clean"|"suspicious"|"unknown","integrity_status":"ok"|"broken"|"unknown","check_notes":""}`,
        response_json_schema: { type: "object", properties: { virus_check_status: { type: "string" }, integrity_status: { type: "string" }, check_notes: { type: "string" } } }
      });
    } catch { return { virus_check_status: "unknown", integrity_status: "unknown", check_notes: "" }; }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setCheckStatus("Uploading...");
    let fileUrl = null, fileName = "", fileSize = 0, fileType = "";
    if (sourceType === "direct") {
      if (!file) { setLoading(false); return; }
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      fileUrl = file_url; fileName = file.name; fileSize = file.size; fileType = file.type;
    } else {
      if (!externalUrl || !externalName) { setLoading(false); return; }
      fileName = externalName;
    }
    setCheckStatus("Running safety checks...");
    const checks = await runChecks(fileName, fileUrl, fileSize, fileType);
    setCheckStatus("Generating code...");
    const code = await ensureUniqueCode();
    const uses = usesType === "single" ? 1 : usesType === "multi" ? usesCount : 999999;
    const entry = await base44.entities.SharedFile.create({
      code, file_url: fileUrl, file_name: fileName, file_size: fileSize, file_type: fileType,
      source_type: sourceType, external_url: sourceType !== "direct" ? externalUrl : null,
      uses_type: usesType === "unlimited" ? "unlimited" : usesType, uses_remaining: uses,
      total_downloads: 0, is_active: true, uploader_id: currentUser?.id,
      virus_check_status: checks.virus_check_status, integrity_status: checks.integrity_status, check_notes: checks.check_notes,
    });
    setResult(entry); setLoading(false); setCheckStatus("");
  };

  const copyCode = () => { navigator.clipboard.writeText(result.code); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  if (result) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle2 className="w-14 h-14 text-green-400 mb-4" />
        <h2 className="text-2xl font-bold mb-1">File Shared!</h2>
        <p className="text-gray-400 mb-6 text-sm">Share this code with anyone</p>
        <div className="bg-gray-800/60 border border-gray-700 rounded-2xl px-8 py-5 flex items-center gap-4 mb-4">
          <span className="font-mono text-4xl font-bold tracking-[0.4em] text-brand-soft">{result.code}</span>
          <button onClick={copyCode} className="text-gray-400 hover:text-white transition">
            {copied ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-gray-500 text-sm mb-6">{result.uses_type === "unlimited" ? "Unlimited uses" : result.uses_type === "single" ? "1 use only" : `${result.uses_remaining} uses`} · {result.virus_check_status === "clean" ? "✅ Clean" : "🔍 Checked"}</p>
        <ShareCodeButtons code={result.code} className="justify-center mb-6" />
        <button onClick={() => { setResult(null); setFile(null); setExternalUrl(""); setExternalName(""); }} className="px-6 py-2.5 bg-brand hover:bg-brand-soft text-black font-semibold rounded-lg text-sm transition">Upload Another</button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-6">
      {/* Drop zone */}
      <div
        onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition mb-6 ${dragging ? "border-brand-soft bg-brand-soft/5" : file ? "border-brand/60 bg-brand/5" : "border-gray-600 hover:border-gray-500 bg-gray-800/20"}`}
      >
        <input ref={inputRef} type="file" className="hidden" onChange={e => { setFile(e.target.files[0]); setSourceType("direct"); }} />
        <Upload className={`w-10 h-10 mx-auto mb-3 ${file ? "text-brand-soft" : "text-gray-500"}`} />
        {file ? (
          <div><p className="text-white font-medium">{file.name}</p><p className="text-gray-400 text-sm mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p></div>
        ) : (
          <div><p className="text-gray-200 font-medium">Drop file here or click to browse</p><p className="text-gray-500 text-sm mt-1">All file types · No size limit</p></div>
        )}
      </div>

      {/* Uses */}
      <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-6 cursor-pointer hover:text-white transition" onClick={() => inputRef.current?.click()}>
        <HardDrive className="w-4 h-4" /> Browse local files
      </div>

      <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-4 mb-6">
        <p className="text-sm text-gray-400 mb-3">Code uses</p>
        <div className="flex gap-2 mb-3">
          {[["single", "Single"], ["multi", "Multi"], ["unlimited", "Unlimited"]].map(([val, label]) => (
            <button key={val} type="button" onClick={() => setUsesType(val)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition border ${usesType === val ? "bg-brand border-brand text-black" : "bg-gray-900 border-gray-600 text-gray-400 hover:text-white"}`}>
              {label}
            </button>
          ))}
        </div>
        {usesType === "multi" && (
          <div className="flex items-center gap-3">
            <input type="number" min="2" value={usesCount} onChange={e => setUsesCount(Number(e.target.value))}
              className="w-20 bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-brand" />
            <span className="text-gray-400 text-sm">uses</span>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-brand-soft text-sm bg-brand/10 border border-brand/30 rounded-lg px-4 py-3 mb-4">
          <Loader2 className="w-4 h-4 animate-spin" />{checkStatus}
        </div>
      )}

      <button onClick={handleSubmit}
        disabled={loading || (sourceType === "direct" ? !file : !externalUrl || !externalName)}
        className="w-full bg-brand hover:bg-brand-soft disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition">
        {loading ? "Processing..." : "Upload & Get Code"}
      </button>
    </div>
  );
}
