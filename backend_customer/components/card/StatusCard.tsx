import React from "react";

interface StatusItem {
  label: string;
  value: number | string;
  color?: string; // Optional color override (default: red)
}

interface StatusCardProps {
  title: string;
  items: StatusItem[];
}

export default function StatusCard({ title, items }: StatusCardProps) {
  return (
    <div className="h-full p-4 shadow rounded-lg border border-[var(--border-color)] text-center flex flex-col justify-between">
      {/* Title */}
      <h3 className="font-semibold mb-4">
        {title}
      </h3>

      {/* Status Sections */}
      <div className="flex flex-1 items-center justify-center">
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <div className="flex-1">
              <p className="text-sm font-semibold text- #c3195d mb-2">
                {item.label}
              </p>
              <p className="text-6xl font-bold text-[#0A1F44]">
                {item.value}
              </p>
            </div>

            {/* Divider (not after last item) */}
            {index < items.length - 1 && (
              <div className="h-20 border-l border-gray-600 mx-4" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
