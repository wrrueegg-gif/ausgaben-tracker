# Datenmodell

> Die app-weite Karte, **welche Daten dieses Produkt speichert und wie sie zusammenhängen** — der gemeinsame Bauplan, dem die Tabellen jedes Features folgen.
>
> - Erstellt von `/init` (der erste ganzheitliche Durchgang: Entitäten + Beziehungen).
> - Verfeinert von `/architecture`, sobald ein Feature entworfen wird.
> - **Flughöhe:** Entitäten, Beziehungen und Eigentümerschaft stehen hier (Produktebene, für alle lesbar). Spaltentypen, Indizes und konkrete Fremdschlüssel werden pro Feature in dessen `design.md` entschieden — nicht hier.

## Entitäten

| Entität | Was sie darstellt | Gehört / sichtbar für |
|---------|-------------------|-----------------------|
| `auth.users` | Das Anmeldekonto (E-Mail, Passwort-Hash, Anmeldezeitpunkte). Von Supabase Auth verwaltet, nicht von uns. | nur die Person selbst; die App liest daraus nur die eigene ID und E-Mail |
| `profiles` | Das Profil zu einem Konto: Anzeigename und Anlagedatum. Entsteht automatisch bei der Registrierung. | nur die Person selbst |
| `expenses` | Eine einzelne Ausgabe: Betrag in CHF, Kategorie, Ausgabedatum, optionale Notiz — und bei Fremdwährung zusätzlich Originalbetrag, Währung, verwendeter Kurs, Kursdatum und Kursquelle (PROJ-3). Angelegt von PROJ-2. | nur die Person, die sie erfasst hat |

Kategorien sind **keine eigene Entität**: Sie sind eine feste, im Code definierte Liste (Lebensmittel, Wohnen, Mobilität, Freizeit, Gesundheit, Sonstiges). Eigene Kategorien sind ein Non-Goal dieser Version.

Wechselkurse sind **keine eigene Entität**: Der Kurs wird zum Zeitpunkt der Erfassung bei der Frankfurter-API geholt und als Wert **auf der Ausgabe selbst** festgeschrieben. Das ist Absicht — eine Ausgabe muss auch in einem Jahr noch zeigen, mit welchem Kurs sie umgerechnet wurde, unabhängig davon, was die API heute liefert.

## Beziehungen

- Zu jedem Konto (`auth.users`) gehört genau ein `profiles`-Eintrag, angelegt beim Registrieren.
- Ein Profil hat viele `expenses`.
- Jede `expenses`-Zeile gehört zu genau einem Konto und ist nur für dieses sichtbar.
- Jede `expenses`-Zeile trägt ihre Währungsangaben in sich; sie verweist auf keine Kurstabelle.

## Diagramm

```
auth.users  (Supabase Auth)
  └─ hat genau ein  profiles
        └─ hat viele  expenses
              └─ trägt ihre Währungs- und Kursangaben als eigene Felder
```

## Eigentümerschaft und Zugriff

Jede Tabelle, die dieses Produkt anlegt, trägt Row Level Security und Regeln, die den Zugriff auf die eigene Zeile beschränken (`user_id` gleich der angemeldeten Person). Dieses Muster wird von PROJ-1 etabliert und von jedem weiteren Feature kopiert — die Prüfung passiert in der Datenbank, nicht nur im Anwendungscode.

---

_Dies ist ein lebendes Dokument. Wenn `/architecture` ein Feature entwirft, das eine Entität einführt oder verändert, aktualisiert es zuerst diese Karte, damit spätere Features gegen ein zutreffendes Bild bauen._
