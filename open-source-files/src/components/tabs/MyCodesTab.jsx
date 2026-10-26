import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Copy, CheckCircle2, Trash2, Plus, Loader2, RefreshCw, FileX } from "lucide-react";
import PullToRefresh from "@/components/PullToRefresh";
import ShareCodeButtons from "@/components/share/ShareCodeButtons";

export default function MyCodesTab() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const queryKey = currentUser ? ["sharedFiles", "mine", currentUser.id] : ["sharedFiles", "mine"];
  const [copiedId, setCopiedId] = useState(null);
  const [addingId, setAddingId] = useState(null);
  const [addCount, setAddCount] = useState(5);

  const { data: files = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => base44.entities.SharedFile.filter({ uploader_id: currentUser.id }, "-created_date"),
    enabled: !!currentUser,
  });

  const deactivate = useMutation({
    mutationFn: (id) => base44.entities.SharedFile.update(id, { is_active: false }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData(queryKey);
      qc.setQueryData(queryKey, (old) => (old || []).map((f) => (f.id === id ? { ...f, is_active: false } : f)));
      return { prev };
    },
    onError: (_e, _id, ctx) => { if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev); },
    onSettled: () => { qc.invalidateQueries({ queryKey }); },
  });

  const addUses = useMutation({
    mutationFn: ({ file }) =>
      base44.entities.SharedFile.update(file.id, {
        uses_remaining: (file.uses_remaining || 0) + addCount,
        uses_type: "multi",
        is_active: true,
      }),
    onMutate: async ({ file }) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData(queryKey);
      qc.setQueryData(queryKey, (old) =>
        (old || []).map((f) =>
          f.id === file.id ? { ...f, uses_remaining: (f.uses_remaining || 0) + addCount, uses_type: "multi", is_active: true } : f
        )
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev); },
    onSettled: () => { qc.invalidateQueries({ queryKey }); },
  });

  if (!currentUser) return (
    <div className="text-center py-20">
      <p className="text-gray-400 mb-4">Sign in to view your codes</p>
      <button onClick={() => navigate("/login")} className="px-5 py-2 bg-brand hover:bg-brand-soft text-black font-semibold rounded-lg text-sm transition">Login</button>
    </div>
  );

  const copyCode = (id, code) => { navigator.clipboard.writeText(code); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); };
  const refresh = () => qc.invalidateQueries({ queryKey });
  const loading = isLoading;

  return (
    <PullToRefresh onRefresh={refresh}>
      <div className="py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">My Codes</h2>
          <button onClick={refresh} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition"><RefreshCw className="w-4 h-4" /></button>
        </div>
        {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          : files.length === 0 ? <div className="text-center py-16 text-gray-500"><FileX className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No codes yet. Upload a file to get started.</p></div>
          : <div className="space-y-2">
            {files.map(f => (
              <div key={f.id} className={`bg-gray-800/50 border rounded-xl px-4 py-3 ${f.is_active ? "border-gray-700" : "border-gray-700/30 opacity-50"}`}>
                <div className="flex items-center gap-4">
                <span className="font-mono text-lg font-bold tracking-widest text-brand-soft min-w-[5.5rem]">{f.code}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate font-medium">{f.file_name}</p>
                  <div className="flex gap-3 mt-0.5 flex-wrap">
                    <span className="text-xs text-gray-400">{f.uses_type === "unlimited" ? "∞" : f.uses_remaining} uses left</span>
                    <span className="text-xs text-gray-500">{f.total_downloads || 0} downloads</span>
                    <span className={`text-xs ${f.is_active ? "text-green-400" : "text-gray-500"}`}>{f.is_active ? "Active" : "Expired"}</span>
                    {f.virus_check_status === "clean" && <span className="text-xs text-green-400">✓ Clean</span>}
                    {f.virus_check_status === "suspicious" && <span className="text-xs text-red-400">⚠ Suspicious</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {addingId === f.id ? (
                    <div className="flex items-center gap-1">
                      <input type="number" min="1" max="1000" value={addCount} onChange={e => setAddCount(Number(e.target.value))}
                        className="w-14 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none" />
                      <button onClick={() => { addUses.mutate({ file: f }); setAddingId(null); }} className="bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded text-xs transition">Add</button>
                      <button onClick={() => setAddingId(null)} className="text-gray-400 hover:text-white text-xs px-1">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => setAddingId(f.id)} className="p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white transition" title="Add uses">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => copyCode(f.id, f.code)} className="p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white transition">
                    {copiedId === f.id ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  {f.is_active && <button onClick={() => deactivate.mutate(f.id)} className="p-1.5 rounded bg-gray-700 hover:bg-red-700 text-gray-400 hover:text-white transition"><Trash2 className="w-3.5 h-3.5" /></button>}
                </div>
                </div>
                <ShareCodeButtons code={f.code} className="mt-3 pt-3 border-t border-gray-700/60" />
              </div>
            ))}
          </div>
        }
      </div>
    </PullToRefresh>
  );
}
