import './InfoPage.scss';

export default function InfoPage({ title, children }) {
  return (
    <main className="info">
      <h1>{title}</h1>
      <div className="info__body">{children}</div>
    </main>
  );
}
