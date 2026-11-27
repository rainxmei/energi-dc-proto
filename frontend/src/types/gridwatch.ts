export type ChannelId = 1 | 2 | 3 | 4;

export type TimeRange = "today" | "7d" | "30d";

export type RelayCommandState =
  | "idle"
  | "pending"
  | "confirmed"
  | "failed"
  | "timeout";

export type ConnectionState =
  | "simulation"
  | "online"
  | "esp32_offline"
  | "server_offline"
  | "browser_offline";

export type AlertSeverity = "info" | "warning" | "critical";

export interface ChannelReading {
  id: ChannelId;
  name: string;
  icon: "living" | "office" | "bedroom" | "garden";
  voltageV: number | null;
  currentA: number | null;
  powerW: number | null;
  relayOn: boolean;
  commandState: RelayCommandState;
  commandMessage?: string;
  lastUpdatedAt: string | null;
  thresholdW: number;
}

export interface PowerPoint {
  label: string;
  timestamp: string;
  totalW: number;
  ch1W: number;
  ch2W: number;
  ch3W: number;
  ch4W: number;
  energyKwh: number;
}

export interface AlertItem {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  channelId: ChannelId | null;
  measuredW: number;
  thresholdW: number;
  occurredAt: string;
  resolved: boolean;
}

export interface ActivityItem {
  id: string;
  tone: "normal" | "warning" | "critical" | "info";
  message: string;
  occurredAt: string;
  channelId?: ChannelId | null;
}

export interface ToastItem {
  id: string;
  tone: "normal" | "warning" | "critical" | "info";
  title: string;
  body: string;
  href?: string;
}

export interface DeviceStatus {
  online: boolean;
  lastSeen: string | null;
  rssi: number | null;
  uptimeS: number | null;
  ledOn: boolean;
}

export interface GridWatchSettings {
  dataSource: "auto" | "simulation" | "live";
  apiBaseUrl: string;
  totalThresholdW: number;
  channelThresholds: Record<ChannelId, number>;
  channelNames: Record<ChannelId, string>;
  tariffPerKwh: number;
  notificationsEnabled: boolean;
  cooldownSeconds: number;
}

export interface BackendPengukuranResponse {
  server_time: string;
  status: {
    online: boolean;
    last_seen?: string;
    led_on?: boolean;
    rssi?: number | null;
    uptime_s?: number | null;
  };
  perintah: Record<string, boolean>;
  data: Array<{
    created_at: string;
    channel: number;
    voltage_v: number;
    current_a: number;
    power_w: number;
  }>;
}
