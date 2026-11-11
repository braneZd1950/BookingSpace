# Javna stranica studija

Indeks: [README.md](README.md) · Lean: [lean/phase-04-frontend.md](lean/phase-04-frontend.md) · Status: [16-current-status.md](16-current-status.md)

---

## Što je uživo

- Wizard `/postavljanje` (predložak, layout, boje, tekst, slike)  
- Preview na početnoj vlasnika / člana  
- Javni ulaz: `/s/:slug` → CTA na `/s/:slug/termini`  

## Što još nije

| Stavka | Zašto kasnije |
| --- | --- |
| Pravi DNS / custom domena | Ops nakon dokaza bookinga |
| Puna galerija u navigaciji | Nije potrebna za pilot |
| Marketplace | Poslije pilota |
| Drag-and-drop page builder | Nikad u MVP-u |

Dugoročna vizija: `{slug}.domena.hr`. Danas je to samo copy — **slug rute su izvor istine**.

---

## Dizajn (dijelom uživo)

| Dio | Napomena |
| --- | --- |
| Sekcije | Hero, O nama, Usluge, Termini, Galerija, Kontakt… (`visibleSections`) |
| Predlošci | Fitness, pilates, Power Plate, igraonica, generički — bez page buildera |
| Tema | Primarna/sekundarna boja, font, radius, gumb, paleta |
| Slike | Cloudinary ili upload API — **ne** binarni blob u MongoDB |
| SEO / domena | Poliranje kasnije |

---

## Pravilo

Prvo dokaži rezervacije. Lijepa domena dolazi poslije.
