"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "◫" },
  { href: "/admin/orders", label: "Orders", icon: "▤" },
  { href: "/admin/products", label: "Products", icon: "▦" },
  { href: "/admin/products/create", label: "Add Product", icon: "+" },
  { href: "/admin/hero-slides", label: "Homepage Highlights", icon: "▧" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    const token = localStorage.getItem(
      "josh-slumber-blis-admin-token"
    );

    try {
      if (token) {
        await fetch("http://127.0.0.1:8000/api/admin/logout", {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch {
      // Clear the local session even if the API is unavailable.
    } finally {
      localStorage.removeItem("josh-slumber-blis-admin-token");
      localStorage.removeItem("josh-slumber-blis-admin-user");
      router.replace("/admin/login");
      router.refresh();
    }
  }
  const [menuOpen, setMenuOpen] = useState(false);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background text-text-main lg:flex">
      {menuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-brand-navy/60 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-brand-navy text-white transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/15 px-6 py-6">
          <Link
            href="/admin"
            onClick={() => setMenuOpen(false)}
            className="flex min-w-0 flex-1 items-center"
            aria-label="Josh Slumber Bliss Admin Dashboard"
          >
            <div className="flex h-[70px] w-[180px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1">
              <div className="relative h-full w-full">
                <Image
                  src="/josh balam logo.png"
                  alt="Josh Slumber Bliss"
                  fill
                  sizes="225px"
                  className="object-contain scale-[2.5]"
                  priority
                />
              </div>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="rounded-lg p-2 text-white/80 hover:bg-white/10 lg:hidden"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <div className="px-6 pt-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-yellow">
            Workspace
          </p>
        </div>

        <nav className="mt-4 flex-1 space-y-2 overflow-y-auto px-4 pb-6">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href ||
              (item.href === "/admin/orders" &&
                pathname.startsWith("/admin/orders/")) ||
              (item.href === "/admin/products" &&
                pathname.startsWith("/admin/products/") &&
                !pathname.startsWith("/admin/products/create"));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-semibold transition ${
                  active
                    ? "bg-brand-yellow text-brand-navy shadow-lg"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-current/10 text-xl">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/15 p-5">
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm font-bold text-brand-yellow">
              Keep growing your store.
            </p>
            <p className="mt-2 text-xs leading-5 text-white/70">
              Every order fulfilled is another opportunity to build customer trust.
            </p>
          </div>

          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold transition hover:bg-white/10"
          >
            View Customer Store ↗
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="mt-3 flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/15 hover:text-white disabled:opacity-50"
          >
            <span aria-hidden="true">↪</span>
            {loggingOut ? "Logging out..." : "Log Out"}
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-brand-navy/10 bg-white/95 px-5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="rounded-xl border border-brand-navy/10 p-2.5 text-brand-navy lg:hidden"
              aria-label="Open navigation"
            >
              ☰
            </button>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-text-muted">
                Josh Slumber Bliss
              </p>
              <p className="text-base font-extrabold text-brand-navy sm:text-lg">
                Management Workspace
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full bg-surface-soft px-4 py-2 text-sm font-semibold text-brand-navy sm:flex">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Admin Portal
          </div>
        </header>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
