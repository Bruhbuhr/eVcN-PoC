// Material Symbols Outlined wrapper matching the Stitch design system markup.
// Usage: <Icon name="bolt" fill className="text-[20px] text-primary" />
export default function Icon({ name, fill = false, className = "" }) {
  return (
    <span
      className={`material-symbols-outlined${fill ? " fill-icon" : ""} ${className}`.trim()}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
