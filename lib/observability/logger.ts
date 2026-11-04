/**
 * Structured Observability, Audit Logging & RED Metrics Instrumentation
 * Follows /observability-and-instrumentation and /security-and-hardening:
 * - Every log line is structured JSON with a stable `event` name, `requestId`, and `entryPoint`
 * - Automatic PII & secret redaction (passwords, tokens, and 16-digit NIK are never logged in plain text)
 * - Low-cardinality RED metrics (Rate, Errors, Duration p50/p95/p99) per route template
 */

export type LogLevel = "info" | "warn" | "error" | "debug";
export type EntryPoint = "api_auth" | "api_members" | "api_activities" | "api_budget" | "api_documents" | "api_users" | "api_system" | "data_store";

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "password_hash",
  "token",
  "secret",
  "authorization",
  "cookie",
]);

function redactValue(key: string, value: unknown): unknown {
  const lowerKey = key.toLowerCase();
  if (SENSITIVE_KEYS.has(lowerKey)) {
    return "[REDACTED]";
  }
  if (lowerKey === "nik" && typeof value === "string" && value.length >= 10) {
    return `${value.slice(0, 6)}******${value.slice(-4)}`;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 10).map((item) =>
      typeof item === "object" && item !== null ? redactObject(item as Record<string, unknown>) : item
    );
  }
  if (typeof value === "object" && value !== null) {
    return redactObject(value as Record<string, unknown>);
  }
  return value;
}

function redactObject(obj: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    safe[k] = redactValue(k, v);
  }
  return safe;
}

export interface TelemetryEvent {
  event: string;
  entryPoint: EntryPoint;
  requestId?: string;
  durationMs?: number;
  statusClass?: "2xx" | "4xx" | "5xx";
  [key: string]: unknown;
}

interface RouteMetricBucket {
  requests: number;
  errors: number;
  durationsMs: number[];
}

const MAX_SAMPLES_PER_ROUTE = 200;
const routeMetrics = new Map<string, RouteMetricBucket>();

export function recordRouteMetric(route: string, status: number, durationMs: number): void {
  let bucket = routeMetrics.get(route);
  if (!bucket) {
    bucket = { requests: 0, errors: 0, durationsMs: [] };
    routeMetrics.set(route, bucket);
  }
  bucket.requests += 1;
  if (status >= 500) {
    bucket.errors += 1;
  }
  if (bucket.durationsMs.length >= MAX_SAMPLES_PER_ROUTE) {
    bucket.durationsMs.shift();
  }
  bucket.durationsMs.push(Math.round(durationMs));
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

export function getMetricsSummary(): Record<
  string,
  { requests: number; errors: number; p50Ms: number; p95Ms: number; p99Ms: number }
> {
  const summary: Record<
    string,
    { requests: number; errors: number; p50Ms: number; p95Ms: number; p99Ms: number }
  > = {};
  for (const [route, bucket] of routeMetrics.entries()) {
    const sorted = [...bucket.durationsMs].sort((a, b) => a - b);
    summary[route] = {
      requests: bucket.requests,
      errors: bucket.errors,
      p50Ms: percentile(sorted, 50),
      p95Ms: percentile(sorted, 95),
      p99Ms: percentile(sorted, 99),
    };
  }
  return summary;
}

export function getOrCreateRequestId(req?: Request): string {
  const existing = req?.headers.get("x-request-id");
  if (existing && /^[a-zA-Z0-9-]{8,64}$/.test(existing)) {
    return existing;
  }
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function emitLog(level: LogLevel, payload: TelemetryEvent, message: string): void {
  const safePayload = redactObject(payload as Record<string, unknown>);
  const record = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...safePayload,
  };
  const serialized = JSON.stringify(record);
  if (level === "error") {
    console.error(serialized);
  } else if (level === "warn") {
    console.warn(serialized);
  } else {
    console.info(serialized);
  }
}

export const logger = {
  info(payload: TelemetryEvent, message: string) {
    emitLog("info", payload, message);
  },
  warn(payload: TelemetryEvent, message: string) {
    emitLog("warn", payload, message);
  },
  error(payload: TelemetryEvent, message: string) {
    emitLog("error", payload, message);
  },
};

