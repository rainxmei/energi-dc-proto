"use client";

import React from "react";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
  pending?: boolean;
}

export function ToggleSwitch({
  checked,
  onChange,
  label,
  disabled = false,
  pending = false,
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-busy={pending}
      disabled={disabled || pending}
      onClick={onChange}
      className="group relative inline-flex min-h-[44px] min-w-[52px] items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#526B42] disabled:opacity-60"
    >
      <span
        className={`relative inline-flex h-[28px] w-[50px] items-center rounded-full border transition-colors duration-200 ${
          checked
            ? "border-[#526B42]/40 bg-[#5E7A4B]"
            : "border-[#B8B4AA]/60 bg-[#D6D2C8]"
        }`}
      >
        <span
          className={`inline-flex h-[22px] w-[22px] transform items-center justify-center rounded-full bg-[#F7F5EF] shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-[24px]" : "translate-x-[2px]"
          }`}
        >
          {pending && (
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#526B42] border-t-transparent" />
          )}
        </span>
      </span>
      <span className="sr-only">
        {checked ? "Menyala" : "Mati"}
        {pending ? ", sedang memproses" : ""}
      </span>
    </button>
  );
}
