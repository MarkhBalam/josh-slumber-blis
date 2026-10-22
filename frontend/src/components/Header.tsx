"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import CartButton from "@/components/CartButton";
import SearchAutocomplete from "@/components/SearchAutocomplete";

const categories = [
  {
    label: "Mattresses",
    href: "/shop?category=mattresses",
  },
  {
    label: "Pillows",
    href: "/shop?category=pillows",
  },
  {
    label: "Duvets & Blankets",
    href: "/shop?category=duvets-blankets-bed-covers",
  },
  {
    label: "Bedsheets",
    href: "/shop?category=bedsheets",
  },
  {
    label: "Mattress Toppers",
    href: "/shop?category=mattress-toppers",
  },
  {
    label: "Pillow Cases",
    href: "/shop?category=pillow-cases",
  },
  {
    label: "Towels",
    href: "/shop?category=towels",
  },
  {
    label: "Cushions",
    href: "/shop?category=cushions",
  },
  {
    label: "Door Mats",
    href: "/shop?category=door-mats",
  },
  {
    label: "Curtains",
    href: "/shop?category=curtains",
  },
  {
    label: "Mosquito Nets",
    href: "/shop?category=mosquito-nets",
  },
  {
    label: "Mattress Protectors",
    href: "/shop?category=mattress-protectors",
  },
  {
    label: "Fleece Blankets",
    href: "/shop?category=fleece-blankets",
  },
  {
    label: "Baby Cot Mattresses",
    href: "/shop?category=baby-cots",
  },
  {
    label: "Shoe Racks",
    href: "/shop?category=shoe-racks",
  },
];

const desktopCategories = categories.slice(0, 5);

export default function Header() {
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [catalogueOpen, setCatalogueOpen] =
    useState(false);

  function closeMenus() {
    setMobileMenuOpen(false);
    setCatalogueOpen(false);
  }

  /*
  |--------------------------------------------------------------------------
  | Close Menus When Route Changes
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setMobileMenuOpen(false);
    setCatalogueOpen(false);
  }, [pathname]);

  /*
  |--------------------------------------------------------------------------
  | Lock Body While Mobile Drawer Is Open
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!mobileMenuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="relative z-50 bg-surface">
        {/* ============================================================
            MAIN HEADER
        ============================================================= */}

        <div className="border-b border-border-soft">
          <div className="mx-auto max-w-7xl px-3 sm:px-5 lg:px-6">
            {/* ========================================================
                DESKTOP MAIN ROW
            ========================================================= */}

            <div className="hidden h-[88px] items-center gap-3 lg:flex">
              {/* CATALOGUE BUTTON */}

              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setCatalogueOpen(
                      (current) => !current
                    )
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-full text-brand-navy transition hover:bg-surface-soft"
                  aria-label="Open product categories"
                  aria-expanded={catalogueOpen}
                >
                  <MenuIcon />
                </button>

                {catalogueOpen && (
                  <div className="absolute left-0 top-[calc(100%+10px)] z-[120] w-[310px] overflow-hidden rounded-2xl border border-border-soft bg-surface shadow-xl">
                    <div className="border-b border-border-soft px-5 py-4">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">
                        Shop Categories
                      </p>
                    </div>

                    <div className="max-h-[70vh] overflow-y-auto p-2">
                      {categories.map(
                        (category) => (
                          <Link
                            key={category.label}
                            href={category.href}
                            onClick={closeMenus}
                            className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-brand-navy transition hover:bg-surface-soft"
                          >
                            <span>
                              {category.label}
                            </span>

                            <span className="text-text-muted">
                              ›
                            </span>
                          </Link>
                        )
                      )}

                      <div className="mt-2 border-t border-border-soft pt-2">
                        <Link
                          href="/shop"
                          onClick={closeMenus}
                          className="flex items-center justify-between rounded-xl bg-brand-navy px-4 py-3 text-sm font-bold text-white"
                        >
                          View All Products

                          <span className="text-brand-yellow">
                            →
                          </span>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* LOGO */}

              <Link
                href="/"
                onClick={closeMenus}
                className="flex shrink-0 items-center"
              >
                <img
                  src="/josh balam logo.png"
                  alt="Josh Slumber Blis"
                  className="h-auto w-[150px] object-contain"
                />
              </Link>

              {/* ====================================================
                  AMAZON-STYLE LIVE SEARCH
              ===================================================== */}

              <SearchAutocomplete variant="desktop" />

              {/* MY ORDERS */}

              <Link
                href="/my-orders"
                className="flex h-11 shrink-0 items-center gap-2 rounded-full px-2.5 text-sm font-bold text-brand-navy transition hover:bg-surface-soft"
              >
                <OrdersIcon />

                <div className="leading-[1.05]">
                  <span className="block text-[9px] font-medium text-text-muted">
                    Track
                  </span>

                  <span className="block whitespace-nowrap text-sm">
                    My Orders
                  </span>
                </div>
              </Link>

              {/* CART */}

              <div className="shrink-0">
                <CartButton />
              </div>
            </div>

            {/* ========================================================
                MOBILE / TABLET TOP ROW
            ========================================================= */}

            <div className="flex h-[64px] items-center gap-2 lg:hidden">
              <button
                type="button"
                onClick={() =>
                  setMobileMenuOpen(true)
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brand-navy transition hover:bg-surface-soft"
                aria-label="Open menu"
              >
                <MenuIcon />
              </button>

              <Link
                href="/"
                onClick={closeMenus}
                className="flex shrink-0 items-center"
              >
                <img
                  src="/josh balam logo.png"
                  alt="Josh Slumber Blis"
                  className="h-auto w-[115px] object-contain sm:w-[135px]"
                />
              </Link>

              <div className="ml-auto flex shrink-0 items-center gap-1">
                <Link
                  href="/my-orders"
                  aria-label="My Orders"
                  className="hidden h-10 items-center gap-2 rounded-full px-2.5 text-sm font-bold text-brand-navy transition hover:bg-surface-soft sm:flex"
                >
                  <OrdersIcon />

                  <span className="hidden md:inline">
                    My Orders
                  </span>
                </Link>

                <CartButton />
              </div>
            </div>

            {/* ========================================================
                MOBILE AMAZON-STYLE LIVE SEARCH
            ========================================================= */}

            <div className="relative z-[80] pb-3 lg:hidden">
              <SearchAutocomplete variant="mobile" />
            </div>
          </div>
        </div>

        {/* ============================================================
            DESKTOP CATEGORY NAVIGATION
        ============================================================= */}

        <div className="hidden h-10 border-b border-border-soft bg-brand-navy lg:block">
          <div className="mx-auto flex h-full max-w-7xl items-center px-6">
            <Link
              href="/shop"
              className="flex h-full shrink-0 items-center border-r border-white/10 px-4 text-sm font-bold text-brand-yellow transition hover:bg-white/10 hover:text-white"
            >
              Shop All
            </Link>

            <nav className="flex h-full min-w-0 flex-1 items-center">
              {desktopCategories.map(
                (category) => (
                  <Link
                    key={category.label}
                    href={category.href}
                    className="flex h-full shrink-0 items-center px-4 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-brand-yellow"
                  >
                    {category.label}
                  </Link>
                )
              )}

              <button
                type="button"
                onClick={() =>
                  setCatalogueOpen(
                    (current) => !current
                  )
                }
                className="ml-auto flex h-full shrink-0 items-center gap-1 px-4 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-brand-yellow"
              >
                More

                <span className="text-xs">
                  ⌄
                </span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* ==============================================================
          MOBILE OVERLAY
      =============================================================== */}

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={closeMenus}
            className="absolute inset-0 bg-brand-navy/50"
          />

          <aside className="absolute left-0 top-0 flex h-full w-[88%] max-w-[360px] flex-col bg-surface shadow-2xl">
            {/* DRAWER HEADER */}

            <div className="flex items-center justify-between border-b border-border-soft p-4">
              <Link
                href="/"
                onClick={closeMenus}
                className="shrink-0"
              >
                <div className="flex w-[145px] items-center">
                  <img
                    src="/josh balam logo.png"
                    alt="Josh Slumber Blis"
                    className="h-auto w-full object-contain"
                  />
                </div>
              </Link>

              <button
                type="button"
                onClick={closeMenus}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-soft text-2xl text-brand-navy"
                aria-label="Close menu"
              >
                ×
              </button>
            </div>

            {/* DRAWER CONTENT */}

            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <p className="px-2 text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">
                  Menu
                </p>

                <nav className="mt-2">
                  <MobileMainLink
                    href="/"
                    label="Home"
                    onClick={closeMenus}
                  />

                  <MobileMainLink
                    href="/shop"
                    label="Shop All"
                    onClick={closeMenus}
                  />

                  <MobileMainLink
                    href="/my-orders"
                    label="My Orders"
                    onClick={closeMenus}
                  />

                  <MobileMainLink
                    href="/#contact"
                    label="Contact Us"
                    onClick={closeMenus}
                  />
                </nav>
              </div>

              <div className="border-t border-border-soft p-4">
                <p className="px-2 text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">
                  Shop Categories
                </p>

                <nav className="mt-2">
                  {categories.map(
                    (category) => (
                      <Link
                        key={category.label}
                        href={category.href}
                        onClick={closeMenus}
                        className="flex min-h-12 items-center justify-between rounded-xl px-3 text-sm font-semibold text-brand-navy transition hover:bg-surface-soft"
                      >
                        {category.label}

                        <span className="text-text-muted">
                          ›
                        </span>
                      </Link>
                    )
                  )}
                </nav>
              </div>

              {/* GUEST ORDER TRACKING */}

              <div className="mx-4 mb-6 rounded-2xl bg-brand-navy p-5 text-white">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-yellow font-black text-brand-navy">
                  i
                </div>

                <p className="mt-3 font-bold">
                  Already placed an order?
                </p>

                <p className="mt-1 text-xs leading-5 text-white/65">
                  No account is required. Use the phone
                  number entered at checkout to find and
                  track your order.
                </p>

                <Link
                  href="/my-orders"
                  onClick={closeMenus}
                  className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-brand-yellow px-5 text-sm font-bold text-brand-navy"
                >
                  Track My Order
                </Link>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

/* ====================================================================
   MOBILE MAIN LINK
===================================================================== */

function MobileMainLink({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex min-h-12 items-center justify-between rounded-xl px-3 font-bold text-brand-navy transition hover:bg-surface-soft"
    >
      {label}

      <span className="text-text-muted">
        →
      </span>
    </Link>
  );
}

/* ====================================================================
   ICONS
===================================================================== */

function MenuIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 7H20M4 12H20M4 17H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 7H18M6 12H18M6 17H13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="3"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}