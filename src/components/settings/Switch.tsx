interface SwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
}

/** Toggle styled as a flower bud — closed when off, blooming when on. */
export function Switch({ checked, onChange }: SwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="bud-switch"
      data-checked={checked}
    />
  );
}
