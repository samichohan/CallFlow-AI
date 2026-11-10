"use client";
// components/layout/Header.tsx
import { Bell, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  title: string;
  description?: string;
}

export default function Header({ title, description }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card/50 px-6 backdrop-blur">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary/10 text-primary py-1 px-3">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Vapi + Groq Engine</span>
        </Badge>
        <button
          className="relative rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
        </button>
      </div>
    </header>
  );
}

