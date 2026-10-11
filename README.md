# musicA SaveIt

Sichert einzelne Titel, Alben und Playlists aus den eigenen Streaming-Accounts
(Apple Music zuerst, dann Spotify und YouTube Music) als Dateien in einen frei
wählbaren Ordner. Windows 10/11, Bedienung im Browser, dunkle Oberfläche.

## Stand

- `docs/01-anforderungen-und-konzept.md` – Anforderungen, Querverweise,
  Probleme mit Lösungen, UX-Konzept, Funktionsvorschläge, Phasenplan.
- `app/web/` – die Oberfläche (HTML, CSS, JS ohne Build-Schritt). Läuft ohne
  Backend im Demo-Modus mit simulierten Aufträgen: `index.html` im Browser
  öffnen. Sobald das Backend unter `/api` antwortet, schaltet sie auf echte Daten um.

Das Python-Backend (Quellen, Matcher, Recorder, Tags, Tray) folgt als Nächstes,
siehe Phase 0.1 und 0.2 im Konzept.
