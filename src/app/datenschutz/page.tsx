// AC-14 — reachable without signing in, from both auth pages and from the app.
// The full record behind this page is docs/privacy.md.
import Link from 'next/link'

export const metadata = {
  title: 'Datenschutz — Ausgaben-Tracker',
}

export default function DatenschutzPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Datenschutz</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Was der Ausgaben-Tracker speichert, wozu, wo und wie lange.
      </p>

      <section className="mt-8 flex flex-col gap-6 text-sm leading-relaxed">
        <div>
          <h2 className="text-base font-semibold">Welche Daten gespeichert werden</h2>
          <ul className="mt-2 list-disc pl-5">
            <li>
              <strong>Für dein Konto:</strong> deine E-Mail-Adresse, dein Passwort als
              nicht rückrechenbarer Hash, dein Anzeigename sowie die Zeitpunkte von
              Registrierung und Anmeldungen.
            </li>
            <li>
              <strong>Für deine Ausgaben:</strong> Betrag, Währung, Kategorie, Datum
              und deine freie Notiz — und bei Fremdwährung der verwendete Wechselkurs
              samt Kursdatum.
            </li>
            <li>
              <strong>Zur Abwehr von Missbrauch:</strong> fehlgeschlagene
              Anmeldeversuche werden 15 Minuten lang im Arbeitsspeicher des Servers
              mitgezählt. Sie landen in keiner Datenbank.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold">Wozu</h2>
          <p className="mt-2">
            Ausschliesslich, um dir den Dienst bereitzustellen: dich anzumelden und
            deine Ausgaben zu speichern und auszuwerten. Es gibt keine Werbung, keine
            Analyse-Werkzeuge, keine Weitergabe an Dritte und keinen Verkauf von Daten.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold">Wer die Daten sehen kann</h2>
          <p className="mt-2">
            Nur du. Die Datenbank setzt das selbst durch: Jede Zeile ist an dein Konto
            gebunden, und Abfragen liefern ausschliesslich deine eigenen Zeilen — auch
            dann, wenn jemand am Programm vorbei direkt die Datenbank fragt.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold">Wo die Daten liegen</h2>
          <p className="mt-2">
            Bei Supabase in der Region Frankfurt (<code>eu-central-1</code>), also
            innerhalb der EU. Für die Umrechnung von Fremdwährungen fragen wir die
            Wechselkurse der Europäischen Zentralbank über den Dienst frankfurter.dev
            ab. Dabei werden nur Währungskürzel und ein Datum übertragen — nie ein
            Betrag und nie etwas, das auf dich schliessen lässt. Die Anfrage stellt
            unser Server, nicht dein Browser.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold">Wie lange</h2>
          <p className="mt-2">
            Bis du sie löschst. Eine einzelne Ausgabe verschwindet, sobald du sie
            löschst; Konto, Profil und sämtliche Ausgaben verschwinden, sobald du dein
            Konto löschst. Es gibt keine automatische Aufbewahrung darüber hinaus und
            keine Sicherungskopie, aus der wir etwas zurückholen würden.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold">Deine Rechte</h2>
          <p className="mt-2">
            Du kannst deine Daten jederzeit selbst herunterladen (maschinenlesbar als
            JSON) und dein Konto selbst löschen — beides findest du im angemeldeten
            Bereich unter &bdquo;Konto &amp; Daten&ldquo;. Beides wirkt sofort; du musst niemanden
            darum bitten.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold">Cookies</h2>
          <p className="mt-2">
            Nur eines, und zwar das technisch notwendige Sitzungs-Cookie deiner
            Anmeldung. Ohne es könntest du nicht angemeldet bleiben. Es gibt keine
            Cookies für Analyse oder Werbung, deshalb auch kein Einwilligungsbanner.
          </p>
        </div>

        <div className="text-muted-foreground">
          <p>
            Dieses Projekt entstand als Abschlussarbeit und wird nicht öffentlich
            betrieben. Für einen echten Betrieb fehlten hier noch die Angaben zum
            Verantwortlichen und ein Impressum.
          </p>
        </div>
      </section>

      <p className="mt-10 text-sm">
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Zurück zur Anmeldung
        </Link>
      </p>
    </div>
  )
}
