import type {
  ActivityItem,
  ChannelId,
  ChannelReading,
  GridWatchSettings,
  PowerPoint,
  TimeRange,
} from "@/types/gridwatch";

export const DEFAULT_CHANNEL_NAMES: Record<ChannelId, string> = {
  1: "Ruang Keluarga",
  2: "Ruang Kerja",
  3: "Kamar Tidur",
  4: "Taman",
};

export const DEFAULT_CHANNEL_ICONS: Record<
  ChannelId,
  ChannelReading["icon"]
> = {
  1: "living",
  2: "office",
  3: "bedroom",
  4: "garden",
};

export const DEFAULT_CHANNEL_BASE_W: Record<ChannelId, number> = {
  1: 120,
  2: 86,
  3: 336,
  4: 96,
};

export const DEFAULT_SETTINGS: GridWatchSettings = {
  dataSource: "auto",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "",
  totalThresholdW: 600,
  channelThresholds: {
    1: 220,
    2: 180,
    3: 380,
    4: 150,
  },
  channelNames: { ...DEFAULT_CHANNEL_NAMES },
  tariffPerKwh: 1500,
  notificationsEnabled: true,
  cooldownSeconds: 30,
};

const INITIAL_REF_ISO = "2026-11-26T10:00:00.000Z";

export function createInitialSimChannels(
  settings: GridWatchSettings
): ChannelReading[] {
  const initialRelay: Record<ChannelId, boolean> = {
    1: true,
    2: true,
    3: true,
    4: false,
  };

  return ([1, 2, 3, 4] as ChannelId[]).map((id) => {
    const isOn = initialRelay[id];
    const powerW = isOn ? DEFAULT_CHANNEL_BASE_W[id] : 0;
    const voltageV = 220.4 + (id - 2) * 0.3;
    const currentA = isOn ? Number((powerW / voltageV).toFixed(2)) : 0;

    return {
      id,
      name: settings.channelNames[id] || DEFAULT_CHANNEL_NAMES[id],
      icon: DEFAULT_CHANNEL_ICONS[id],
      voltageV: Number(voltageV.toFixed(1)),
      currentA,
      powerW,
      relayOn: isOn,
      commandState: "idle",
      lastUpdatedAt: INITIAL_REF_ISO,
      thresholdW: settings.channelThresholds[id],
    };
  });
}

export function tickSimChannels(
  prev: ChannelReading[],
  settings: GridWatchSettings,
  spikeBonusW: number
): ChannelReading[] {
  const now = new Date().toISOString();
  return prev.map((ch) => {
    const name = settings.channelNames[ch.id] || DEFAULT_CHANNEL_NAMES[ch.id];
    const thresholdW = settings.channelThresholds[ch.id];
    if (!ch.relayOn) {
      return {
        ...ch,
        name,
        thresholdW,
        powerW: 0,
        currentA: 0,
        voltageV: 220.2,
        lastUpdatedAt: now,
      };
    }

    const base = DEFAULT_CHANNEL_BASE_W[ch.id];
    const drift = (Math.random() - 0.48) * base * 0.04;
    const bonus = ch.id === 3 ? spikeBonusW : 0;
    const nextPower = Math.max(4, Math.round(base + drift + bonus));
    const voltageV = Number((219.8 + Math.random() * 1.6).toFixed(1));
    const currentA = Number((nextPower / voltageV).toFixed(2));

    return {
      ...ch,
      name,
      thresholdW,
      powerW: nextPower,
      voltageV,
      currentA,
      lastUpdatedAt: now,
    };
  });
}

export function buildSimulatedSeries(
  range: TimeRange,
  liveChannels: ChannelReading[]
): PowerPoint[] {
  const now = new Date();
  const currentTotal = liveChannels.reduce(
    (sum, c) => sum + (c.powerW ?? 0),
    0
  );

  if (range === "today") {
    const slots = [
      { h: "00:00", w: 215 },
      { h: "02:00", w: 280 },
      { h: "04:00", w: 410 },
      { h: "06:00", w: 385 },
      { h: "08:00", w: 485 },
      { h: "10:00", w: 365 },
      { h: "12:00", w: 480 },
      { h: "14:00", w: 445 },
      { h: "16:00", w: 595 },
      { h: "17:00", w: 620 },
      { h: "19:00", w: 560 },
      { h: "21:00", w: Math.round(currentTotal) || 542 },
    ];
    return slots.map((slot, index) => {
      const ts = new Date(now.getTime() - (slots.length - 1 - index) * 7200_000);
      const totalW = index === slots.length - 1 ? currentTotal : slot.w;
      const ch1W = Math.round(totalW * 0.22);
      const ch2W = Math.round(totalW * 0.16);
      const ch3W = Math.round(totalW * 0.62);
      const ch4W = Math.max(0, totalW - ch1W - ch2W - ch3W);
      return {
        label: slot.h,
        timestamp: ts.toISOString(),
        totalW,
        ch1W,
        ch2W,
        ch3W,
        ch4W,
        energyKwh: Number(((totalW * 2) / 1000).toFixed(2)),
      };
    });
  }

  if (range === "7d") {
    const days = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
    const baseTotals = [480, 515, 560, 495, 585, 610, currentTotal || 542];
    const dailyKwh = [2.15, 2.34, 2.71, 2.28, 2.82, 2.65, 2.48];
    return days.map((day, idx) => {
      const ts = new Date(now.getTime() - (6 - idx) * 86_400_000);
      const totalW = baseTotals[idx];
      return {
        label: day,
        timestamp: ts.toISOString(),
        totalW,
        ch1W: Math.round(totalW * 0.23),
        ch2W: Math.round(totalW * 0.17),
        ch3W: Math.round(totalW * 0.56),
        ch4W: Math.round(totalW * 0.04),
        energyKwh: dailyKwh[idx],
      };
    });
  }

  const points: PowerPoint[] = [];
  for (let i = 14; i >= 0; i--) {
    const ts = new Date(now.getTime() - i * 2 * 86_400_000);
    const wave = Math.sin(i * 0.65) * 65 + Math.cos(i * 0.35) * 35;
    const totalW = i === 0 ? currentTotal : Math.round(520 + wave);
    const label = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      timeZone: "Asia/Jakarta",
    }).format(ts);
    points.push({
      label,
      timestamp: ts.toISOString(),
      totalW,
      ch1W: Math.round(totalW * 0.24),
      ch2W: Math.round(totalW * 0.18),
      ch3W: Math.round(totalW * 0.53),
      ch4W: Math.round(totalW * 0.05),
      energyKwh: Number((totalW * 0.0046).toFixed(2)),
    });
  }
  return points;
}

export function createInitialActivities(): ActivityItem[] {
  return [
    {
      id: "act-init-1",
      tone: "normal",
      message: "Kanal 3 (Kamar Tidur) dinyalakan",
      occurredAt: "2026-11-26T10:00:00.000Z",
      channelId: 3,
    },
    {
      id: "act-init-2",
      tone: "warning",
      message: "Daya mencapai puncak 620 W pada pukul 17.00",
      occurredAt: "2026-11-26T09:45:00.000Z",
      channelId: null,
    },
    {
      id: "act-init-3",
      tone: "normal",
      message: "Kanal 1 (Ruang Keluarga) dinyalakan",
      occurredAt: "2026-11-26T00:45:00.000Z",
      channelId: 1,
    },
  ];
}
