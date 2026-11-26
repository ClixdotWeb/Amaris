import type { ProductionStatus } from "@/types";

export const PRODUCTION_LABELS: Record<ProductionStatus, string> = {
  not_started: "Not started",
  cutting: "Cutting",
  stitching: "Stitching",
  ready: "Ready",
};
