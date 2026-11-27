import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

const baseProps = (size = 20): React.SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
});

export function LeafLogoIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M5.5 18.5C4.8 11.2 9.8 5.2 19 5.5C18.4 13.6 14 19.1 5.5 18.5Z"
        fill="currentColor"
      />
      <path
        d="M7.2 16.8L14.5 9.5"
        stroke="#526B42"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function HomeIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...baseProps(size)} {...props}>
      <path d="M3.5 10.5L12 3.8L20.5 10.5" />
      <path d="M5.5 9.5V19.2C5.5 19.9 6.1 20.5 6.8 20.5H17.2C17.9 20.5 18.5 19.9 18.5 19.2V9.5" />
      <path d="M9.8 20.5V14.5H14.2V20.5" />
    </svg>
  );
}

export function BoltIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...baseProps(size)} {...props}>
      <path d="M13 2.8L5.2 13.2H11.5L10.8 21.2L18.8 10.8H12.5L13 2.8Z" />
    </svg>
  );
}

export function LayersIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...baseProps(size)} {...props}>
      <path d="M12 3.5L3.5 8L12 12.5L20.5 8L12 3.5Z" />
      <path d="M3.5 12.2L12 16.7L20.5 12.2" />
      <path d="M3.5 16.2L12 20.7L20.5 16.2" />
    </svg>
  );
}

export function LeafOutlineIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...baseProps(size)} {...props}>
      <path d="M5.5 18.5C5 11.8 9.6 5.5 18.8 5.5C18.3 13.4 13.8 19 5.5 18.5Z" />
      <path d="M5.5 18.5L13.5 10.5" />
    </svg>
  );
}

export function PlugIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...baseProps(size)} {...props}>
      <path d="M9 3.5V8" />
      <path d="M15 3.5V8" />
      <path d="M6.5 8H17.5V11.2C17.5 14.1 15.1 16.5 12.2 16.5H11.8C8.9 16.5 6.5 14.1 6.5 11.2V8Z" />
      <path d="M12 16.5V21" />
    </svg>
  );
}

export function ChartBarIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...baseProps(size)} {...props}>
      <path d="M4.5 19.5H19.5" />
      <rect x="6" y="11" width="2.8" height="8.5" rx="1" />
      <rect x="10.6" y="6.5" width="2.8" height="13" rx="1" />
      <rect x="15.2" y="9" width="2.8" height="10.5" rx="1" />
    </svg>
  );
}

export function BellIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...baseProps(size)} {...props}>
      <path d="M18 15.5V10.5C18 7.2 15.3 4.5 12 4.5C8.7 4.5 6 7.2 6 10.5V15.5L4.5 17.5H19.5L18 15.5Z" />
      <path d="M9.8 19.5C10.3 20.4 11.1 21 12 21C12.9 21 13.7 20.4 14.2 19.5" />
    </svg>
  );
}

export function SettingsIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...baseProps(size)} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15A1.65 1.65 0 0 0 19.7 16.8L19.8 16.9A2 2 0 1 1 17 19.7L16.9 19.6A1.65 1.65 0 0 0 15.1 19.3A1.65 1.65 0 0 0 14.1 20.8V21A2 2 0 1 1 10.1 21V20.9A1.65 1.65 0 0 0 9 19.4A1.65 1.65 0 0 0 7.2 19.7L7.1 19.8A2 2 0 1 1 4.3 17L4.4 16.9A1.65 1.65 0 0 0 4.7 15.1A1.65 1.65 0 0 0 3.2 14.1H3A2 2 0 1 1 3 10.1H3.1A1.65 1.65 0 0 0 4.6 9A1.65 1.65 0 0 0 4.3 7.2L4.2 7.1A2 2 0 1 1 7 4.3L7.1 4.4A1.65 1.65 0 0 0 8.9 4.7H9A1.65 1.65 0 0 0 10 3.2V3A2 2 0 1 1 14 3V3.1A1.65 1.65 0 0 0 15 4.6A1.65 1.65 0 0 0 16.8 4.3L16.9 4.2A2 2 0 1 1 19.7 7L19.6 7.1A1.65 1.65 0 0 0 19.3 8.9V9A1.65 1.65 0 0 0 20.8 10H21A2 2 0 1 1 21 14H20.9A1.65 1.65 0 0 0 19.4 15Z" />
    </svg>
  );
}

export function CalendarIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg {...baseProps(size)} {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M8 3V6.5" />
      <path d="M16 3V6.5" />
      <path d="M3.5 9.8H20.5" />
    </svg>
  );
}

export function ClockIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg {...baseProps(size)} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12L15 14" />
    </svg>
  );
}

export function MonitorIcon({ size = 19, ...props }: IconProps) {
  return (
    <svg {...baseProps(size)} {...props}>
      <rect x="3.5" y="4.5" width="17" height="11.5" rx="2" />
      <path d="M8.5 19.5H15.5" />
      <path d="M12 16V19.5" />
    </svg>
  );
}

export function AirConIcon({ size = 19, ...props }: IconProps) {
  return (
    <svg {...baseProps(size)} {...props}>
      <rect x="3.5" y="5" width="17" height="8" rx="2" />
      <path d="M7 10H17" />
      <path d="M8 16.5C8 17.8 7 18.8 6.5 19.5" />
      <path d="M12 16.5V19.5" />
      <path d="M16 16.5C16 17.8 17 18.8 17.5 19.5" />
    </svg>
  );
}

export function LampIcon({ size = 19, ...props }: IconProps) {
  return (
    <svg {...baseProps(size)} {...props}>
      <path d="M8 5H16L18.5 13H5.5L8 5Z" />
      <path d="M12 13V19.5" />
      <path d="M9 19.5H15" />
    </svg>
  );
}

export function AlertIcon({ size = 19, ...props }: IconProps) {
  return (
    <svg {...baseProps(size)} {...props}>
      <path d="M10.4 4.2L3.2 17.2C2.6 18.3 3.4 19.6 4.7 19.6H19.3C20.6 19.6 21.4 18.3 20.8 17.2L13.6 4.2C12.9 3 11.1 3 10.4 4.2Z" />
      <path d="M12 9.5V13.2" />
      <circle cx="12" cy="16.3" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function DownloadIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg {...baseProps(size)} {...props}>
      <path d="M12 4.5V14.8" />
      <path d="M8 11.2L12 15.2L16 11.2" />
      <path d="M4.5 18.8H19.5" />
    </svg>
  );
}

export function WifiIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg {...baseProps(size)} {...props}>
      <path d="M4.5 9.2C8.8 5.4 15.2 5.4 19.5 9.2" />
      <path d="M7.5 12.6C10.1 10.3 13.9 10.3 16.5 12.6" />
      <path d="M10.4 16C11.3 15.2 12.7 15.2 13.6 16" />
      <circle cx="12" cy="18.6" r="0.8" fill="currentColor" />
    </svg>
  );
}

export function WifiOffIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg {...baseProps(size)} {...props}>
      <path d="M3.5 3.5L20.5 20.5" />
      <path d="M8.5 7.2C12.1 5.9 16.3 6.6 19.5 9.2" />
      <path d="M4.5 9.2C5.2 8.6 6 8.1 6.8 7.7" />
      <path d="M7.5 12.6C8.8 11.5 10.4 10.9 12 10.9" />
      <circle cx="12" cy="18.6" r="0.8" fill="currentColor" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...baseProps(size)} {...props}>
      <path d="M5 12H19" />
      <path d="M13.5 6.5L19 12L13.5 17.5" />
    </svg>
  );
}

export function CloseIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...baseProps(size)} {...props}>
      <path d="M6 6L18 18" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

export function ChannelTypeIcon({
  kind,
  size = 19,
  className = "",
}: {
  kind: "living" | "office" | "bedroom" | "garden";
  size?: number;
  className?: string;
}) {
  if (kind === "living") return <MonitorIcon size={size} className={className} />;
  if (kind === "office") return <MonitorIcon size={size} className={className} />;
  if (kind === "bedroom") return <AirConIcon size={size} className={className} />;
  return <LampIcon size={size} className={className} />;
}
