import Link from "next/link";

export default function Footer() {
  return (
    <footer
      id="contact"
      className="mt-auto bg-brand-navy text-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.35fr_0.8fr_0.9fr_1fr] lg:gap-12">
          {/* ========================================================
              BRAND
          ========================================================= */}

          <div>
            <Link
              href="/"
              className="inline-flex"
            >
              <div className="flex items-center rounded-2xl bg-white px-3 py-2 shadow-sm">
                <div className="w-[150px] sm:w-[175px]">
                  <img
                    src="/josh balam logo.png"
                    alt="Josh Slumber Blis"
                    className="h-auto w-full object-contain"
                  />
                </div>
              </div>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-6 text-white/65">
              Quality mattresses, bedding and bedroom
              essentials designed to bring comfort into
              every home.
            </p>

            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-yellow">
                Your comfort matters to us
              </p>
            </div>
          </div>

          {/* ========================================================
              SHOP
          ========================================================= */}

          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-brand-yellow">
              Shop
            </h3>

            <nav className="mt-5 flex flex-col gap-3">
              <FooterLink
                href="/shop"
                label="Shop All"
              />

              <FooterLink
                href="/shop?category=mattresses"
                label="Mattresses"
              />

              <FooterLink
                href="/shop?category=pillows"
                label="Pillows"
              />

              <FooterLink
                href="/shop?category=duvets-blankets-bed-covers"
                label="Duvets & Blankets"
              />

              <FooterLink
                href="/shop?category=bedsheets"
                label="Bedsheets"
              />

              <FooterLink
                href="/shop?category=mattress-toppers"
                label="Mattress Toppers"
              />
            </nav>
          </div>

          {/* ========================================================
              CUSTOMER CARE
          ========================================================= */}

          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-brand-yellow">
              Customer Care
            </h3>

            <nav className="mt-5 flex flex-col gap-3">
              <FooterLink
                href="/my-orders"
                label="My Orders"
              />

              <FooterLink
                href="/my-orders"
                label="Track an Order"
              />

              <FooterLink
                href="/shop"
                label="Browse Products"
              />

              <FooterLink
                href="/#contact"
                label="Contact Us"
              />
            </nav>

            <div className="mt-6 rounded-2xl bg-white/5 p-4">
              <p className="text-xs font-bold text-white">
                Guest checkout
              </p>

              <p className="mt-1 text-xs leading-5 text-white/55">
                No customer account is required. Track
                orders using the phone number entered
                during checkout.
              </p>
            </div>
          </div>

          {/* ========================================================
              SOCIAL MEDIA
          ========================================================= */}

          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-brand-yellow">
              Follow Us
            </h3>

            <p className="mt-5 text-sm leading-6 text-white/65">
              Follow Josh Slumber Bliss for product
              updates, offers and new arrivals.
            </p>

            <div className="mt-5 space-y-3">
              <SocialItem
                icon={<InstagramIcon />}
                platform="Instagram"
                handle="Josh Slumber Bliss"
              />

              <SocialItem
                icon={<TikTokIcon />}
                platform="TikTok"
                handle="Josh Slumber Bliss"
              />

              <SocialItem
                icon={<XIcon />}
                platform="X"
                handle="Josh Slumber Bliss"
              />
            </div>
          </div>
        </div>

        {/* ============================================================
            BOTTOM
        ============================================================= */}

        <div className="mt-10 border-t border-white/10 pt-6 sm:mt-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-white/45">
              © {new Date().getFullYear()} Josh Slumber
              Blis. All rights reserved.
            </p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/45">
              <span>
                Quality comfort
              </span>

              <span className="hidden sm:inline">
                •
              </span>

              <span>
                Convenient shopping
              </span>

              <span className="hidden sm:inline">
                •
              </span>

              <span>
                Delivery across Uganda
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="w-fit text-sm text-white/65 transition hover:text-brand-yellow"
    >
      {label}
    </Link>
  );
}

function SocialItem({
  icon,
  platform,
  handle,
}: {
  icon: React.ReactNode;
  platform: string;
  handle: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl py-1">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-brand-yellow">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-bold text-white">
          {platform}
        </p>

        <p className="truncate text-xs text-white/45">
          {handle}
        </p>
      </div>
    </div>
  );
}

function InstagramIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="2"
      />

      <circle
        cx="12"
        cy="12"
        r="4"
        stroke="currentColor"
        strokeWidth="2"
      />

      <circle
        cx="17.5"
        cy="6.5"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M14 4V15.5C14 18 12 20 9.5 20C7 20 5 18 5 15.5C5 13 7 11 9.5 11C10.1 11 10.7 11.1 11.2 11.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M14 4C14.8 7 16.7 8.8 20 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 4L19 20M19 4L5 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}