import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  useCreateOnlineWorkoutMutation,
  useDeleteOnlineWorkoutMutation,
  useListOnlineWorkoutsQuery,
  useUpdateOnlineWorkoutMutation,
  useUploadOnlineVideoMutation,
} from '../../api/onlineApi.js';
import { ONLINE_ENABLED } from '../../lib/onlineFeature.js';
import './OnlinePage.scss';

const REAL_ID = /^[a-f\d]{24}$/i;
const MAX_VIDEO_MB = 100;

const emptyForm = {
  title: '',
  description: '',
  videoUrl: '',
  videoPublicId: '',
  durationMinutes: '30',
  price: '0',
};

function priceLabel(value) {
  const amount = Number(value) || 0;
  if (amount <= 0) return 'Besplatno izvan paketa';
  return `${amount.toFixed(2).replace('.', ',')} €`;
}

export default function OnlinePage() {
  const { studio } = useOutletContext();
  const tenantId = String(studio.id || '');
  const ready = REAL_ID.test(tenantId);
  const { data, isLoading, isError } = useListOnlineWorkoutsQuery(tenantId, {
    skip: !ONLINE_ENABLED || !ready,
  });
  const [uploadVideo, { isLoading: uploading }] = useUploadOnlineVideoMutation();
  const [createWorkout, { isLoading: creating }] = useCreateOnlineWorkoutMutation();
  const [updateWorkout, { isLoading: updating }] = useUpdateOnlineWorkoutMutation();
  const [deleteWorkout, { isLoading: removing }] = useDeleteOnlineWorkoutMutation();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [videoFile, setVideoFile] = useState(null);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState('');

  const workouts = data?.workouts || [];
  const saving = uploading || creating;

  if (!ONLINE_ENABLED) {
    return (
      <section className="studio-panel online-admin online-admin--soon">
        <div className="online-admin__atmosphere" aria-hidden="true">
          <span className="online-admin__wash" />
          <span className="online-admin__grain" />
        </div>
        <div className="online-admin__stage">
          <header className="online-admin__head">
            <div>
              <p className="online-admin__eyebrow">Biblioteka</p>
              <h1>Online</h1>
              <p className="online-admin__lede">
                Snimljeni treninzi za članove — upload, članarina i kasnije plaćanje.
              </p>
            </div>
            <span className="online-admin__soon-badge">Uskoro</span>
          </header>

          <article className="online-admin__soon">
            <header className="online-admin__panel-head">
              <span className="online-admin__index" aria-hidden="true">01</span>
              <div>
                <p className="online-admin__kicker">Status</p>
                <h2>Uskoro dolazi</h2>
                <p>
                  Ovu značajku još ne uključujemo u produkciju. Kad bude spremna, ovdje ćete
                  dodavati video treninge koje članovi gledaju preko paketa ili pojedinačne kupnje.
                </p>
              </div>
            </header>
            <ul className="online-admin__roadmap">
              <li>
                <strong>Upload videa</strong>
                <span>Snimke treninga na Cloudinary ili vanjski link</span>
              </li>
              <li>
                <strong>Pristup preko paketa</strong>
                <span>Članovi s aktivnom članarinom gledaju besplatno</span>
              </li>
              <li>
                <strong>Pojedinačna kupnja</strong>
                <span>Plaćanje karticom za one izvan paketa — kasnije</span>
              </li>
            </ul>
          </article>
        </div>
      </section>
    );
  }

  function change(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError('');
  }

  function closeModal() {
    setOpen(false);
    setFormError('');
    setVideoFile(null);
  }

  function onPickVideo(event) {
    const file = event.target.files?.[0] || null;
    setFormError('');
    if (!file) {
      setVideoFile(null);
      return;
    }
    if (!file.type.startsWith('video/')) {
      setFormError('Odaberite video datoteku (MP4 ili WebM).');
      setVideoFile(null);
      return;
    }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setFormError(`Video je prevelik (max ${MAX_VIDEO_MB} MB na free planu).`);
      setVideoFile(null);
      return;
    }
    setVideoFile(file);
    setForm((current) => ({ ...current, videoUrl: '', videoPublicId: '' }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setFormError('');
    if (!form.title.trim()) {
      setFormError('Upišite naziv treninga.');
      return;
    }
    const hasLink = /^https?:\/\//i.test(form.videoUrl.trim()) || form.videoUrl.trim().startsWith('/uploads/');
    if (!videoFile && !hasLink) {
      setFormError('Uploadajte video ili zalijepite vanjski link.');
      return;
    }
    const durationMinutes = Number.parseInt(form.durationMinutes, 10);
    const price = Number.parseFloat(String(form.price).replace(',', '.'));
    if (!Number.isFinite(durationMinutes) || durationMinutes < 1) {
      setFormError('Trajanje mora biti barem 1 minuta.');
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setFormError('Cijena mora biti 0 ili više.');
      return;
    }
    try {
      let videoUrl = form.videoUrl.trim();
      let videoPublicId = form.videoPublicId.trim() || undefined;
      let resolvedDuration = durationMinutes;

      if (videoFile) {
        const uploaded = await uploadVideo({ tenantId, file: videoFile }).unwrap();
        videoUrl = uploaded.video.url;
        videoPublicId = uploaded.video.publicId || undefined;
        if (uploaded.video.durationMinutes) {
          resolvedDuration = uploaded.video.durationMinutes;
        }
      }

      await createWorkout({
        tenantId,
        body: {
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          videoUrl,
          videoPublicId,
          durationMinutes: resolvedDuration,
          price,
        },
      }).unwrap();
      setForm(emptyForm);
      setVideoFile(null);
      closeModal();
      setNotice('Online trening je objavljen. Članovi s preostalim terminima gledaju ga besplatno.');
    } catch (failure) {
      const code = failure?.data?.code;
      if (failure?.status === 'FETCH_ERROR') {
        setFormError('Poslužitelj nije dostupan.');
        return;
      }
      if (code === 'PAYLOAD_TOO_LARGE') {
        setFormError(`Video je prevelik (max ${MAX_VIDEO_MB} MB).`);
        return;
      }
      if (code === 'UPLOAD_FAILED') {
        setFormError('Upload na Cloudinary nije uspio. Provjerite CLOUDINARY_* u .env.');
        return;
      }
      setFormError('Trening nije spremljen. Provjerite podatke.');
    }
  }

  async function onToggle(item) {
    setBusyId(item.id);
    setNotice('');
    try {
      await updateWorkout({
        tenantId,
        workoutId: item.id,
        body: { active: !item.active },
      }).unwrap();
    } catch {
      setNotice('Status nije promijenjen.');
    } finally {
      setBusyId('');
    }
  }

  async function onRemove(item) {
    setBusyId(item.id);
    setNotice('');
    try {
      await deleteWorkout({ tenantId, workoutId: item.id }).unwrap();
    } catch {
      setNotice('Brisanje nije uspjelo.');
    } finally {
      setBusyId('');
    }
  }

  if (!ready) {
    return (
      <section className="studio-panel online-admin">
        <div className="online-admin__atmosphere" aria-hidden="true">
          <span className="online-admin__wash" />
          <span className="online-admin__grain" />
        </div>
        <div className="online-admin__stage">
          <p className="online-admin__eyebrow">Online</p>
          <h1>Još nije spremno</h1>
          <p className="online-admin__lede">Studio još nije u bazi.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="studio-panel online-admin">
      <div className="online-admin__atmosphere" aria-hidden="true">
        <span className="online-admin__wash" />
        <span className="online-admin__grain" />
      </div>
      <div className="online-admin__stage">
        <header className="online-admin__head">
          <div>
            <p className="online-admin__eyebrow">Biblioteka</p>
            <h1>Online</h1>
            <p className="online-admin__lede">
              Snimljeni treninzi za članove. Tko ima preostale termine u paketu — gleda besplatno.
              Ostali će kasnije moći platiti pojedinačno.
            </p>
          </div>
          <button
            className="online-admin__primary"
            type="button"
            onClick={() => {
              setOpen(true);
              setFormError('');
              setNotice('');
            }}
          >
            Dodajte trening
          </button>
        </header>

        {notice ? <p className="online-admin__notice" role="status">{notice}</p> : null}

        {isLoading ? <p className="online-admin__hint">Učitavamo…</p> : null}
        {isError ? <p className="online-admin__error">Lista se nije učitala.</p> : null}

        {!isLoading && !isError && workouts.length === 0 ? (
          <article className="online-admin__empty">
            <header className="online-admin__panel-head">
              <span className="online-admin__index" aria-hidden="true">01</span>
              <div>
                <p className="online-admin__kicker">Biblioteka</p>
                <h2>Još nema treninga</h2>
                <p>Dodajte prvi snimljeni trening — članovi ga vide u navigaciji Online.</p>
              </div>
            </header>
            <button className="online-admin__primary" type="button" onClick={() => setOpen(true)}>
              Dodajte trening
            </button>
          </article>
        ) : null}

        {workouts.length > 0 ? (
          <section className="online-admin__library">
            <header className="online-admin__panel-head">
              <span className="online-admin__index" aria-hidden="true">01</span>
              <div>
                <p className="online-admin__kicker">Objavljeno</p>
                <h2>Treninzi</h2>
                <p>Upravljajte snimkama koje članovi vide online.</p>
              </div>
              <p className="online-admin__meta">
                <strong>{workouts.length}</strong>
                <span>ukupno</span>
              </p>
            </header>
            <ul className="online-admin__list">
              {workouts.map((item) => {
                const busy = busyId === item.id;
                return (
                  <li key={item.id} className={item.active ? undefined : 'is-off'}>
                    <div>
                      <div className="online-admin__title-row">
                        <strong>{item.title}</strong>
                        <em>{item.active ? 'Objavljeno' : 'Skriveno'}</em>
                      </div>
                      <p>
                        {item.durationMinutes}
                        {' min · '}
                        {priceLabel(item.price)}
                      </p>
                      {item.description ? <p className="online-admin__desc">{item.description}</p> : null}
                    </div>
                    <div className="online-admin__actions">
                      <button
                        type="button"
                        disabled={busy || updating}
                        onClick={() => onToggle(item)}
                      >
                        {item.active ? 'Sakrijte' : 'Objavite'}
                      </button>
                      <button
                        type="button"
                        className="is-danger"
                        disabled={busy || removing}
                        onClick={() => onRemove(item)}
                      >
                        Obrišite
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>

      {open ? (
        <div
          className="online-admin__modal"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <form
            className="online-admin__form"
            onSubmit={onSubmit}
            noValidate
            role="dialog"
            aria-modal="true"
            aria-labelledby="online-admin-title"
          >
            <div className="online-admin__form-head">
              <div>
                <h2 id="online-admin-title">Novi online trening</h2>
                <p>
                  Uploadajte video na Cloudinary (isti free račun kao za slike) ili zalijepite vanjski link.
                </p>
              </div>
              <button type="button" className="online-admin__close" onClick={closeModal} aria-label="Zatvori">
                ×
              </button>
            </div>
            <div className="online-admin__grid">
              <label>
                Naziv
                <input
                  value={form.title}
                  onChange={(event) => change('title', event.target.value)}
                  placeholder="npr. Core 20 min"
                  autoFocus
                />
              </label>
              <label>
                Trajanje (min)
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={form.durationMinutes}
                  onChange={(event) => change('durationMinutes', event.target.value)}
                />
              </label>
              <label className="online-admin__full">
                Video datoteka
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={onPickVideo}
                />
                <span className="online-admin__file-hint">
                  {videoFile
                    ? `${videoFile.name} · ${(videoFile.size / (1024 * 1024)).toFixed(1)} MB`
                    : `MP4 / WebM, do ${MAX_VIDEO_MB} MB · ide na Cloudinary free plan`}
                </span>
              </label>
              <label className="online-admin__full">
                Ili vanjski link (opcionalno)
                <input
                  value={form.videoUrl}
                  onChange={(event) => {
                    change('videoUrl', event.target.value);
                    if (event.target.value.trim()) setVideoFile(null);
                  }}
                  placeholder="https://… (ako ne uploadate datoteku)"
                  disabled={Boolean(videoFile)}
                />
              </label>
              <label>
                Cijena (€) bez paketa
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) => change('price', event.target.value)}
                />
              </label>
              <label className="online-admin__full">
                Opis
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) => change('description', event.target.value)}
                  placeholder="Kratko što član radi u ovom treningu"
                />
              </label>
            </div>
            {formError ? <p className="online-admin__error">{formError}</p> : null}
            <div className="online-admin__form-actions">
              <button className="online-admin__ghost" type="button" onClick={closeModal}>
                Odustani
              </button>
              <button className="online-admin__primary" type="submit" disabled={saving}>
                {uploading ? 'Uploadamo video…' : creating ? 'Spremamo…' : 'Objavite'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
