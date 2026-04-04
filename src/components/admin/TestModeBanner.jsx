import { useTestProfile } from "@/lib/testProfileContext";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, X } from "lucide-react";

export default function TestModeBanner() {
  const { testEmail, setTestEmail } = useTestProfile();
  const navigate = useNavigate();

  if (!testEmail) return null;

  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 px-4 pt-2">
      <div className="flex items-center gap-2 bg-amber-400/15 border border-amber-400/40 rounded-xl px-3 py-2 backdrop-blur-sm">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <p className="flex-1 text-[10px] font-semibold text-amber-400 truncate">
          TEST MODE — {testEmail}
        </p>
        <button onClick={() => navigate("/admin")}
          className="text-[10px] text-amber-400 underline shrink-0 mr-1">
          Manage
        </button>
        <button onClick={() => setTestEmail(null)} className="shrink-0">
          <X className="w-3.5 h-3.5 text-amber-400" />
        </button>
      </div>
    </div>
  );
}