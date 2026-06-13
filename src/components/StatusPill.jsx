import Icon from "./Icon";

// Status is never color-only: each state pairs a color with an icon + label.
export default function StatusPill({ station }) {
  if (!station.isOpen) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-surface-container-highest px-3 py-1 text-on-surface-variant">
        <Icon name="block" fill className="text-[14px]" />
        <span className="font-label-caps text-[10px]">CLOSED</span>
      </span>
    );
  }
  if (station.availablePorts === 0) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-surface-container-highest px-3 py-1 text-on-surface-variant">
        <Icon name="schedule" fill className="text-[14px]" />
        <span className="font-label-caps text-[10px]">BUSY</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 rounded-full bg-primary-container/10 px-3 py-1 text-primary">
      <Icon name="check_circle" fill className="text-[14px]" />
      <span className="font-label-caps text-[10px]">ONLINE</span>
    </span>
  );
}
