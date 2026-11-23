import SeoHead from '../../components/SeoHead.jsx';
import './InfoPage.scss';

export default function InfoPage({
  title,
  children,
  description,
  path,
}) {
  return (
    <main className="info">
      {description && path ? (
        <SeoHead title={`${title} — Blizari`} description={description} path={path} />
      ) : null}
      <h1>{title}</h1>
      <div className="info__body">{children}</div>
    </main>
  );
}
