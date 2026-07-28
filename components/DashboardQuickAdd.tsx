"use client";

import { useRouter } from "next/navigation";
import type { RouteOptionDto } from "@/lib/types";
import { TripModal } from "./TripModal";

export function DashboardQuickAdd({ routeOptions, suggestedOdometerStart, defaultDate }: { routeOptions: RouteOptionDto[]; suggestedOdometerStart: number | null; defaultDate: string }) {
  const router = useRouter();
  return <TripModal month={defaultDate.slice(0, 7)} defaultDate={defaultDate} suggestedOdometerStart={suggestedOdometerStart} routeOptions={routeOptions} onClose={() => router.replace("/")} onSaved={() => { router.replace("/"); router.refresh(); }} />;
}
