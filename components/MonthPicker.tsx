"use client";

import { faCalendarDays, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";

const monthNames = Array.from({ length: 12 }, (_, index) => new Intl.DateTimeFormat("de-DE", { month: "short" }).format(new Date(2024, index, 1)));

export function MonthPicker({ value, onChange }: { value: string; onChange: (month: string) => void }) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(Number(value.slice(0, 4)));
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const selectedMonth = Number(value.slice(5, 7));

  useEffect(() => {
    if (!open) return;
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  return <div ref={containerRef} className="relative min-w-0 flex-1 sm:flex-none" onKeyDown={(event) => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    }
  }}>
    <button ref={buttonRef} id="month-picker" type="button" className={`focus-ring flex h-11 w-full min-w-0 items-center gap-2.5 rounded-xl border px-2.5 text-left text-sm font-bold tabular-nums shadow-sm transition-colors sm:w-[190px] sm:px-3 ${open ? "border-[#60a5fa] bg-[#eff6ff] text-[#1d4ed8]" : "border-[#dbe3ee] bg-white text-[#172033] hover:border-[#93c5fd] hover:bg-[#f8fbff]"}`} aria-label="Monat wählen" aria-haspopup="dialog" aria-expanded={open} aria-controls="month-picker-panel" onClick={() => { setYear(Number(value.slice(0, 4))); setOpen((current) => !current); }}>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#eff6ff] text-[#2563eb]"><FontAwesomeIcon icon={faCalendarDays} className="h-4 w-4" /></span>
      <span className="flex-1 truncate">{new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" }).format(new Date(Number(value.slice(0, 4)), selectedMonth - 1, 1))}</span>
      <FontAwesomeIcon icon={faChevronRight} className={`h-3 w-3 text-[#64748b] transition-transform ${open ? "rotate-90" : ""}`} />
    </button>
    {open ? <div id="month-picker-panel" role="dialog" aria-label="Monat auswählen" className="popover-enter absolute left-0 top-full z-30 mt-2 w-[304px] max-w-[calc(100vw-32px)] rounded-2xl border border-[#dbe3ee] bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,.16)] sm:left-auto sm:right-0">
      <div className="mb-4 flex items-center justify-between rounded-xl bg-[#f4f7fc] p-1">
        <button type="button" className="focus-ring grid h-9 w-9 place-items-center rounded-lg text-[#475569] hover:bg-white" aria-label="Vorheriges Jahr" onClick={() => setYear((current) => current - 1)}><FontAwesomeIcon icon={faChevronLeft} className="h-3.5 w-3.5" /></button>
        <strong className="text-base tabular-nums text-[#172033]">{year}</strong>
        <button type="button" className="focus-ring grid h-9 w-9 place-items-center rounded-lg text-[#475569] hover:bg-white" aria-label="Nächstes Jahr" onClick={() => setYear((current) => current + 1)}><FontAwesomeIcon icon={faChevronRight} className="h-3.5 w-3.5" /></button>
      </div>
      <div className="grid grid-cols-3 gap-2">{monthNames.map((name, index) => {
        const selected = year === Number(value.slice(0, 4)) && index + 1 === selectedMonth;
        return <button key={index} type="button" className={`focus-ring h-11 rounded-lg text-sm font-semibold transition-colors ${selected ? "bg-[#2563eb] text-white shadow-sm" : "bg-[#f8fafc] text-[#334155] hover:bg-[#e8f0ff] hover:text-[#1d4ed8]"}`} aria-label={`${new Intl.DateTimeFormat("de-DE", { month: "long" }).format(new Date(2024, index, 1))} ${year}`} aria-pressed={selected} onClick={() => { onChange(`${year}-${String(index + 1).padStart(2, "0")}`); setOpen(false); buttonRef.current?.focus(); }}>{name}</button>;
      })}</div>
    </div> : null}
  </div>;
}
