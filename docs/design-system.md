# Design-System

> Die verbindlichen Gestaltungswerte dieses Produkts. `/build` wendet sie an, ohne nochmals zu fragen.
>
> Vorgeschlagen von `/init` (der Nutzer hatte kein eigenes System) und freigegeben. Gewünschte Wirkung: **ruhig und vertrauenswürdig** — ein Werkzeug für Geld, das nicht nach Spielerei aussieht.

Grundlage ist das Token-System, das bereits in `src/app/globals.css` liegt (shadcn/ui-Variablen als HSL-Tripel ohne `hsl()`-Hülle, Tailwind v4, `@theme inline`). Dieses Dokument ersetzt keine Datei, sondern legt die **Werte** fest, die dort einzutragen sind. Wer eine Farbe ändert, ändert sie dort und hier — nirgends sonst.

## Farben

Format: HSL-Tripel, genau so wie in `globals.css` einzutragen (`--primary: 173 58% 34%;`).

### Hell (`:root`)

| Token | Wert | Verwendung |
|-------|------|------------|
| `--background` | `160 20% 98%` | Seitenhintergrund, nahezu weiss mit einem Hauch Grün — nie `#fff` |
| `--foreground` | `200 15% 12%` | Fliesstext, nahezu schwarz — nie `#000` |
| `--card` | `0 0% 100%` | Karten heben sich vom Hintergrund ab |
| `--card-foreground` | `200 15% 12%` | Text auf Karten |
| `--primary` | `173 58% 34%` | Hauptfarbe (Teal): primäre Knöpfe, aktive Zustände |
| `--primary-foreground` | `160 20% 98%` | Text auf der Hauptfarbe |
| `--secondary` | `160 12% 94%` | ruhige Flächen, sekundäre Knöpfe |
| `--secondary-foreground` | `200 15% 20%` | Text darauf |
| `--muted` | `160 12% 94%` | Hintergrund gedämpfter Bereiche |
| `--muted-foreground` | `200 8% 42%` | Hilfstexte, Leerzustände — Kontrast ≥ 4.5:1 gegen `--background` |
| `--accent` | `173 45% 92%` | dezente Einfärbung der Hauptfarbe (Hover auf Listenzeilen, Hervorhebung) |
| `--accent-foreground` | `173 58% 22%` | Text darauf |
| `--destructive` | `358 70% 48%` | Löschen, Fehlermeldungen |
| `--destructive-foreground` | `0 0% 98%` | Text darauf |
| `--border` | `160 12% 88%` | Trennlinien, Kartenrand |
| `--input` | `160 12% 88%` | Rahmen von Eingabefeldern |
| `--ring` | `173 58% 34%` | Fokusring — dieselbe Hauptfarbe, damit Fokus unübersehbar ist |
| `--radius` | `0.625rem` | siehe unten |

### Dunkel (`.dark`)

| Token | Wert |
|-------|------|
| `--background` | `200 18% 9%` |
| `--foreground` | `160 10% 95%` |
| `--card` | `200 16% 12%` |
| `--card-foreground` | `160 10% 95%` |
| `--primary` | `173 52% 46%` |
| `--primary-foreground` | `200 18% 9%` |
| `--secondary` | `200 12% 18%` |
| `--secondary-foreground` | `160 10% 95%` |
| `--muted` | `200 12% 18%` |
| `--muted-foreground` | `200 8% 66%` |
| `--accent` | `173 30% 22%` |
| `--accent-foreground` | `173 45% 85%` |
| `--destructive` | `358 60% 52%` |
| `--destructive-foreground` | `0 0% 98%` |
| `--border` | `200 12% 22%` |
| `--input` | `200 12% 22%` |
| `--ring` | `173 52% 46%` |

**Hell und dunkel sind beide von Anfang an definiert.** Die App folgt der Systemeinstellung; einen Umschalter gibt es in dieser Version nicht.

### Zustände der Hauptfarbe

Die Hauptfarbe wird nie flach über grosse Flächen gelegt. Es gibt drei abgeleitete Zustände, umgesetzt über Tailwind-Utilities auf dem Basiswert:

- **Hover:** um ca. 6 % dunkler (hell) bzw. heller (dunkel).
- **Aktiv/gedrückt:** um ca. 12 % dunkler bzw. heller.
- **Dezenter Hintergrund:** `--accent` (siehe Tabelle) — für ausgewählte Zeilen und Hervorhebungen.

## Typografie

- **Schrift:** die im Template bereits geladene Systemschrift-Kette bleibt (Geist/`font-sans`). Keine zusätzliche Webschrift — sie kostet Ladezeit ohne Gegenwert.
- **Skala:** `text-xs` (12) Hilfstexte · `text-sm` (14) Fliesstext in Tabellen und Formularen · `text-base` (16) Fliesstext · `text-lg` (18) Kartenüberschrift · `text-2xl` (24) Seitentitel · `text-3xl` (30) Betragsanzeige der Monatssumme.
- **Gewichte:** Überschriften `font-semibold`, Fliesstext `font-normal`, Beträge `font-medium` und **`tabular-nums`** — Zahlenkolonnen müssen untereinander fluchten.

## Radius, Abstände, Erhebung

- **Radius:** `--radius: 0.625rem`, eine einzige Entscheidung, überall angewandt. Knöpfe und Eingabefelder `rounded-md`, Karten `rounded-lg`. Keine gemischten Radien.
- **Abstandsrhythmus:** Vielfache von 4 px, konkret `gap-2` innerhalb einer Gruppe, `gap-4` zwischen Gruppen, `gap-6` zwischen Abschnitten, `py-8` als Seitenabstand oben/unten.
- **Erhebung:** Flächen werden durch **Rahmen** getrennt, nicht durch Schatten. Ausnahme: Overlays (Dialog, Dropdown, Toast) tragen `shadow-lg`.

## Komponenten-Konventionen

- **Knöpfe:** Standard ist `size="default"`, `variant="default"` für die eine primäre Aktion einer Seite, `variant="outline"` für alles Sekundäre, `variant="ghost"` in Kopfzeilen und Zeilen, `variant="destructive"` nur fürs Löschen.
- **Eingabefelder:** volle Breite der Karte, Label immer sichtbar über dem Feld (kein Platzhalter als Label), Fehlermeldung direkt darunter in `text-destructive text-sm`.
- **Jedes bedienbare Element hat einen sichtbaren Hover- **und** Fokuszustand.** Der Fokusring nutzt `--ring` und wird nie entfernt — Tastaturnutzer haben sonst nichts.
- **Leerzustand:** eine Zeile in `text-muted-foreground`, die sagt, was zu tun ist — kein Bild, keine Illustration.
- **Ladezustand:** `Skeleton` in der Form des erwarteten Inhalts, nie ein Vollbild-Spinner.
- **Text steht auf mindestens 4.5:1 Kontrast** gegen den eigenen Hintergrund, in beiden Themes.
- **shadcn/ui zuerst:** die installierten Komponenten werden benutzt, nie nachgebaut.
