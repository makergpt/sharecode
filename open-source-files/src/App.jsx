import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/AuthContext";
import { queryClientInstance } from "@/lib/query-client";
import { Toaster } from "@/components/ui/toaster";
import UploadTab from "@/components/tabs/UploadTab";
import DownloadTab from "@/components/tabs/DownloadTab";
import MyCodesTab from "@/components/tabs/MyCodesTab";
import Download from "@/pages/Download";
import Login from "@/pages/Login";
import Register from "@/pages/Register";

const navClass = ({ isActive }) => isActive
  ? "rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950"
  : "rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800";

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <BrowserRouter>
          <div className="min-h-screen bg-slate-950 text-white">
            <header className="border-b border-slate-800 px-4 py-3">
              <nav className="mx-auto flex max-w-5xl items-center gap-2">
                <strong className="mr-auto text-lg">ShareCode</strong>
                <NavLink to="/" className={navClass}>Make a code</NavLink>
                <NavLink to="/download" className={navClass}>Download</NavLink>
                <NavLink to="/codes" className={navClass}>My codes</NavLink>
                <NavLink to="/login" className={navClass}>Log in</NavLink>
              </nav>
            </header>
            <main className="mx-auto max-w-5xl px-4 py-6">
              <Routes>
                <Route path="/" element={<UploadTab />} />
                <Route path="/upload" element={<UploadTab />} />
                <Route path="/download" element={<DownloadTab />} />
                <Route path="/codes" element={<MyCodesTab />} />
                <Route path="/d/:code" element={<Download />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="*" element={<p>Page not found.</p>} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
