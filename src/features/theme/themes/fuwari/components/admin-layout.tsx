import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Menu, Settings } from "lucide-react";
import { useState } from "react";
import { SideBar } from "@/components/admin/side-bar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import Toaster from "@/components/ui/toaster";
import type { AdminLayoutProps } from "@/features/theme/contract/layouts";
import { m } from "@/paraglide/messages";
import "@theme/styles/index.css";
import "@/styles/admin.css";

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);

  return (
    <div
      className="h-screen overflow-hidden text-foreground flex relative font-sans admin-layout"
      style={{ backgroundColor: "var(--fuwari-page-bg)" }}
    >
      <SideBar
        isMobileSidebarOpen={isMobileSidebarOpen}
        closeMobileSidebar={closeMobileSidebar}
      />
      <main className="flex-1 flex flex-col min-w-0 min-h-0">
        <header
          className="h-20 border-b border-[var(--fuwari-input-border)] flex items-center justify-between px-6 md:px-10 sticky top-0 z-30 shrink-0"
          style={{ backgroundColor: "var(--fuwari-card-bg)" }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-muted/50 rounded-sm transition-colors text-foreground"
              aria-label={m.admin_layout_open_navigation()}
            >
              <Menu size={20} strokeWidth={1.5} />
            </button>
            <Breadcrumbs />
          </div>
          <div className="flex items-center gap-6">
            <Link
              to="/admin/settings"
              className="group p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
              title={m.admin_layout_settings()}
            >
              <Settings
                size={18}
                strokeWidth={1.5}
                className="group-hover:rotate-45 transition-transform duration-500 ease-in-out"
              />
            </Link>
            <div className="h-4 w-px bg-border/40" />
            <Link
              to="/"
              className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-mono font-medium text-muted-foreground hover:text-foreground transition-colors group"
            >
              <span>{m.admin_layout_back_to_site()}</span>
              <ArrowUpRight
                size={10}
                strokeWidth={1.5}
                className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
              />
            </Link>
          </div>
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto p-6 md:p-12 custom-scrollbar">
          <div
            className="mx-auto rounded-[var(--radius)] p-6 md:p-10 fuwari-onload-animation"
            style={{
              backgroundColor: "var(--fuwari-card-bg)",
              maxWidth: "var(--page-width)",
            }}
          >
            {children}
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  );
}
