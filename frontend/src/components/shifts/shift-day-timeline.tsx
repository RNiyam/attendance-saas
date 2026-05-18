"use client";

const DAY_MIN = 24 * 60;

export function parseTimeToMinutes(value: string): number {
  if (!value) return 0;
  const [h, m] = value.split(":").map((x) => parseInt(x, 10));
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

function shiftSegmentsWithinDay(startMin: number, endMin: number): { from: number; to: number }[] {
  if (endMin > startMin) return [{ from: startMin, to: endMin }];
  if (endMin === startMin) return [];
  return [
    { from: startMin, to: DAY_MIN },
    { from: 0, to: endMin },
  ];
}

function rangeSegmentsWithinDay(startMin: number, endMin: number): { from: number; to: number }[] {
  return shiftSegmentsWithinDay(startMin, endMin);
}

function segmentLength(a: number, b: number): number {
  return Math.max(0, b - a);
}

function overlapLen(
  seg: { from: number; to: number },
  lo: number,
  hi: number,
): number {
  const s = Math.max(seg.from, lo);
  const e = Math.min(seg.to, hi);
  return Math.max(0, e - s);
}

export type TimelineBreak = {
  start?: string | null;
  end?: string | null;
  bufferStart?: string | null;
  bufferEnd?: string | null;
  durationMinutes?: number | null;
  ruleType?: "interval" | "duration";
  payType?: "paid" | "unpaid";
};

export function computeShiftStats(
  start: string,
  end: string,
  breaks: TimelineBreak[],
): { grossMinutes: number; breakMinutes: number; netMinutes: number; maxBreakMinutes: number } {
  const s = parseTimeToMinutes(start);
  const e = parseTimeToMinutes(end);
  const shiftParts = shiftSegmentsWithinDay(s, e);
  const grossMinutes = shiftParts.reduce((acc, p) => acc + segmentLength(p.from, p.to), 0);

  let breakMinutes = 0;
  const eachBreak: number[] = [];
  for (const br of breaks) {
    if (br.ruleType === "duration") {
      const len = Math.max(0, Number(br.durationMinutes ?? 0));
      eachBreak.push(len);
      if (br.payType !== "paid") breakMinutes += len;
      continue;
    }
    if (!br.start || !br.end) continue;
    const bs = parseTimeToMinutes(br.start);
    const be = parseTimeToMinutes(br.end);
    let len = 0;
    for (const breakPart of rangeSegmentsWithinDay(bs, be)) {
      if (shiftParts.length) {
        for (const shiftPart of shiftParts) {
          len += overlapLen(shiftPart, breakPart.from, breakPart.to);
        }
      } else {
        len += segmentLength(breakPart.from, breakPart.to);
      }
    }
    eachBreak.push(len);
    if (br.payType !== "paid") breakMinutes += len;
  }

  const maxBreakMinutes = eachBreak.length ? Math.max(...eachBreak) : 0;
  const netMinutes = Math.max(0, grossMinutes - breakMinutes);
  return { grossMinutes, breakMinutes, netMinutes, maxBreakMinutes };
}

function formatHm(total: number): string {
  const safeTotal = Math.max(0, total);
  const h = Math.floor(safeTotal / 60);
  const m = safeTotal % 60;
  return `${h}h ${m}m`;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function formatTimeLabel(value: string): string {
  const mins = parseTimeToMinutes(value);
  const h24 = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${pad2(h12)}:${pad2(m)} ${ampm}`;
}

type BarSeg = { key: string; leftPct: number; widthPct: number; color: string; z: number };
type TimeMarker = { key: string; minute: number; label: string; color: string };

function markerLeftPct(minute: number) {
  return Math.min(98, Math.max(2, (minute / DAY_MIN) * 100));
}

export function ShiftDayTimeline({
  startTime,
  endTime,
  earliestPunchIn,
  latestPunchOut,
  breaks,
}: {
  startTime: string;
  endTime: string;
  earliestPunchIn: string;
  latestPunchOut: string;
  breaks: TimelineBreak[];
}) {
  const hasShiftWindow = Boolean(startTime && endTime);
  const s = hasShiftWindow ? parseTimeToMinutes(startTime) : 0;
  const e = hasShiftWindow ? parseTimeToMinutes(endTime) : 0;
  const shiftParts = hasShiftWindow ? shiftSegmentsWithinDay(s, e) : [];
  const drawableParts = shiftParts.length ? shiftParts : [{ from: 0, to: DAY_MIN }];

  const earliest = earliestPunchIn ? parseTimeToMinutes(earliestPunchIn) : null;
  const latest = latestPunchOut ? parseTimeToMinutes(latestPunchOut) : null;

  const segs: BarSeg[] = [];
  const markers: TimeMarker[] = [];

  const firstIntervalBreak = breaks.find((br) => br.ruleType !== "duration" && (br.bufferStart || br.start));
  const primaryMarkerTime = firstIntervalBreak?.bufferStart || firstIntervalBreak?.start || startTime;
  const primaryMarkerColor = firstIntervalBreak ? "#F6B96B" : "#A855F7";

  if (primaryMarkerTime) {
    markers.push({
      key: "primary-start",
      minute: parseTimeToMinutes(primaryMarkerTime),
      label: formatTimeLabel(primaryMarkerTime),
      color: primaryMarkerColor,
    });
  }

  if (earliest !== null && shiftParts.length) {
    const firstFrom = shiftParts[0].from;
    if (earliest < firstFrom) {
      segs.push({
        key: "buf-pre",
        leftPct: (earliest / DAY_MIN) * 100,
        widthPct: ((firstFrom - earliest) / DAY_MIN) * 100,
        color: "rgba(234, 179, 8, 0.55)",
        z: 1,
      });
    }
  }

  if (latest !== null && shiftParts.length) {
    const lastTo = shiftParts[shiftParts.length - 1].to;
    if (latest > lastTo) {
      segs.push({
        key: "buf-post",
        leftPct: (lastTo / DAY_MIN) * 100,
        widthPct: ((latest - lastTo) / DAY_MIN) * 100,
        color: "rgba(234, 179, 8, 0.55)",
        z: 1,
      });
    }
  }

  shiftParts.forEach((part, i) => {
    segs.push({
      key: `sh-${i}`,
      leftPct: (part.from / DAY_MIN) * 100,
      widthPct: ((part.to - part.from) / DAY_MIN) * 100,
      color: "rgba(168, 85, 247, 0.55)",
      z: 2,
    });
  });

  breaks.forEach((br, i) => {
    if (br.ruleType === "duration" || !br.start || !br.end) return;
    const bufStart = br.bufferStart ? parseTimeToMinutes(br.bufferStart) : null;
    const bufEnd = br.bufferEnd ? parseTimeToMinutes(br.bufferEnd) : null;
    if (bufStart !== null && bufEnd !== null && br.bufferStart && br.bufferEnd) {
      for (const bufferPart of rangeSegmentsWithinDay(bufStart, bufEnd)) {
        for (const part of drawableParts) {
          const lo = Math.max(part.from, bufferPart.from);
          const hi = Math.min(part.to, bufferPart.to);
          if (hi <= lo) continue;
          segs.push({
            key: `brk-buf-${i}-${lo}`,
            leftPct: (lo / DAY_MIN) * 100,
            widthPct: ((hi - lo) / DAY_MIN) * 100,
            color: "rgba(190, 242, 100, 0.8)",
            z: 3,
          });
        }
      }
    }
    const bs = parseTimeToMinutes(br.start);
    const be = parseTimeToMinutes(br.end);
    for (const breakPart of rangeSegmentsWithinDay(bs, be)) {
      for (const part of drawableParts) {
        const lo = Math.max(part.from, breakPart.from);
        const hi = Math.min(part.to, breakPart.to);
        if (hi <= lo) continue;
        segs.push({
          key: `brk-${i}-${lo}`,
          leftPct: (lo / DAY_MIN) * 100,
          widthPct: ((hi - lo) / DAY_MIN) * 100,
          color: br.payType === "paid" ? "rgba(59, 130, 246, 0.6)" : "rgba(249, 115, 22, 0.65)",
          z: 4,
        });
      }
    }
  });

  const stats = computeShiftStats(startTime, endTime, breaks);

  const hasMarkers = markers.length > 0;

  return (
    <div className="space-y-3">
      {/* Bar + markers wrapper — only as tall as needed */}
      <div className="relative w-full" style={{ paddingTop: hasMarkers ? "28px" : "0px" }}>
        {/* Markers sit above the bar, within the padded top space */}
        {markers.map((marker) => (
          <div
            key={marker.key}
            className="absolute -translate-x-1/2 whitespace-nowrap text-center text-[10px] font-black leading-none"
            style={{
              left: `${markerLeftPct(marker.minute)}%`,
              top: 0,
              color: marker.color,
            }}
          >
            <span>{marker.label}</span>
            {/* tick line connecting label to bar */}
            <span
              className="mx-auto mt-1 block w-px"
              style={{ height: "10px", backgroundColor: marker.color }}
            />
          </div>
        ))}

        {/* The actual bar — flush at bottom of wrapper */}
        <div className="relative h-11 w-full overflow-hidden rounded-lg bg-[#EEF2F6]">
          {segs
            .sort((a, b) => a.z - b.z)
            .map((seg) => (
              <div
                key={seg.key}
                className="absolute top-0 h-full rounded-sm"
                style={{
                  left: `${seg.leftPct}%`,
                  width: `${seg.widthPct}%`,
                  backgroundColor: seg.color,
                  zIndex: seg.z,
                }}
              />
            ))}
        </div>
      </div>

      {/* Legend + stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[12px] font-medium text-[#475467]">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#BEF264]" /> Buffer
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FB923C]" /> Unpaid break
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#3B82F6]" /> Paid break
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#A855F7]" /> Shift
          </span>
        </div>
        <div className="flex flex-wrap gap-4 text-[11px] font-semibold text-[#64748B]">
          <span>Max break minutes: {stats.maxBreakMinutes} mins</span>
          <span>Net payable hours: {formatHm(stats.netMinutes)}</span>
        </div>
      </div>
    </div>
  );
}