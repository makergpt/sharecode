import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Mail } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import EmailComposer from "@/components/email/EmailComposer";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import TelegramIcon from "@/components/TelegramIcon";

const BTN =
  "tap-44 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-xs font-medium text-gray-300 hover:text-white hover:border-brand/50 transition";

export default function ShareCodeButtons({ code, className = "" }) {
  const { currentUser } = useAuth();
  const [emailOpen, setEmailOpen] = useState(false);

  const link = `${window.location.origin}/d/${code}`;
  const message = `I shared a file with you on ShareCode.\n\nCode: ${code}\nOpen: ${link}`;

  const number = (currentUser?.whatsapp_number || "").replace(/[^\d]/g, "");
  const whatsappHref = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

  const handle = (currentUser?.telegram_handle || "").replace(/^@/, "").trim();
  const telegramHref = handle
    ? `https://t.me/${handle}`
    : `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(message)}`;

  const openTelegram = async (e) => {
    if (!handle) return; // Telegram's own share sheet carries the message
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(message);
      toast({ title: "Code copied", description: `Paste it into your Telegram chat with @${handle}.` });
    } catch {
      toast({ title: "Could not copy the code", description: "Copy it from the card above instead." });
    }
    window.open(telegramHref, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={BTN}>
        <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" /> WhatsApp
      </a>
      <a href={telegramHref} onClick={openTelegram} target="_blank" rel="noopener noreferrer" className={BTN}>
        <TelegramIcon className="w-3.5 h-3.5 text-[#29A9EB]" /> Telegram
      </a>
      <button type="button" onClick={() => setEmailOpen(true)} className={BTN}>
        <Mail className="w-3.5 h-3.5" /> Email
      </button>
      <EmailComposer
        open={emailOpen}
        onOpenChange={setEmailOpen}
        content={{ kind: "code", code, title: `ShareCode ${code}`, url: link }}
      />
    </div>
  );
}
