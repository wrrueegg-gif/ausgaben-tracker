# App-Rahmen & Navigation

> Die app-weite Karte des **Rahmens, in dem jedes Feature gezeigt wird** — Navigation, Layout-Bereiche und die Muster, die jede Seite wiederholt.
>
> - Erstellt von `/init` (der erste ganzheitliche Durchgang: oberste Bereiche + Layout).
> - Verfeinert von `/architecture`, sobald ein Feature entworfen wird.
> - **Flughöhe:** Struktur, nicht Gestaltung. Farben, Schriften und Komponenten-Styling gehören in `docs/design-system.md`; die Innereien einer einzelnen Seite in das `design.md` ihres Features.

## Verantwortliches Feature

Owner: **PROJ-1 — Benutzerkonto & Login.** Dieses Produkt ist ein Zwei-Seiten-MVP (öffentliche Anmeldeseiten, ein geschützter Bereich). Der Rahmen besteht aus einer schmalen Kopfzeile mit Produktnamen und Abmelden-Knopf, und PROJ-1 ist das Feature, das den geschützten Bereich samt dieser Kopfzeile überhaupt erst herstellt. **Ein eigenes „App Shell & Navigation"-Feature gibt es bewusst nicht** — bei zwei Seiten wäre es reine Zeremonie. Änderungen am Rahmen laufen über `/refine PROJ-1`.

## Oberste Bereiche

| Bereich | Was die Person dort tut | Sichtbar für | Verantwortliches Feature |
|---------|-------------------------|--------------|--------------------------|
| Anmelden (`/login`) | Mit E-Mail und Passwort anmelden | abgemeldete Personen | PROJ-1 |
| Registrieren (`/signup`) | Ein Konto anlegen | abgemeldete Personen | PROJ-1 |
| Übersicht (`/app`) | Ausgaben erfassen, Liste und Monatsauswertung ansehen | angemeldete Personen | PROJ-2 |

Es gibt keine Navigationsleiste mit mehreren Zielen: Angemeldet existiert genau ein Bereich. Zwischen Anmelden und Registrieren wird über einen Textlink am Formularende gewechselt.

## Layout-Bereiche

- **Kopfzeile (nur angemeldet):** links der Produktname „Ausgaben-Tracker", rechts die E-Mail der angemeldeten Person und der Abmelden-Knopf. Volle Breite, unten abgegrenzt durch eine Linie (`border`), Inhalt auf maximal `max-w-3xl` zentriert.
- **Inhalt:** die Oberfläche des jeweiligen Features, zentriert in derselben Breite, mit Abstand nach oben und unten.
- **Keine Seitenleiste** — bei einem einzigen angemeldeten Bereich gibt es nichts zu navigieren.
- **Anmeldeseiten:** keine Kopfzeile. Eine zentrierte Karte (`max-w-sm`) auf leerem Hintergrund, Produktname als Überschrift darüber.
- **Mobil (unter `md`):** identischer Aufbau, nur schmaler; die Kopfzeile bleibt einzeilig, die E-Mail-Adresse wird unter `sm` ausgeblendet, der Abmelden-Knopf bleibt immer sichtbar.

## Seitenmuster

- **Seitenkopf:** Titel links (`text-2xl font-semibold`), primäre Aktion rechts auf derselben Zeile.
- **Ladezustand:** Skelettflächen an der Stelle des späteren Inhalts (Liste, Summenkarten) — kein Springen des Layouts, kein Vollbild-Spinner.
- **Leerzustand:** eine kurze Zeile in gedämpfter Farbe, die sagt, was zu tun ist („Noch keine Ausgaben in diesem Monat. Erfasse deine erste Ausgabe.").
- **Fehlerzustand:** eine Meldung im Inhaltsbereich (`Alert`, Variante `destructive`) mit Klartext und, wo sinnvoll, einem Knopf zum erneuten Versuchen. Formularfehler stehen direkt unter dem betroffenen Feld.
- **Rückmeldungen:** kurze Bestätigungen als Toast unten rechts (`sonner`); eine Rückmeldung, die eine Entscheidung verlangt, ist kein Toast, sondern ein Dialog.

## Anmeldezustände

- **Abgemeldet:** erreichbar sind nur `/login` und `/signup`. Der Aufruf von `/app` leitet auf `/login` um.
- **Angemeldet:** erreichbar ist `/app` samt Kopfzeile. Der Aufruf von `/login` oder `/signup` leitet auf `/app` um.
- **Rollen:** keine. Alle angemeldeten Personen haben dieselben Rechte an ihren eigenen Daten.

## Rahmen-Komponenten

| Komponente | Datei | Zweck |
|------------|-------|-------|
| `AppHeader` | `src/components/app-header.tsx` | Kopfzeile des geschützten Bereichs: Produktname, E-Mail, Abmelden-Knopf |
| Layout des geschützten Bereichs | `src/app/app/layout.tsx` | Setzt die Kopfzeile und die Inhaltsbreite; erzwingt die Anmeldung |
| Layout der Anmeldeseiten | `src/app/(auth)/layout.tsx` | Zentrierte Karte für Anmelden und Registrieren |

---

_Dies ist ein lebendes Dokument. Verhaltensänderungen am Rahmen laufen über `/refine` auf dem verantwortlichen Feature — nie direkt in das `design.md` eines anderen Features._
