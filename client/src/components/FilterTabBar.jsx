/**
 * Shared filter/tab strip used on platform and members pages.
 * @param {{ id: string, label: string }[] | [string, string][]} options
 */
export default function FilterTabBar({
  className,
  'aria-label': ariaLabel,
  value,
  onChange,
  options,
}) {
  const items = options.map((option) => (
    Array.isArray(option)
      ? { id: option[0], label: option[1] }
      : option
  ));

  return (
    <div className={className} role="tablist" aria-label={ariaLabel}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={value === item.id}
          className={value === item.id ? 'is-on' : undefined}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
