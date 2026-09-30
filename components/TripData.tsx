import { TripPlaceNote, tripPlaceText } from "./TripPlaceNote";
import { TRIP_COLUMNS, TRIP_PRINT_COLUMN_WIDTHS, TRIP_TEXT_COLUMN_IDS, screenTripColumnLayout, tripColumnTotal, tripColumnValue, type TripColumnId } from "@/lib/trip-columns";
import type { MonthDataDto, TripDto } from "@/lib/types";
import type { ReactNode } from "react";

export function TripValue({ trip, column, showPlaceNote = false }: { trip: TripDto; column: TripColumnId; showPlaceNote?: boolean }) {
  return <>{tripColumnValue(trip, column)}{showPlaceNote && column === "routeLabel" ? <TripPlaceNote originFullName={trip.originFullName} destinationFullName={trip.destinationFullName} /> : null}</>;
}
export function TripFields({ trip, visibleColumns }: { trip: TripDto; visibleColumns: TripColumnId[] }) {
  return <span className="grid min-w-0 grid-cols-2 gap-3 text-sm">{TRIP_COLUMNS.filter((column) => visibleColumns.includes(column.id)).map((column) => <span key={column.id} className={`min-w-0 ${["routeLabel", "accompanyingStaff", "remark"].includes(column.id) ? "col-span-2" : ""}`}>
    <span className="block text-[10px] font-bold uppercase text-[#64748b]">{column.label}</span>
    <span className="mt-1 block whitespace-pre-wrap font-semibold [overflow-wrap:anywhere]"><TripValue trip={trip} column={column.id} /></span>
  </span>)}</span>;
}
export function TripSummary({ data, visibleColumns }: { data: MonthDataDto; visibleColumns: TripColumnId[] }) {
  const columns = TRIP_COLUMNS.filter((column) => visibleColumns.includes(column.id) && tripColumnTotal(data, column.id) !== null);
  return columns.length ? <div className="mt-4 rounded-xl bg-[#eff6ff] p-4" aria-label="Gesamt im Monat"><p className="mb-2 text-xs font-extrabold">Gesamt im Monat</p><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{columns.map((column) => <div key={column.id}><p className="text-[10px] font-bold text-[#64748b]">{column.label}</p><p className="font-extrabold">{tripColumnTotal(data, column.id)}</p></div>)}</div></div> : null;
}
export function TripTable({ data, visibleColumns, onEdit, action, print = false, showTotals = true, screenWidth }: {
  data: MonthDataDto; visibleColumns: TripColumnId[]; onEdit?: (trip: TripDto) => void;
  action?: (trip: TripDto) => ReactNode; print?: boolean; showTotals?: boolean; screenWidth?: number;
}) {
  const columns = TRIP_COLUMNS.filter((column) => visibleColumns.includes(column.id));
  const firstTotal = columns.findIndex((column) => tripColumnTotal(data, column.id) !== null);
  const widths = TRIP_PRINT_COLUMN_WIDTHS;
  const flexibleColumns = columns.filter((column) => TRIP_TEXT_COLUMN_IDS.includes(column.id));
  const screenLayout = screenTripColumnLayout(visibleColumns, screenWidth, Boolean(action));
  const minimumWidth = columns.reduce((sum, column) => sum + widths[column.id], 0) + (action ? screenLayout.actionWidth : 0);
  const flexibleWeight = flexibleColumns.reduce((sum, column) => sum + widths[column.id], 0);
  const fixedWidth = minimumWidth - flexibleWeight;
  return <table style={{ minWidth: print ? undefined : screenLayout.tableWidth, width: print ? (flexibleColumns.length ? "100%" : minimumWidth) : screenLayout.tableWidth }} className={`trip-table table-fixed border-collapse text-left ${print ? "print-table text-[9px]" : "trip-screen-table text-sm"}`}>
    <colgroup>{columns.map((column, index) => <col key={column.id} style={{ width: print ? (TRIP_TEXT_COLUMN_IDS.includes(column.id) ? `calc((100% - ${fixedWidth}px) * ${widths[column.id] / flexibleWeight})` : widths[column.id]) : screenLayout.columnWidths[index] }} />)}{action ? <col style={{ width: screenLayout.actionWidth }} /> : null}</colgroup>
    <thead><tr className={`border-b border-[#dbe3ee] bg-[#f8fafc] ${print ? "text-[11px]" : "text-sm"} font-extrabold text-[#64748b]`}>{columns.map((column) => <th key={column.id} scope="col" aria-label={column.label} data-column={column.id}><span className="trip-column-info">{column.headerInfo}</span><span className="trip-column-title">{column.headerTitle}</span></th>)}{action ? <th scope="col"><span className="sr-only">Übernommen</span></th> : null}</tr></thead>
    <tbody>{data.trips.length ? data.trips.map((trip, index) => <tr key={`${trip.id}-${index}`} data-testid={print ? undefined : "desktop-trip"} data-checked={print ? undefined : trip.isChecked} data-editable={print ? undefined : Boolean(onEdit)} className={`border-b border-[#edf1f7] ${onEdit ? "cursor-pointer" : ""}`} onClick={onEdit ? () => onEdit(trip) : undefined}>
      {columns.map((column) => {
        const value = tripColumnValue(trip, column.id);
        const place = column.id === "routeLabel" ? tripPlaceText(trip.originFullName, trip.destinationFullName) : "";
        return <td key={column.id} data-column={column.id}>{print ? <TripValue trip={trip} column={column.id} showPlaceNote /> : <span className="trip-cell-value" title={place ? `${value}\n${place}` : value}>{value}</span>}{print && column.id === columns[0].id && (trip as TripDto & { printContinuation?: boolean }).printContinuation ? <span className="block text-[7px] font-normal text-[#64748b]">Fortsetzung</span> : null}{onEdit && column.id === columns[0].id ? <button type="button" className="sr-only focus:not-sr-only focus-ring focus:absolute focus:inset-0 focus:grid focus:place-items-center focus:bg-white text-[10px] text-[#2563eb]" aria-label={`Fahrt ${trip.sequenceNumber} bearbeiten`} onClick={(event) => { event.stopPropagation(); onEdit(trip); }}>Bearbeiten</button> : null}</td>;
      })}
      {action ? <td onClick={(event) => event.stopPropagation()}>{action(trip)}</td> : null}
    </tr>) : <tr><td colSpan={columns.length + (action ? 1 : 0)} className="!py-12 text-center">Noch keine Fahrten in diesem Monat</td></tr>}</tbody>
    {showTotals ? <tfoot><tr className="border-t-2 border-[#2563eb] bg-[#eff6ff] font-extrabold" aria-label="Gesamt im Monat">
      {firstTotal !== 0 ? <td colSpan={firstTotal < 0 ? columns.length : firstTotal}>Gesamt im Monat</td> : null}
      {firstTotal >= 0 ? columns.slice(firstTotal).map((column) => <td key={column.id} data-column={column.id}>{tripColumnTotal(data, column.id)}</td>) : null}
      {action ? <td /> : null}
    </tr></tfoot> : null}
  </table>;
}
