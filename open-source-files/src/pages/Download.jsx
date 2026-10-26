import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Download, Shield, CheckCircle2, AlertTriangle, XCircle, FileX, ExternalLink, Loader2 } from "lucide-react";
import FilePreview from "@/components/FilePreview";

export default function DownloadPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("loading");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadFile();
  }, [code]);

  const loadFile = async () => {
    const results = await base44.entities.SharedFile.filter({ code: code.toUpperCase(), is_active: true });
    if (!results.length) { setStatus("not_found"); return; }
    const f = results[0];
    if (f.uses_type !== "unlimited" && f.uses_remaining <= 0) { setStatus("expired"); return; }
    setFile(f);
    setStatus("ready");
  };

  const handleDownload = async () => {
    if (!file) return;
    setDownloading(true);
    const newRemaining = file.uses_type === "unlimited" ? file.uses_remaining : file.uses_remaining - 1;
    const newTotal = (file.total_downloads || 0) + 1;
    const isNowExpired = file.uses_type !== "unlimited" && newRemaining <= 0;
    await base44.entities.SharedFile.update(file.id, {
      uses_remaining: newRemaining,
      total_downloads: newTotal,
      is_active: isNowExpired ? false : true,
    });

    if (file.source_type !== "direct" || file.external_url) {
      window.open(file.external_url || file.file_url, "_blank");
    } else {
      window.open(file.file_url, "_blank");
    }
    setDownloading(false);
    if (isNowExpired) setStatus("expired");
  };

  const VirusBadge = () => {
    if (file?.virus_check_status === "clean") return <span className="flex items-center gap-1 text-green-400 text-sm"><CheckCircle2 className="w-4 h-4" /> Virus Free</span>;
    if (file?.virus_check_status === "suspicious") return <span className="flex items-center gap-1 text-red-400 text-sm"><AlertTriangle className="w-4 h-4" /> Suspicious File</span>;
    return <span className="flex items-center gap-1 text-yellow-400 text-sm"><Shield className="w-4 h-4" /> Check Pending</span>;
  };

  const IntegrityBadge = () => {
    if (file?.integrity_status === "ok") return <span className="flex items-center gap-1 text-green-400 text-sm"><CheckCircle2 className="w-4 h-4" /> File Intact</span>;
    if (file?.integrity_status === "broken") return <span className="flex items-center gap-1 text-red-400 text-sm"><FileX className="w-4 h-4" /> File Broken</span>;
    return null;
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-[70vh]">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span>Looking up code...</span>
          </div>
        )}

        {status === "not_found" && (
          <div className="text-center">
            <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Code Not Found</h2>
            <p className="text-gray-400 mb-4">The code <span className="font-mono text-white">{code}</span> doesn't exist.</p>
            <button onClick={() => navigate("/")} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg transition">Try Another Code</button>
          </div>
        )}

        {status === "expired" && (
          <div className="text-center">
            <AlertTriangle className="w-14 h-14 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Code Expired</h2>
            <p className="text-gray-400 mb-4">This code has been used up and is no longer active.</p>
            <button onClick={() => navigate("/")} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg transition">Back to Home</button>
          </div>
        )}

        {status === "ready" && file && (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-blue-600/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Download className="w-7 h-7 text-blue-400" />
              </div>
              <div className="font-mono text-2xl font-bold tracking-widest text-blue-400 mb-1">{code}</div>
              <h2 className="text-lg font-semibold text-white truncate">{file.file_name}</h2>
              {file.file_size && <p className="text-gray-400 text-sm">{(file.file_size / 1024 / 1024).toFixed(2)} MB</p>}
            </div>

            <div className="flex items-center justify-center gap-6 mb-6 p-3 bg-gray-900 rounded-xl">
              <VirusBadge />
              <IntegrityBadge />
            </div>

            {file.virus_check_status === "suspicious" && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4 text-red-300 text-sm">
                ⚠️ This file was flagged as potentially suspicious. Download at your own risk.
              </div>
            )}

            <div className="text-center text-gray-400 text-sm mb-4">
              {file.uses_type === "unlimited" ? "Unlimited downloads" :
                file.uses_remaining === 1 ? "1 use remaining (last download)" :
                  `${file.uses_remaining} uses remaining`}
            </div>

            <FilePreview file={file} />

            <button
              onClick={handleDownload}
              disabled={downloading || file.integrity_status === "broken"}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : 
               file.source_type !== "direct" ? <ExternalLink className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              {file.integrity_status === "broken" ? "File Unavailable" :
               file.source_type !== "direct" ? "Open File" : "Download File"}
            </button>

            {file.check_notes && (
              <p className="text-gray-500 text-xs text-center mt-3">{file.check_notes}</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
