import StrokeIcon from './StrokeIcon.jsx';

/**
 * Shared icon + title + text card grid for Home / Features marketing pages.
 */
export default function MarketingIconCards({
  items,
  listClassName,
  cardClassName,
  iconWrapClassName,
  iconClassName,
  iconIdFor,
  titleTag: TitleTag = 'h3',
}) {
  return (
    <ul className={listClassName}>
      {items.map((item) => (
        <li key={item.id} className={cardClassName}>
          <span className={iconWrapClassName} aria-hidden="true">
            <StrokeIcon
              id={iconIdFor ? iconIdFor(item.id) : item.id}
              className={iconClassName}
            />
          </span>
          <div>
            <TitleTag>{item.title}</TitleTag>
            <p>{item.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
