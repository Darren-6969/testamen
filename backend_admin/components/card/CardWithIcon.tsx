// app/components/dashboard/DashboardCards.tsx
import type { LucideIcon } from "lucide-react";

export type Card = {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative";
  icon: LucideIcon;
  color?: string; // background for the icon container
};

export default function CardWithIcon({ cards }: { cards: Card[] }) {
  return (
    // ⬇️ make this wrapper fill its parent and stretch children
    <div className="h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 items-stretch">
      {cards.map((card) => (
        <div
          key={card.title}
          className="
            h-full                      /* ⬅️ card fills its grid cell */
            bg-[var(--card-bg)]
            text-[var(--card-text)]
            border border-[var(--border-color)]
            rounded-lg shadow p-6
            hover:shadow-lg
            transition-shadow
            text-center
            flex flex-col               /* ⬅️ so items-center/justify-center work */
            items-center justify-center
            overflow-hidden
            relative
          "
        >
          {/* Icon box keeps its own theme color */}
          <div className={`${card.color} absolute left-4 bottom-4 opacity-20`}>
            <card.icon className="w-16 h-16 text-red-500" />
          </div>

          <div className="text-center z-10">
            {/* Title */}
            <p className="text-sm font-semibold text-gray-800 mb-1"
            style={{ color: '#c3195d' }}
            >
              {card.title}
            </p>

            {/* Value */}
            <p className="text-6xl font-bold text-[#0A1F44]">{card.value}</p>
          </div>

          {/* Change info (still commented, untouched) */}
          {/* ... */}
        </div>
      ))}
    </div>
  );
}
