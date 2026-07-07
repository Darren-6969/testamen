import { Flame } from "lucide-react";
import PublicCard from "./PublicCard";

type MemorialCardProps = {
  name: string;
  years: string;
  relationship: string;
  excerpt: string;
  image: string;
  candles: number;
  variant?: "normal" | "featured";
};

export default function MemorialCard({
  name,
  years,
  relationship,
  excerpt,
  image,
  candles,
  variant = "normal",
}: MemorialCardProps) {
  const isFeatured = variant === "featured";

  return (
    <PublicCard
      className={
        isFeatured
          ? "mem-memorial-card mem-memorial-card-featured"
          : "mem-memorial-card"
      }
    >
      <div className="mem-memorial-image-wrap">
        <img src={image} alt={name} className="mem-memorial-image" />
        <div className="mem-memorial-image-overlay" />
      </div>

      <div className="mem-memorial-body">
        <p className="mem-memorial-relation">{relationship}</p>

        <h3 className="mem-memorial-name">{name}</h3>

        <p className="mem-memorial-years">{years}</p>

        <p className="mem-memorial-excerpt">{excerpt}</p>

        <div className="mem-memorial-footer">
          <Flame size={16} />
          <span>{candles} candles lit</span>
        </div>
      </div>
    </PublicCard>
  );
}