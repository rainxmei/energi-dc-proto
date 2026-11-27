import type {
  BackendPengukuranResponse,
  ChannelId,
  ChannelReading,
  DeviceStatus,
  GridWatchSettings,
  PowerPoint,
} from "@/types/gridwatch";
import { DEFAULT_CHANNEL_ICONS, DEFAULT_CHANNEL_NAMES } from "./simulation";
import { formatTimeWIB } from "./format";

export async function fetchBackendPengukuran(
  apiBaseUrl: string,
  limit = 240
): Promise<BackendPengukuranResponse> {
  const cleanBase = apiBaseUrl.replace(/\/+$/, "");
  const url = `${cleanBase}/api/pengukuran?limit=${limit}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return (await res.json()) as BackendPengukuranResponse;
  } finally {
    clearTimeout(timer);
  }
}

export async function sendBackendRelayCommand(
  apiBaseUrl: string,
  channelId: ChannelId,
  nextState: boolean
): Promise<{ ok: boolean; error?: string }> {
  const cleanBase = apiBaseUrl.replace(/\/+$/, "");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);

  try {
    const res = await fetch(`${cleanBase}/api/perintah`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: `relay${channelId}`, nilai: nextState }),
      signal: controller.signal,
    });
    if (res.status === 401) {
      return {
        ok: false,
        error: "Backend memerlukan autentikasi admin untuk mengubah relay.",
      };
    }
    if (!res.ok) {
      return { ok: false, error: `Server menolak perintah (${res.status}).` };
    }
    return { ok: true };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { ok: false, error: "Timeout menunggu konfirmasi server." };
    }
    return { ok: false, error: "Server tidak dapat dijangkau." };
  } finally {
    clearTimeout(timer);
  }
}

export function mapBackendToState(
  payload: BackendPengukuranResponse,
  settings: GridWatchSettings
): {
  channels: ChannelReading[];
  deviceStatus: DeviceStatus;
  series: PowerPoint[];
  todayKwh: number;
} {
  const latestByChannel = new Map<
    ChannelId,
    BackendPengukuranResponse["data"][number]
  >();

  for (const row of payload.data || []) {
    if (row.channel >= 1 && row.channel <= 4) {
      latestByChannel.set(row.channel as ChannelId, row);
    }
  }

  const channels: ChannelReading[] = ([1, 2, 3, 4] as ChannelId[]).map((id) => {
    const latest = latestByChannel.get(id);
    const relayKey = `relay${id}`;
    const relayOn = Boolean(payload.perintah?.[relayKey]);

    return {
      id,
      name: settings.channelNames[id] || DEFAULT_CHANNEL_NAMES[id],
      icon: DEFAULT_CHANNEL_ICONS[id],
      voltageV:
        latest && typeof latest.voltage_v === "number"
          ? latest.voltage_v
          : null,
      currentA:
        latest && typeof latest.current_a === "number"
          ? latest.current_a
          : null,
      powerW:
        latest && typeof latest.power_w === "number" ? latest.power_w : null,
      relayOn,
      commandState: "idle",
      lastUpdatedAt: latest?.created_at || null,
      thresholdW: settings.channelThresholds[id],
    };
  });

  // Group readings by rounded 3-second bucket to form a clean time series
  const buckets = new Map<
    string,
    { ts: string; values: Partial<Record<ChannelId, number>> }
  >();

  for (const row of payload.data || []) {
    const ch = row.channel as ChannelId;
    if (ch < 1 || ch > 4) continue;
    const ms = Date.parse(row.created_at);
    if (Number.isNaN(ms)) continue;
    const bucketKey = String(Math.floor(ms / 3000) * 3000);
    const existing = buckets.get(bucketKey) || {
      ts: row.created_at,
      values: {},
    };
    existing.values[ch] = row.power_w;
    buckets.set(bucketKey, existing);
  }

  const sortedBuckets = Array.from(buckets.entries())
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .slice(-24);

  let energyWh = 0;
  const series: PowerPoint[] = sortedBuckets.map(([, bucket], idx, arr) => {
    const ch1W = bucket.values[1] ?? 0;
    const ch2W = bucket.values[2] ?? 0;
    const ch3W = bucket.values[3] ?? 0;
    const ch4W = bucket.values[4] ?? 0;
    const totalW = Number((ch1W + ch2W + ch3W + ch4W).toFixed(2));
    if (idx > 0) {
      const dtSec = Math.min(
        60,
        Math.max(
          0,
          (Date.parse(bucket.ts) - Date.parse(arr[idx - 1][1].ts)) / 1000
        )
      );
      energyWh += (totalW * dtSec) / 3600;
    }
    return {
      label: formatTimeWIB(bucket.ts),
      timestamp: bucket.ts,
      totalW,
      ch1W,
      ch2W,
      ch3W,
      ch4W,
      energyKwh: Number((energyWh / 1000).toFixed(3)),
    };
  });

  const deviceStatus: DeviceStatus = {
    online: Boolean(payload.status?.online),
    lastSeen: payload.status?.last_seen || null,
    rssi: payload.status?.rssi ?? null,
    uptimeS: payload.status?.uptime_s ?? null,
    ledOn: Boolean(payload.status?.led_on),
  };

  return {
    channels,
    deviceStatus,
    series,
    todayKwh: Number((energyWh / 1000).toFixed(3)),
  };
}
