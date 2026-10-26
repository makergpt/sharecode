import React from "react";
import { Share2 } from "lucide-react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4 dark">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-brand/20 border border-brand/40 flex items-center justify-center">
              <Share2 className="w-4 h-4 text-brand-soft" />
            </div>
            <span className="font-bold text-lg tracking-tight">Share<span className="text-brand-soft">Code</span></span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
        </div>
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}
