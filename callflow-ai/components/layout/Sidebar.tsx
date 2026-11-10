"use client";
// components/layout/Sidebar.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Phone, Users, PhoneCall,
  Ticket, BarChart3, BookOpen, Settings, Zap, ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Overview",         href: "/overview",   icon: LayoutDashboard },
  { label: "AI Calling Agent", href: "/agent",      icon: Phone },
  { label: "Customers",        href: "/customers",  icon: Users },
  { label: "Orders",           href: "/orders",     icon: ShoppingCart },
  { label: "Call History",     href: "/calls",      icon: PhoneCall },
  { label: "Support Tickets",  href: "/tickets",    icon: Ticket },
  { label: "Analytics",        href: "/analytics",  icon: BarChart3 },
  { label: "Knowledge Base",   href: "/knowledge",  icon: BookOpen },
  { label: "Settings",         href: "/settings",   icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-sidebar border-sidebar-border">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-sidebar-foreground">CallFlow AI</p>
          <p className="text-[10px] text-muted-foreground">Smart CRM Platform</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Main Menu
        </p>
        <ul className="space-y-1">
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-white"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-md bg-sidebar-accent p-3">
          <p className="text-xs font-semibold text-sidebar-foreground">Demo Mode</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Add Vapi keys in Settings to enable real calls.
          </p>
        </div>
      </div>
    </aside>
  );
}

