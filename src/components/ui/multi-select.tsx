"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";

interface MultiSelectOption {
  value: string;
  label: string;
  count?: number;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const toggle = useCallback(
    (value: string) => {
      if (selected.includes(value)) {
        onChange(selected.filter((v) => v !== value));
      } else {
        onChange([...selected, value]);
      }
    },
    [selected, onChange]
  );

  const clearAll = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange([]);
    },
    [onChange]
  );

  const displayText =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? options.find((o) => o.value === selected[0])?.label ?? selected[0]
        : `${selected.length} selected`;

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-8 items-center gap-1 rounded-md border border-border bg-background px-2 text-xs outline-none hover:bg-muted focus:border-primary"
      >
        <span className="max-w-[120px] truncate">{displayText}</span>
        {selected.length > 0 && (
          <span
            onClick={clearAll}
            className="ml-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted-foreground/20 hover:bg-muted-foreground/40"
          >
            <X className="h-2.5 w-2.5" />
          </span>
        )}
        <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-0 top-9 z-50 max-h-60 min-w-[180px] overflow-y-auto rounded-md border border-border bg-background shadow-lg">
          {options.map((opt) => {
            const isSelected = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs hover:bg-muted ${
                  isSelected ? "font-medium" : ""
                }`}
              >
                <span
                  className={`inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border"
                  }`}
                >
                  {isSelected && <Check className="h-2.5 w-2.5" />}
                </span>
                <span className="flex-1 truncate">{opt.label}</span>
                {opt.count !== undefined && (
                  <span className="text-muted-foreground">({opt.count})</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
