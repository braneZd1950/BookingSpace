import { launchPhases, phaseLabel } from './launchPhases.js';
import './LaunchPlanPage.scss';

export default function LaunchPlanPage() {
  const current = launchPhases.find((phase) => phase.status === 'now');

  return (
    <section className="studio-panel launch-plan">
      <h1>Plan do lansiranja</h1>
      <p>
        Lean Startup: najprije petlja koja donosi vrijednost, mjerenje na jednom studiju,
        pa učenje. Stranica za klijente, SEO i subdomen dolaze tek kad rezervacija radi.
      </p>

      {current ? (
        <article className="launch-plan__focus">
          <p className="launch-plan__eyebrow">Trenutni fokus</p>
          <h2>Faza {current.id}: {current.title}</h2>
          <p>{current.hypothesis}</p>
          <p className="launch-plan__metric">
            <strong>Mjerimo:</strong> {current.measure}
          </p>
        </article>
      ) : null}

      <ol className="launch-plan__list">
        {launchPhases.map((phase) => (
          <li key={phase.id} className={`launch-plan__item is-${phase.status}`}>
            <div className="launch-plan__head">
              <span className="launch-plan__badge">{phaseLabel(phase.status)}</span>
              <h3>Faza {phase.id}. {phase.title}</h3>
            </div>
            <p className="launch-plan__hyp">{phase.hypothesis}</p>
            <div className="launch-plan__cols">
              <div>
                <h4>Gradimo</h4>
                <ul>
                  {phase.build.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div>
                <h4>Mjerimo</h4>
                <p>{phase.measure}</p>
                <h4>Učimo</h4>
                <p>{phase.learn}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
