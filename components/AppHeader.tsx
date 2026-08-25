"use client";

import { faCarSide, faGear, faPlus, faRightFromBracket, faTableCellsLarge } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

const navigationItems = [
  { href: "/", label: "Dashboard", icon: faTableCellsLarge },
  { href: "/trips", label: "Fahrten", icon: faCarSide },
] as const;

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function logout() {
    startTransition(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    });
  }

  return (
    <>
      <header className="page-enter sticky top-0 z-30 border-b border-[#dbe3ee] bg-white/95 backdrop-blur lg:static">
        <div data-testid="mobile-app-bar" className="mx-auto flex h-16 w-full items-center justify-between gap-3 px-4 sm:px-6 lg:hidden">
          <Link href="/" className="focus-ring flex min-h-12 min-w-0 items-center gap-3 rounded-2xl pr-2" aria-label="Fahrtenbuch – Dashboard">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white p-1 shadow-sm ring-1 ring-[#dbe3ee]">
              <Image src="/brand/logo.png" alt="" width={40} height={40} className="h-full w-full object-contain" priority />
            </span>
            <span className="min-w-0 truncate text-[17px] font-extrabold tracking-[-.025em]">Fahrtenbuch</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/settings"
              className={`focus-ring grid h-12 w-12 shrink-0 place-items-center rounded-full transition-[background-color,color,transform] active:scale-95 ${pathname === "/settings" ? "bg-[#e0ecff] text-[#1d4ed8]" : "text-[#475569] hover:bg-[#eff6ff] hover:text-[#2563eb]"}`}
              aria-label="Einstellungen"
              aria-current={pathname === "/settings" ? "page" : undefined}
              title="Einstellungen"
            >
              <FontAwesomeIcon icon={faGear} className="h-5 w-5" />
            </Link>
            <button
              className="focus-ring grid h-12 w-12 shrink-0 place-items-center rounded-full text-[#475569] transition-[background-color,color,transform] hover:bg-[#eff6ff] hover:text-[#2563eb] active:scale-95 disabled:cursor-not-allowed disabled:opacity-55"
              type="button"
              onClick={logout}
              disabled={isPending}
              aria-label={isPending ? "Wird abgemeldet" : "Abmelden"}
              title="Abmelden"
            >
              <FontAwesomeIcon icon={faRightFromBracket} className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div data-testid="desktop-app-bar" className="mx-auto hidden h-[72px] w-full max-w-[1380px] grid-cols-[minmax(150px,1fr)_auto_minmax(230px,1fr)] items-center gap-4 px-6 lg:grid xl:px-8">
          <Link href="/" className="focus-ring flex min-h-12 min-w-0 items-center gap-3 rounded-2xl pr-2" aria-label="Fahrtenbuch – Dashboard">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white p-1 shadow-sm ring-1 ring-[#dbe3ee]">
              <Image src="/brand/logo.png" alt="" width={40} height={40} className="h-full w-full object-contain" priority />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[17px] font-extrabold tracking-[-.025em]">Fahrtenbuch</span>
              <span className="hidden truncate text-[11px] font-medium uppercase tracking-[.14em] text-[#64748b] xl:block">Dienstfahrten</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1.5" aria-label="Hauptnavigation">
            {navigationItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`focus-ring relative inline-flex min-h-12 items-center gap-2 rounded-full px-3.5 text-[14px] font-bold transition-[background-color,color,transform] active:scale-[.98] ${active ? "bg-[#e0ecff] text-[#1d4ed8]" : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#172033]"}`}
                >
                  <FontAwesomeIcon icon={item.icon} className="h-[18px] w-[18px]" />
                  <span>{item.label}</span>
                  {active ? <span aria-hidden="true" className="absolute inset-x-5 -bottom-[5px] h-0.5 rounded-full bg-[#2563eb]" /> : null}
                </Link>
              );
            })}
            <Link href="/?addTrip=1" className="btn-primary focus-ring ml-1 min-h-12 gap-2 rounded-full px-4 text-[14px]">
              <FontAwesomeIcon icon={faPlus} className="h-[18px] w-[18px]" />
              Fahrt hinzufügen
            </Link>
          </nav>

          <div className="flex items-center justify-end gap-2">
            <Link
              href="/settings"
              className={`focus-ring grid h-12 w-12 shrink-0 place-items-center rounded-full transition-[background-color,color,transform] active:scale-95 ${pathname === "/settings" ? "bg-[#e0ecff] text-[#1d4ed8]" : "text-[#475569] hover:bg-[#eff6ff] hover:text-[#2563eb]"}`}
              aria-label="Einstellungen"
              aria-current={pathname === "/settings" ? "page" : undefined}
              title="Einstellungen"
            >
              <FontAwesomeIcon icon={faGear} className="h-5 w-5" />
            </Link>
            <button
              className="focus-ring grid h-12 w-12 shrink-0 place-items-center rounded-full text-[#475569] transition-[background-color,color,transform] hover:bg-[#eff6ff] hover:text-[#2563eb] active:scale-95 disabled:cursor-not-allowed disabled:opacity-55"
              type="button"
              onClick={logout}
              disabled={isPending}
              aria-label={isPending ? "Wird abgemeldet" : "Abmelden"}
              title="Abmelden"
            >
              <FontAwesomeIcon icon={faRightFromBracket} className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div data-mobile-navigation data-testid="mobile-navigation-layer" className="mobile-navigation-layer lg:hidden">
        <div className="mobile-navigation-frame">
          <nav className="mobile-navigation-surface" aria-label="Mobile Hauptnavigation">
            {navigationItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`mobile-navigation-item focus-ring ${active ? "mobile-navigation-item-active" : ""}`}
                >
                  <span className="mobile-navigation-icon" aria-hidden="true">
                    <FontAwesomeIcon icon={item.icon} className="mobile-navigation-glyph" />
                  </span>
                  <span className="mobile-navigation-label">{item.label}</span>
                </Link>
              );
            })}
            <Link href="/?addTrip=1" data-testid="mobile-add-trip" className="mobile-navigation-item mobile-navigation-item-primary focus-ring" aria-label="Fahrt hinzufügen">
              <span className="mobile-navigation-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faPlus} className="mobile-navigation-glyph" />
              </span>
              <span className="mobile-navigation-label">Neue Fahrt</span>
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
}
