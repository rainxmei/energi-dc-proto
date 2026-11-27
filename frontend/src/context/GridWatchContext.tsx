"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ActivityItem,
  AlertItem,
  ChannelId,
  ChannelReading,
  ConnectionState,
  DeviceStatus,
  GridWatchSettings,
  PowerPoint,
  TimeRange,
  ToastItem,
} from "@/types/gridwatch";
import {
  buildSimulatedSeries,
  createInitialActivities,
  createInitialSimChannels,
  DEFAULT_SETTINGS,
  tickSimChannels,
} from "@/lib/simulation";
import {
  fetchBackendPengukuran,
  mapBackendToState,
  sendBackendRelayCommand,
} from "@/lib/api";
import {
  type BrowserNotificationPermission,
  getNotificationPermission,
  requestNotificationPermission,
  sendBrowserNotification,
} from "@/lib/notifications";
import { formatWatts } from "@/lib/format";

const SETTINGS_KEY = "gridwatch.settings.v1";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface GridWatchContextValue {
  isHydrated: boolean;
  isLoading: boolean;
  connectionState: ConnectionState;
  isSimulation: boolean;
  isBrowserOffline: boolean;
  lastSyncedAt: string | null;
  deviceStatus: DeviceStatus;
  channels: ChannelReading[];
  totalPowerW: number | null;
  activeChannelsCount: number;
  todayEnergyKwh: number;
  yesterdayEnergyKwh: number;
  estimatedCostRp: number | null;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  chartSeries: PowerPoint[];
  alerts: AlertItem[];
  unreadAlertsCount: number;
  activities: ActivityItem[];
  toasts: ToastItem[];
  dismissToast: (id: string) => void;
  settings: GridWatchSettings;
  updateSettings: (patch: Partial<GridWatchSettings>) => void;
  resetSettings: () => void;
  toggleChannel: (channelId: ChannelId) => Promise<void>;
  toggleAllChannels: (nextState: boolean) => Promise<void>;
  resolveAlert: (alertId: string) => void;
  clearResolvedAlerts: () => void;
  notificationPermission: BrowserNotificationPermission;
  enableNotifications: () => Promise<BrowserNotificationPermission>;
  sendTestNotification: () => Promise<void>;
  spikeActive: boolean;
  triggerPowerSpike: () => void;
  canInstallPwa: boolean;
  isPwaInstalled: boolean;
  promptInstallPwa: () => Promise<void>;
  refreshNow: () => Promise<void>;
}

interface GridWatchShellContextValue {
  unreadAlertsCount: number;
  connectionState: ConnectionState;
  isSimulation: boolean;
  isBrowserOffline: boolean;
  toasts: ToastItem[];
  dismissToast: (id: string) => void;
  canInstallPwa: boolean;
  promptInstallPwa: () => Promise<void>;
}

const GridWatchContext = createContext<GridWatchContextValue | null>(null);
const GridWatchShellContext = createContext<GridWatchShellContextValue | null>(
  null
);

export function GridWatchProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading] = useState(false);
  const [settings, setSettings] = useState<GridWatchSettings>(DEFAULT_SETTINGS);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("simulation");
  const [isBrowserOffline, setIsBrowserOffline] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("today");

  const [channels, setChannels] = useState<ChannelReading[]>(() =>
    createInitialSimChannels(DEFAULT_SETTINGS)
  );
  const [liveSeries, setLiveSeries] = useState<PowerPoint[]>([]);
  const [todayEnergyKwh, setTodayEnergyKwh] = useState<number>(2.48);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    online: true,
    lastSeen: null,
    rssi: -54,
    uptimeS: 14820,
    ledOn: true,
  });

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>(() =>
    createInitialActivities()
  );
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [spikeActive, setSpikeActive] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<BrowserNotificationPermission>("default");
  const [deferredInstallPrompt, setDeferredInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);

  const lastAlertAtRef = useRef<Record<string, number>>({});
  const spikeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const pushToast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [{ ...toast, id }, ...prev].slice(0, 3));
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 6500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const appendActivity = useCallback(
    (
      message: string,
      tone: ActivityItem["tone"] = "normal",
      channelId?: ChannelId | null
    ) => {
      const item: ActivityItem = {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tone,
        message,
        occurredAt: new Date().toISOString(),
        channelId,
      };
      setActivities((prev) => [item, ...prev].slice(0, 30));
    },
    []
  );

  // Hydrate persisted settings, SW registration, online/offline & PWA install listeners
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<GridWatchSettings>;
        const merged: GridWatchSettings = {
          ...DEFAULT_SETTINGS,
          ...parsed,
          channelThresholds: {
            ...DEFAULT_SETTINGS.channelThresholds,
            ...(parsed.channelThresholds || {}),
          },
          channelNames: {
            ...DEFAULT_SETTINGS.channelNames,
            ...(parsed.channelNames || {}),
          },
        };
        setSettings(merged);
        setChannels(createInitialSimChannels(merged));
      }
    } catch {
      // Ignore malformed localStorage
    }

    setNotificationPermission(getNotificationPermission());
    setIsBrowserOffline(typeof navigator !== "undefined" && !navigator.onLine);
    setLastSyncedAt(new Date().toISOString());

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error Safari standalone property
      Boolean(window.navigator.standalone);
    setIsPwaInstalled(standalone);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // SW registration can fail on non-HTTPS non-localhost origins
      });
    }

    const onOnline = () => setIsBrowserOffline(false);
    const onOffline = () => setIsBrowserOffline(true);
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setIsPwaInstalled(true);
      setDeferredInstallPrompt(null);
      pushToast({
        tone: "normal",
        title: "GridWatch terpasang",
        body: "Aplikasi PWA siap dibuka langsung dari layar utama perangkat Anda.",
      });
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    setIsHydrated(true);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [pushToast]);

  const updateSettings = useCallback((patch: Partial<GridWatchSettings>) => {
    setSettings((prev) => {
      const next: GridWatchSettings = {
        ...prev,
        ...patch,
        channelThresholds: patch.channelThresholds
          ? { ...prev.channelThresholds, ...patch.channelThresholds }
          : prev.channelThresholds,
        channelNames: patch.channelNames
          ? { ...prev.channelNames, ...patch.channelNames }
          : prev.channelNames,
      };
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage quota errors
      }
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    setChannels(createInitialSimChannels(DEFAULT_SETTINGS));
    try {
      localStorage.removeItem(SETTINGS_KEY);
    } catch {
      // Ignore
    }
    pushToast({
      tone: "info",
      title: "Pengaturan dikembalikan",
      body: "Batas daya, nama kanal, dan tarif kembali ke nilai awal.",
    });
  }, [pushToast]);

  const evaluateThresholds = useCallback(
    (nextChannels: ChannelReading[], forceIgnoreCooldown = false) => {
      const cfg = settingsRef.current;
      const nowMs = Date.now();
      const cooldownMs = Math.max(5, cfg.cooldownSeconds) * 1000;

      const validPowers = nextChannels
        .map((c) => c.powerW)
        .filter((v): v is number => v !== null && !Number.isNaN(v));
      const totalW =
        validPowers.length > 0
          ? validPowers.reduce((acc, v) => acc + v, 0)
          : null;

      const emitThresholdAlert = (
        key: string,
        channelId: ChannelId | null,
        title: string,
        description: string,
        measuredW: number,
        thresholdW: number
      ) => {
        const lastFired = lastAlertAtRef.current[key] || 0;
        if (!forceIgnoreCooldown && nowMs - lastFired < cooldownMs) return;
        lastAlertAtRef.current[key] = nowMs;

        const severity: AlertItem["severity"] =
          measuredW >= thresholdW * 1.15 ? "critical" : "warning";

        const alert: AlertItem = {
          id: `alrt-${nowMs}-${key}`,
          severity,
          title,
          description,
          channelId,
          measuredW,
          thresholdW,
          occurredAt: new Date(nowMs).toISOString(),
          resolved: false,
        };

        setAlerts((prev) => [alert, ...prev].slice(0, 40));
        appendActivity(
          `${title} (${formatWatts(measuredW)} / batas ${formatWatts(thresholdW)})`,
          severity === "critical" ? "critical" : "warning",
          channelId
        );
        pushToast({
          tone: severity === "critical" ? "critical" : "warning",
          title,
          body: description,
          href: "/alerts",
        });

        if (cfg.notificationsEnabled) {
          void sendBrowserNotification({
            title: `GridWatch: ${title}`,
            body: description,
            tag: `gridwatch-threshold-${key}`,
            url: "/alerts",
          });
        }
      };

      if (
        totalW !== null &&
        cfg.totalThresholdW > 0 &&
        totalW > cfg.totalThresholdW
      ) {
        emitThresholdAlert(
          "total",
          null,
          "Total daya melebihi batas",
          `Penggunaan daya saat ini ${formatWatts(totalW)}, melewati batas ${formatWatts(cfg.totalThresholdW)}.`,
          totalW,
          cfg.totalThresholdW
        );
      }

      for (const ch of nextChannels) {
        const chLimit = cfg.channelThresholds[ch.id];
        if (ch.powerW !== null && chLimit > 0 && ch.powerW > chLimit) {
          emitThresholdAlert(
            `ch-${ch.id}`,
            ch.id,
            `Kanal ${ch.id} (${ch.name}) melebihi batas`,
            `Daya ${ch.name} mencapai ${formatWatts(ch.powerW)}, melewati batas ${formatWatts(chLimit)}.`,
            ch.powerW,
            chLimit
          );
        }
      }
    },
    [appendActivity, pushToast]
  );

  const pollOnce = useCallback(async () => {
    const cfg = settingsRef.current;

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsBrowserOffline(true);
      if (cfg.dataSource === "live") {
        setConnectionState("browser_offline");
        return;
      }
    }

    const shouldTryLive =
      cfg.dataSource === "live" ||
      (cfg.dataSource === "auto" && Boolean(cfg.apiBaseUrl.trim()));

    if (shouldTryLive && cfg.apiBaseUrl.trim()) {
      try {
        const payload = await fetchBackendPengukuran(cfg.apiBaseUrl.trim());
        const mapped = mapBackendToState(payload, cfg);
        setChannels((prev) =>
          mapped.channels.map((nextCh) => {
            const existing = prev.find((c) => c.id === nextCh.id);
            return existing?.commandState === "pending"
              ? {
                  ...nextCh,
                  commandState: existing.commandState,
                  commandMessage: existing.commandMessage,
                }
              : nextCh;
          })
        );
        setDeviceStatus(mapped.deviceStatus);
        setLiveSeries(mapped.series);
        if (mapped.todayKwh > 0) {
          setTodayEnergyKwh(mapped.todayKwh);
        }
        setLastSyncedAt(payload.server_time || new Date().toISOString());
        setConnectionState(
          mapped.deviceStatus.online ? "online" : "esp32_offline"
        );
        evaluateThresholds(mapped.channels);
        return;
      } catch {
        if (cfg.dataSource === "live") {
          setConnectionState("server_offline");
          setDeviceStatus((prev) => ({ ...prev, online: false }));
          return;
        }
        // In 'auto' mode, smoothly fall back to simulation mode for demo readiness
      }
    }

    // Simulation tick
    setConnectionState(isBrowserOffline ? "browser_offline" : "simulation");
    setChannels((prev) => {
      const next = tickSimChannels(prev, cfg, spikeActive ? 150 : 0);
      evaluateThresholds(next);
      const totalW = next.reduce((acc, c) => acc + (c.powerW ?? 0), 0);
      setTodayEnergyKwh((kwh) =>
        Number((kwh + (totalW * 3) / 3_600_000).toFixed(4))
      );
      return next;
    });
    setDeviceStatus((prev) => ({
      ...prev,
      online: true,
      lastSeen: new Date().toISOString(),
      uptimeS: (prev.uptimeS ?? 14820) + 3,
    }));
    setLastSyncedAt(new Date().toISOString());
  }, [evaluateThresholds, isBrowserOffline, spikeActive]);

  useEffect(() => {
    if (!isHydrated) return;
    void pollOnce();
    const interval = setInterval(() => {
      void pollOnce();
    }, 3000);
    return () => clearInterval(interval);
  }, [isHydrated, pollOnce]);

  const isSimulation =
    connectionState === "simulation" ||
    (connectionState === "browser_offline" && settings.dataSource !== "live");

  const toggleChannel = useCallback(
    async (channelId: ChannelId) => {
      const target = channels.find((c) => c.id === channelId);
      if (!target || target.commandState === "pending") return;

      if (!isSimulation && connectionState !== "online") {
        pushToast({
          tone: "warning",
          title: "Kontrol tidak tersedia",
          body: "Perangkat atau server sedang offline. Perintah tidak dikirim demi keamanan.",
        });
        return;
      }

      const desiredOn = !target.relayOn;

      setChannels((prev) =>
        prev.map((ch) =>
          ch.id === channelId
            ? {
                ...ch,
                commandState: "pending",
                commandMessage: "Mengirim perintah...",
              }
            : ch
        )
      );

      if (isSimulation) {
        await new Promise((r) => setTimeout(r, 420));
        setChannels((prev) => {
          const updated = prev.map((ch) => {
            if (ch.id !== channelId) return ch;
            const nextPower = desiredOn
              ? ch.id === 1
                ? 120
                : ch.id === 2
                  ? 86
                  : ch.id === 3
                    ? 336 + (spikeActive ? 150 : 0)
                    : 96
              : 0;
            const voltageV = ch.voltageV ?? 220.4;
            return {
              ...ch,
              relayOn: desiredOn,
              powerW: nextPower,
              currentA: desiredOn
                ? Number((nextPower / voltageV).toFixed(2))
                : 0,
              commandState: "confirmed" as const,
              commandMessage: "Terkonfirmasi",
              lastUpdatedAt: new Date().toISOString(),
            };
          });
          evaluateThresholds(updated);
          return updated;
        });

        appendActivity(
          `Kanal ${channelId} (${target.name}) ${desiredOn ? "dinyalakan" : "dimatikan"}`,
          "normal",
          channelId
        );

        setTimeout(() => {
          setChannels((prev) =>
            prev.map((ch) =>
              ch.id === channelId && ch.commandState === "confirmed"
                ? { ...ch, commandState: "idle", commandMessage: undefined }
                : ch
            )
          );
        }, 1600);
        return;
      }

      const result = await sendBackendRelayCommand(
        settingsRef.current.apiBaseUrl,
        channelId,
        desiredOn
      );

      if (!result.ok) {
        setChannels((prev) =>
          prev.map((ch) =>
            ch.id === channelId
              ? {
                  ...ch,
                  commandState: "failed",
                  commandMessage: result.error || "Gagal",
                }
              : ch
          )
        );
        pushToast({
          tone: "critical",
          title: `Perintah Kanal ${channelId} gagal`,
          body: result.error || "Tidak mendapat konfirmasi dari perangkat.",
        });
        setTimeout(() => {
          setChannels((prev) =>
            prev.map((ch) =>
              ch.id === channelId
                ? { ...ch, commandState: "idle", commandMessage: undefined }
                : ch
            )
          );
        }, 2800);
        return;
      }

      setChannels((prev) =>
        prev.map((ch) =>
          ch.id === channelId
            ? {
                ...ch,
                relayOn: desiredOn,
                commandState: "confirmed",
                commandMessage: "Terkonfirmasi",
              }
            : ch
        )
      );
      appendActivity(
        `Kanal ${channelId} (${target.name}) ${desiredOn ? "dinyalakan" : "dimatikan"}`,
        "normal",
        channelId
      );
      setTimeout(() => {
        setChannels((prev) =>
          prev.map((ch) =>
            ch.id === channelId && ch.commandState === "confirmed"
              ? { ...ch, commandState: "idle", commandMessage: undefined }
              : ch
          )
        );
      }, 1800);
    },
    [
      appendActivity,
      channels,
      connectionState,
      evaluateThresholds,
      isSimulation,
      pushToast,
      spikeActive,
    ]
  );

  const toggleAllChannels = useCallback(
    async (nextState: boolean) => {
      const toToggle = channels.filter((c) => c.relayOn !== nextState);
      for (const ch of toToggle) {
        await toggleChannel(ch.id);
      }
    },
    [channels, toggleChannel]
  );

  const resolveAlert = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, resolved: true } : a))
    );
  }, []);

  const clearResolvedAlerts = useCallback(() => {
    setAlerts((prev) => prev.filter((a) => !a.resolved));
  }, []);

  const enableNotifications = useCallback(async () => {
    const perm = await requestNotificationPermission();
    setNotificationPermission(perm);
    if (perm === "granted") {
      updateSettings({ notificationsEnabled: true });
      pushToast({
        tone: "normal",
        title: "Notifikasi aktif",
        body: "Anda akan menerima notifikasi saat daya melebihi batas yang ditentukan.",
      });
      void sendBrowserNotification({
        title: "GridWatch: Notifikasi Aktif",
        body: `Peringatan otomatis aktif untuk batas total ${formatWatts(settingsRef.current.totalThresholdW)}.`,
        tag: "gridwatch-enabled",
        url: "/",
      });
    } else if (perm === "denied") {
      pushToast({
        tone: "warning",
        title: "Izin notifikasi ditolak",
        body: "Aktifkan izin notifikasi di pengaturan browser agar peringatan sistem muncul. Peringatan dalam aplikasi tetap aktif.",
      });
    }
    return perm;
  }, [pushToast, updateSettings]);

  const sendTestNotification = useCallback(async () => {
    let perm = getNotificationPermission();
    if (perm === "default") {
      perm = await requestNotificationPermission();
      setNotificationPermission(perm);
    }

    const body = `Contoh peringatan: Total daya mencapai ${formatWatts(settingsRef.current.totalThresholdW + 45)}, melewati batas ${formatWatts(settingsRef.current.totalThresholdW)}.`;

    pushToast({
      tone: "warning",
      title: "Tes Notifikasi Batas Daya",
      body,
      href: "/alerts",
    });

    if (perm === "granted") {
      await sendBrowserNotification({
        title: "GridWatch: Tes Notifikasi Batas Daya",
        body,
        tag: `gridwatch-test-${Date.now()}`,
        url: "/alerts",
      });
    }
  }, [pushToast]);

  const triggerPowerSpike = useCallback(() => {
    if (spikeTimeoutRef.current) clearTimeout(spikeTimeoutRef.current);
    setSpikeActive(true);
    setChannels((prev) => {
      const next = prev.map((ch) => {
        if (ch.id !== 3) return ch;
        const spikedW = Math.max(
          settingsRef.current.channelThresholds[3] + 55,
          settingsRef.current.totalThresholdW - 160,
          490
        );
        const voltageV = ch.voltageV ?? 220.1;
        return {
          ...ch,
          relayOn: true,
          powerW: Math.round(spikedW),
          currentA: Number((spikedW / voltageV).toFixed(2)),
          lastUpdatedAt: new Date().toISOString(),
        };
      });
      evaluateThresholds(next, true);
      return next;
    });

    spikeTimeoutRef.current = setTimeout(() => {
      setSpikeActive(false);
    }, 15000);
  }, [evaluateThresholds]);

  const promptInstallPwa = useCallback(async () => {
    if (!deferredInstallPrompt) return;
    await deferredInstallPrompt.prompt();
    const result = await deferredInstallPrompt.userChoice;
    if (result.outcome === "accepted") {
      setDeferredInstallPrompt(null);
    }
  }, [deferredInstallPrompt]);

  const totalPowerW = useMemo(() => {
    const valid = channels
      .map((c) => c.powerW)
      .filter((v): v is number => v !== null && !Number.isNaN(v));
    if (valid.length === 0) return null;
    return Number(valid.reduce((acc, v) => acc + v, 0).toFixed(2));
  }, [channels]);

  const activeChannelsCount = useMemo(
    () => channels.filter((c) => c.relayOn).length,
    [channels]
  );

  const estimatedCostRp = useMemo(() => {
    if (!settings.tariffPerKwh || settings.tariffPerKwh <= 0) return null;
    return Math.round(todayEnergyKwh * settings.tariffPerKwh);
  }, [todayEnergyKwh, settings.tariffPerKwh]);

  const chartSeries = useMemo(() => {
    if (!isSimulation && liveSeries.length > 0 && timeRange === "today") {
      return liveSeries;
    }
    return buildSimulatedSeries(timeRange, channels);
  }, [channels, isSimulation, liveSeries, timeRange]);

  const unreadAlertsCount = useMemo(
    () => alerts.filter((a) => !a.resolved).length,
    [alerts]
  );

  const canInstallPwa = Boolean(deferredInstallPrompt) && !isPwaInstalled;

  const shellValue = useMemo<GridWatchShellContextValue>(
    () => ({
      unreadAlertsCount,
      connectionState,
      isSimulation,
      isBrowserOffline,
      toasts,
      dismissToast,
      canInstallPwa,
      promptInstallPwa,
    }),
    [
      canInstallPwa,
      connectionState,
      dismissToast,
      isBrowserOffline,
      isSimulation,
      promptInstallPwa,
      toasts,
      unreadAlertsCount,
    ]
  );

  const value = useMemo<GridWatchContextValue>(
    () => ({
      isHydrated,
      isLoading,
      connectionState,
      isSimulation,
      isBrowserOffline,
      lastSyncedAt,
      deviceStatus,
      channels,
      totalPowerW,
      activeChannelsCount,
      todayEnergyKwh,
      yesterdayEnergyKwh: 2.82,
      estimatedCostRp,
      timeRange,
      setTimeRange,
      chartSeries,
      alerts,
      unreadAlertsCount,
      activities,
      toasts,
      dismissToast,
      settings,
      updateSettings,
      resetSettings,
      toggleChannel,
      toggleAllChannels,
      resolveAlert,
      clearResolvedAlerts,
      notificationPermission,
      enableNotifications,
      sendTestNotification,
      spikeActive,
      triggerPowerSpike,
      canInstallPwa,
      isPwaInstalled,
      promptInstallPwa,
      refreshNow: pollOnce,
    }),
    [
      activeChannelsCount,
      activities,
      alerts,
      canInstallPwa,
      channels,
      chartSeries,
      clearResolvedAlerts,
      connectionState,
      deviceStatus,
      dismissToast,
      enableNotifications,
      estimatedCostRp,
      isBrowserOffline,
      isHydrated,
      isLoading,
      isPwaInstalled,
      isSimulation,
      lastSyncedAt,
      notificationPermission,
      pollOnce,
      promptInstallPwa,
      resetSettings,
      resolveAlert,
      sendTestNotification,
      settings,
      spikeActive,
      timeRange,
       toasts,
      todayEnergyKwh,
      toggleAllChannels,
      toggleChannel,
      totalPowerW,
      triggerPowerSpike,
      unreadAlertsCount,
      updateSettings,
    ]
  );

  return (
    <GridWatchShellContext.Provider value={shellValue}>
      <GridWatchContext.Provider value={value}>
        {children}
      </GridWatchContext.Provider>
    </GridWatchShellContext.Provider>
  );
}

export function useGridWatchShell() {
  const ctx = useContext(GridWatchShellContext);
  if (!ctx) {
    throw new Error(
      "useGridWatchShell must be used inside GridWatchProvider"
    );
  }
  return ctx;
}

export function useGridWatch() {
  const ctx = useContext(GridWatchContext);
  if (!ctx) {
    throw new Error("useGridWatch must be used inside GridWatchProvider");
  }
  return ctx;
}
