const WIB_TZ = "Asia/Jakarta";

export function formatWatts(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "--";
  }
  const abs = Math.abs(value);
  if (abs === 0) return "0 W";
  if (abs < 10) {
    return `${value.toLocaleString("id-ID", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    })} W`;
  }
  if (abs < 100 && Math.abs(value - Math.round(value)) > 0.05) {
    return `${value.toLocaleString("id-ID", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })} W`;
  }
  return `${Math.round(value).toLocaleString("id-ID")} W`;
}

export function formatVoltage(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "--";
  }
  return `${value.toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  })} V`;
}

export function formatCurrent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "--";
  }
  return `${value.toLocaleString("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} A`;
}

export function formatKwh(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "--";
  }
  const decimals = value < 0.1 && value > 0 ? 3 : 2;
  return `${value.toLocaleString("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} kWh`;
}

export function formatRupiah(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Belum diatur";
  }
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

export function formatTimeWIB(iso: string | null | undefined): string {
  if (!iso) return "--:--";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "--:--";
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: WIB_TZ,
  }).format(date);
}

export function formatDateTimeWIB(iso: string | null | undefined): string {
  if (!iso) return "Belum ada data";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Belum ada data";
  return `${new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: WIB_TZ,
  }).format(date)} WIB`;
}

export function formatDatePillID(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: WIB_TZ,
  }).format(date);
}

export function formatUptime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || seconds < 0) return "--";
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours} jam ${mins} mnt`;
  return `${mins} menit`;
}
