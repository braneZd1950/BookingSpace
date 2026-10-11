import '../public/AnalyticsPage.scss';

export default function PlatformSection({ title, lead, children }) {
  return (
    <main className="analytics">
      <header className="analytics__head">
        <div>
          <h1>{title}</h1>
          {lead ? <p className="analytics__lead">{lead}</p> : null}
        </div>
      </header>
      {children}
    </main>
  );
}
