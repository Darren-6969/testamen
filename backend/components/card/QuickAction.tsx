// components/card/QuickAction.tsx
'use client';
import React from 'react';

interface Action {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode; // optional icon
}

interface QuickActionProps {
  actions: Action[];
}

export function QuickAction({ actions }: QuickActionProps) {
  return (
    //<div className=" rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex flex-col">
    <div
      className="h-full p-4 shadow rounded-lg border border-[var(--border-color)]"
      style={{
        backgroundColor: 'var(--card-bg)',
        color: 'var(--card-text)',
        
      }}
    >
      <h2 className="text-xs font-semibold tracking-[0.15em] text-[#c3195d]">
      QUICK ACTION
      </h2>
      <div className="grid grid-cols-2 gap-3 pt-2">
        {actions.map((a, i) => (
          <button
            key={i}
            onClick={a.onClick}
            className="flex items-center justify-center gap-2 py-2 rounded-lg shadow transition-colors"
            style={{
              backgroundColor: 'var(--button-bg)',
              color: 'var(--button-text)',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = 'var(--button-hover-bg)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = 'var(--button-bg)')
            }
          >
            {a.icon && <span className="text-lg">{a.icon}</span>}
            {a.label}
          </button>
        ))}
      </div>
    </div>
    //</div>
  );
}