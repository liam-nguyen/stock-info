/**
 * US equities sessions (America/New_York):
 * - Regular: Mon–Fri, 9:30–16:00.
 * - Extended (pre + post, for cache refresh): Mon–Fri, 4:00–20:00 (continuous band covering
 *   typical ECN pre 4:00–9:30 and after-hours 16:00–20:00).
 * Holidays / early closes are not modeled.
 */

const ET = "America/New_York";

/** Minutes from midnight ET for 4:00 and 20:00 (extended-hours band used for refresh cadence). */
const EXT_OPEN_MIN = 4 * 60;
const EXT_CLOSE_MIN = 20 * 60;

/** Sun=0 … Sat=6 in the America/New_York calendar for this instant. */
function weekdayEt(d: Date): number {
    const wd = new Intl.DateTimeFormat("en-US", { timeZone: ET, weekday: "short" }).format(d);
    const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return map[wd] ?? 0;
}

/** Minutes since local midnight in ET (0–1439). */
function minutesSinceMidnightEt(d: Date): number {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: ET,
        hour: "numeric",
        minute: "numeric",
        hour12: false,
    }).formatToParts(d);
    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
    const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
    return hour * 60 + minute;
}

export function isUsEquitiesRegularSessionOpen(at: Date): boolean {
    const wd = weekdayEt(at);
    if (wd === 0 || wd === 6) {
        return false;
    }
    const m = minutesSinceMidnightEt(at);
    const open = 9 * 60 + 30;
    const close = 16 * 60;
    return m >= open && m < close;
}

/**
 * True during regular hours or extended (pre/post) hours on weekdays — times when we want the
 * same short Redis refresh interval as RTH so pre/post/extended quote fields stay current.
 */
export function isUsEquitiesActiveQuoteRefreshWindow(at: Date): boolean {
    const wd = weekdayEt(at);
    if (wd === 0 || wd === 6) {
        return false;
    }
    const m = minutesSinceMidnightEt(at);
    return m >= EXT_OPEN_MIN && m < EXT_CLOSE_MIN;
}

const RTH_MIN_REFRESH_MS = 3 * 60 * 1000;
const RTH_MAX_REFRESH_MS = 5 * 60 * 1000;

/** First instant at or after `atOrAfterMs` inside the extended-hours refresh window (minute resolution). */
function nextInstantInActiveQuoteRefreshWindowUtc(atOrAfterMs: number): number {
    const max = atOrAfterMs + 10 * 24 * 60 * 60 * 1000;
    let t = atOrAfterMs;
    while (t < max) {
        if (isUsEquitiesActiveQuoteRefreshWindow(new Date(t))) {
            return t;
        }
        t += 60 * 1000;
    }
    return atOrAfterMs + 48 * 60 * 60 * 1000;
}

/**
 * After a successful upstream fetch at `fromMs`, when should we allow the next refresh attempt?
 * - During regular or extended hours (weekday 4:00–20:00 ET): 3–5 minutes.
 * - Otherwise: next time that window opens (+ small jitter), capped at 72h after `fromMs`.
 */
export function computeNextRefreshAt(fromMs: number): number {
    const at = new Date(fromMs);
    if (isUsEquitiesActiveQuoteRefreshWindow(at)) {
        const span = RTH_MAX_REFRESH_MS - RTH_MIN_REFRESH_MS;
        return fromMs + RTH_MIN_REFRESH_MS + Math.floor(Math.random() * span);
    }
    const nextOpen = nextInstantInActiveQuoteRefreshWindowUtc(fromMs + 1);
    const jitter = Math.floor(Math.random() * 60 * 1000);
    const cap = fromMs + 72 * 60 * 60 * 1000;
    return Math.min(nextOpen + jitter, cap);
}
