"use client";
import { TripFields, TripSummary, TripTable } from "./TripData";
import { ALL_TRIP_COLUMN_IDS, TRIP_COLUMNS, screenTripColumnLayout, type TripColumnId } from "@/lib/trip-columns";


import { faCheck, faChevronDown, faChevronLeft, faChevronRight, faPlus, faPrint } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import type { MonthDataDto, RouteOptionDto, TripDto } from "@/lib/types";
import { TripModal } from "./TripModal";
import { MonthPicker } from "./MonthPicker";

function monthTitle(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" }).format(new Date(year, monthNumber - 1, 1));
}

function shiftMonth(month: string, delta: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const value = new Date(year, monthNumber - 1 + delta, 1);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}

const numericColumns = new Set<TripColumnId>(["odometerStart", "odometerEnd", "distanceKm", "reimbursedKm", "unreimbursedKm", "potentialReimbursementCents"]);

export function DashboardClient({ initialMonth, todayMonth, todayDate, initialData, routeOptions, initialVisibleColumns }: {
  initialVisibleColumns: TripColumnId[];
  initialMonth: string;
  todayMonth: string;
  todayDate: string;
  initialData: MonthDataDto;
  routeOptions: RouteOptionDto[];
}) {
  const router = useRouter();
  const [visibleColumns, setVisibleColumns] = useState(initialVisibleColumns);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const columnsDropdownRef = useRef<HTMLDivElement>(null);
  const columnsButtonRef = useRef<HTMLButtonElement>(null);
  const [savingColumns, setSavingColumns] = useState(false);
  useEffect(() => {
    if (!columnsOpen) return;
    function closeOutside(event: Event) {
      if (event.target instanceof Node && !columnsDropdownRef.current?.contains(event.target)) setColumnsOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("focusin", closeOutside);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("focusin", closeOutside);
    };
  }, [columnsOpen]);
  useEffect(() => {
    async function refreshColumns() {
      try {
        const response = await fetch("/api/settings/trip-columns", { cache: "no-store" });
        if (response.ok) setVisibleColumns((await response.json()).visibleColumns);
      } catch { /* Keep the last successfully loaded selection. */ }
    }
    window.addEventListener("focus", refreshColumns);
    return () => window.removeEventListener("focus", refreshColumns);
  }, []);
  async function saveColumns(columns: TripColumnId[]) {
    const previousColumns = visibleColumns;
    setVisibleColumns(columns);
    setSavingColumns(true);
    setError("");
    try {
      const response = await fetch("/api/settings/trip-columns", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visibleColumns: columns }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Spalten konnten nicht gespeichert werden.");
      setVisibleColumns(result.visibleColumns);
    } catch (error) { setVisibleColumns(previousColumns); setError(error instanceof Error ? error.message : "Spalten konnten nicht gespeichert werden."); }
    finally { setSavingColumns(false); }
  }
  const [month, setMonth] = useState(initialMonth);
  const [data, setData] = useState(initialData);
  const [availableRouteOptions, setAvailableRouteOptions] = useState(routeOptions);
  const [modal, setModal] = useState<{ key: string; trip?: TripDto } | null>(null);
  const [error, setError] = useState("");
  const [checkingTripId, setCheckingTripId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const desktopTableRef = useRef<HTMLDivElement>(null);
  const desktopScrollRef = useRef<HTMLDivElement>(null);
  const [tableViewportWidth, setTableViewportWidth] = useState<number>();
  const [tableScrollLeft, setTableScrollLeft] = useState(0);
  const [stickyHeaderVisible, setStickyHeaderVisible] = useState(false);

  useLayoutEffect(() => {
    const tableArea = desktopTableRef.current;
    const scrollArea = desktopScrollRef.current;
    const header = scrollArea?.querySelector("thead");
    if (!tableArea || !scrollArea || !header) return;
    function updateSticky() {
      const headerRect = header!.getBoundingClientRect();
      const areaRect = tableArea!.getBoundingClientRect();
      setStickyHeaderVisible(headerRect.bottom <= 0 && areaRect.bottom > headerRect.height);
    }
    function updateWidth() {
      setTableViewportWidth(scrollArea!.clientWidth);
      updateSticky();
    }
    function updateScroll() {
      setTableScrollLeft(scrollArea!.scrollLeft);
      updateSticky();
    }
    const observer = new ResizeObserver(updateWidth);
    observer.observe(scrollArea);
    updateWidth();
    updateScroll();
    scrollArea.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("scroll", updateSticky, { passive: true });
    window.addEventListener("resize", updateSticky);
    return () => {
      observer.disconnect();
      scrollArea.removeEventListener("scroll", updateScroll);
      window.removeEventListener("scroll", updateSticky);
      window.removeEventListener("resize", updateSticky);
    };
  }, [month, visibleColumns, data.trips.length]);

  const screenColumns = TRIP_COLUMNS.filter((column) => visibleColumns.includes(column.id));
  const screenLayout = screenTripColumnLayout(visibleColumns, tableViewportWidth, true);

  async function loadMonth(nextMonth: string) {
    const response = await fetch(`/api/trips?month=${encodeURIComponent(nextMonth)}`);
    if (response.status === 401) {
      router.replace("/login");
      return;
    }
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Monat konnte nicht geladen werden.");
    setMonth(nextMonth);
    setData(result);
  }

  function navigate(nextMonth: string) {
    if (nextMonth === month) return;
    setError("");
    startTransition(async () => {
      try { await loadMonth(nextMonth); }
      catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Monat konnte nicht geladen werden."); }
    });
  }

  function refreshAfterChange(date: string, createdRoutePairId?: number) {
    const targetMonth = date.slice(0, 7);
    if (createdRoutePairId) {
      setAvailableRouteOptions((current) => current.map((option) => option.routePairId === createdRoutePairId
        ? { ...option, lastTripDate: !option.lastTripDate || date > option.lastTripDate ? date : option.lastTripDate }
        : option));
    }
    setModal(null);
    startTransition(async () => {
      try { await loadMonth(targetMonth); }
      catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Daten konnten nicht aktualisiert werden."); }
    });
  }

  async function toggleChecked(trip: TripDto) {
    setCheckingTripId(trip.id);
    try {
      const response = await fetch(`/api/trips/${trip.id}/checked`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isChecked: !trip.isChecked }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Status konnte nicht geändert werden.");
      setData((current) => ({ ...current, trips: current.trips.map((item) => item.id === trip.id ? result.trip : item) }));
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Status konnte nicht geändert werden.");
    } finally {
      setCheckingTripId(null);
    }
  }

  return (
    <section>
      <div className="section-enter mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[.16em] text-[#475569]">Monatsübersicht</p>
          <h1 className="text-[30px] font-extrabold capitalize tracking-[-.04em] sm:text-[32px] lg:text-[34px]">{monthTitle(month)}</h1>
          <p className="mt-1 text-sm text-[#64748b]">Alle Dienstfahrten und Kilometer auf einen Blick.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <a className="btn-secondary focus-ring px-3 sm:px-5" href={`/print?month=${month}`} target="_blank" rel="noopener noreferrer">
            <FontAwesomeIcon icon={faPrint} className="h-[18px] w-[18px]" />
            Drucken
          </a>
          <button className="btn-primary focus-ring px-3 sm:px-5" type="button" onClick={() => setModal({ key: `new-${Date.now()}` })} disabled={routeOptions.length === 0}>
            <FontAwesomeIcon icon={faPlus} className="h-[18px] w-[18px]" /> Neue Fahrt
          </button>
        </div>
      </div>

      <div className="section-enter relative z-40 mb-4 flex flex-col gap-3 rounded-2xl border border-[#dbe3ee] bg-white p-2.5 shadow-[0_2px_12px_rgba(15,23,42,.035)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1">
          <button className="btn-ghost focus-ring h-11 w-11 p-0 text-xl lg:h-10 lg:w-10" type="button" aria-label="Vorheriger Monat" onClick={() => navigate(shiftMonth(month, -1))}><FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" /></button>
          <button className="btn-ghost focus-ring h-11 w-11 p-0 text-xl lg:h-10 lg:w-10" type="button" aria-label="Nächster Monat" onClick={() => navigate(shiftMonth(month, 1))}><FontAwesomeIcon icon={faChevronRight} className="h-4 w-4" /></button>
          <button className="btn-secondary focus-ring ml-1" type="button" onClick={() => navigate(todayMonth)}>Heute</button>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">
          {isPending ? <span className="text-sm text-[#64748b]">Wird geladen …</span> : null}
          <span className="hidden shrink-0 text-sm font-semibold text-[#475569] sm:inline">Monat</span>
          <MonthPicker value={month} onChange={navigate} />
          <div ref={columnsDropdownRef} className="relative shrink-0" onKeyDown={(event) => {
            if (event.key === "Escape" && columnsOpen) {
              event.preventDefault();
              setColumnsOpen(false);
              columnsButtonRef.current?.focus();
            }
          }}>
            <button ref={columnsButtonRef} type="button" className="btn-secondary focus-ring" aria-expanded={columnsOpen} aria-controls="trip-columns-dropdown" onClick={() => setColumnsOpen((open) => !open)}>
              Spalten <FontAwesomeIcon icon={faChevronDown} className={`h-3 w-3 transition-transform ${columnsOpen ? "rotate-180" : ""}`} />
            </button>
            {columnsOpen ? <div id="trip-columns-dropdown" className="popover-enter absolute right-0 top-full z-30 mt-2 max-h-[70vh] w-[310px] max-w-[calc(100vw-48px)] overflow-y-auto rounded-xl border border-[#dbe3ee] bg-white p-3 shadow-[0_12px_35px_rgba(15,23,42,.14)]">
              <fieldset disabled={savingColumns}>
                <legend className="sr-only">Sichtbare Spalten</legend>
                {TRIP_COLUMNS.map((column) => <label key={column.id} className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-2 py-1 text-sm hover:bg-[#f8fafc]"><input type="checkbox" className="focus-ring h-4 w-4 shrink-0 accent-[#2563eb]" checked={visibleColumns.includes(column.id)} disabled={visibleColumns.length === 1 && visibleColumns.includes(column.id)} onChange={(event) => void saveColumns(event.target.checked ? [...visibleColumns, column.id] : visibleColumns.filter((id) => id !== column.id))} />{column.label}</label>)}
                <button type="button" className="btn-secondary focus-ring mt-2 w-full" onClick={() => void saveColumns([...ALL_TRIP_COLUMN_IDS])}>Alle anzeigen</button>
              </fieldset>
            </div> : null}
          </div>
        </div>
      </div>
      {error ? <p className="status-enter mb-4 rounded-xl border border-[#f1d2cf] bg-[#fff4f3] px-4 py-3 text-sm text-[#a33c36]">{error}</p> : null}

      {routeOptions.length === 0 ? (
        <div className="status-enter mb-4 flex flex-col gap-3 rounded-2xl border border-[#dbeafe] bg-[#eff6ff] px-5 py-4 text-sm text-[#1e40af] sm:flex-row sm:items-center sm:justify-between">
          <span><strong>Noch kein Reiseweg vorhanden.</strong> Lege zuerst mindestens eine Strecke an.</span>
          <a href="/settings" className="font-extrabold underline underline-offset-4">Zu den Einstellungen</a>
        </div>
      ) : null}

      <div ref={desktopTableRef} key={`desktop-${month}`} className={`relative hidden lg:block ${isPending ? "opacity-65" : ""}`}>
        <div className="trip-sticky-header" data-testid="trip-sticky-header" data-visible={stickyHeaderVisible} aria-hidden="true">
          <div className="trip-sticky-header-viewport" style={{ width: tableViewportWidth }}>
            <div className="trip-sticky-header-row" style={{ width: screenLayout.tableWidth, gridTemplateColumns: [...screenLayout.columnWidths, screenLayout.actionWidth].map((width) => `${width}px`).join(" "), transform: `translateX(-${tableScrollLeft}px)` }}>
              {screenColumns.map((column) => <div key={column.id} className={`trip-sticky-header-cell ${numericColumns.has(column.id) ? "text-right" : ""}`} data-column={column.id}><span className="trip-column-info">{column.headerInfo}</span><span className="trip-column-title">{column.headerTitle}</span></div>)}
              <div className="trip-sticky-header-cell" />
            </div>
          </div>
        </div>
        <div ref={desktopScrollRef} data-testid="trip-scroll-area" className="section-enter overflow-x-auto rounded-[20px] border border-[#dbe3ee] bg-white">
          <TripTable data={data} visibleColumns={visibleColumns} screenWidth={tableViewportWidth} onEdit={(trip) => setModal({ key: `edit-${trip.id}`, trip })} action={(trip) => <button type="button" className={`focus-ring mx-auto grid h-7 w-7 place-items-center rounded-lg border ${trip.isChecked ? "border-[#86efac] bg-[#dcfce7] text-[#15803d]" : "border-[#cbd5e1] bg-white text-[#64748b]"}`} aria-label={trip.isChecked ? "Als nicht übernommen markieren" : "Als übernommen markieren"} aria-pressed={trip.isChecked} disabled={checkingTripId === trip.id} onClick={() => void toggleChecked(trip)}><FontAwesomeIcon icon={faCheck} className={`h-4 w-4 ${trip.isChecked ? "" : "opacity-20"}`} /></button>} />
        </div>
      </div>
      <div key={`mobile-${month}`} className={`space-y-3 lg:hidden ${isPending ? "opacity-65" : ""}`}>
        {data.trips.length ? data.trips.map((trip) => <article key={trip.id} data-testid="mobile-trip-card" className={`rounded-2xl border p-4 ${trip.isChecked ? "border-[#bbf7d0] bg-[#f0fdf4]" : "border-[#dbe3ee] bg-white"}`}>
          <button type="button" className="focus-ring w-full text-left" aria-label={`Fahrt ${trip.sequenceNumber} bearbeiten`} onClick={() => setModal({ key: `edit-${trip.id}`, trip })}><TripFields trip={trip} visibleColumns={visibleColumns} /></button>
          <button type="button" className="btn-secondary focus-ring mt-3 w-full" aria-pressed={trip.isChecked} disabled={checkingTripId === trip.id} onClick={() => void toggleChecked(trip)}>{trip.isChecked ? "✓ Ins analoge Fahrtenbuch übernommen" : "Als übernommen markieren"}</button>
        </article>) : <div className="rounded-2xl bg-white p-10 text-center">Noch keine Fahrten in diesem Monat</div>}
        <TripSummary data={data} visibleColumns={visibleColumns} />
      </div>

      <p className="mt-3 text-right text-xs text-[#64748b]">{data.trips.length} {data.trips.length === 1 ? "Fahrt" : "Fahrten"}</p>

      {modal ? (
        <TripModal
          key={modal.key}
          trip={modal.trip}
          month={month}
          defaultDate={todayDate}
          suggestedOdometerStart={data.suggestedOdometerStart}
          routeOptions={availableRouteOptions}
          onClose={() => setModal(null)}
          onSaved={refreshAfterChange}
        />
      ) : null}
    </section>
  );
}
