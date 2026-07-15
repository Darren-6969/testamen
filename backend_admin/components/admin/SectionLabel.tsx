// Uppercase tracked-wide section label used across the admin tabs.
export default function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.15em] text-[#b3567e]">
      {children}
    </div>
  );
}