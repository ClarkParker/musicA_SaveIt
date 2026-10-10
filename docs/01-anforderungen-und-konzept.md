# musicA SaveIt – Anforderungen, Querverweise, Probleme, Lösungen

Stand: 2026-10-10 · Status: Entwurf zur Abstimmung · Sprache der App: Deutsch (Englisch vorbereitet)

Ziel: Ein Windows-10-Tool, das ein bestimmtes Lied oder eine ganze Playlist aus
den eigenen Streaming-Accounts (zuerst Apple Music) als Datei in einen frei
wählbaren Ordner sichert. Einfach zu installieren, Bedienung im Browser, dunkle
Oberfläche, kompromisslos auf Bedienbarkeit ausgelegt, ohne Funktionsverlust.

---

## 1. Anforderungen (aus deiner Beschreibung abgeleitet)

Priorität: **M** = Muss (v1), **S** = Soll (v1 oder kurz danach), **K** = Kann (später).

### 1.1 Funktional

| Nr | Anforderung | Prio | Anmerkung |
|----|-------------|------|-----------|
| F1 | Einzelnes Lied per Link sichern | M | Link aus Apple Music / Spotify / YouTube Music einfügen |
| F2 | Ganze Playlist per Link sichern | M | Reihenfolge der Playlist bleibt erhalten |
| F3 | Ganzes Album per Link sichern | S | technisch identisch zu F2 |
| F4 | Zielordner frei wählbar, wird gemerkt | M | letzter Ordner ist Standard, Favoriten-Ordner möglich |
| F5 | Ordner- und Dateinamens-Schema einstellbar | S | z. B. `{Playlist}/{Nr} - {Artist} - {Titel}` |
| F6 | Audio-Format wählbar | M | Original (AAC/Opus), MP3 320, FLAC |
| F7 | Vollständige Tags + Cover in der Datei | M | Titel, Artist, Album, Jahr, Tracknummer, Cover, ISRC |
| F8 | Fortschritt pro Titel + gesamt, Pause, Abbruch, Wiederholen | M | sichtbar ohne Scrollen |
| F9 | Mehrere Aufträge nacheinander in einer Warteschlange | M | Playlist A, dann Playlist B, ohne Warten |
| F10 | Fehler pro Titel verständlich anzeigen, nicht abbrechen | M | ein kaputter Titel stoppt nicht die Playlist |
| F11 | Verlauf: was wurde wann wohin gesichert | S | mit „Ordner öffnen“ und „erneut laden“ |
| F12 | Quellen: Apple Music zuerst, dann Spotify, YouTube Music | M/S | Tidal, Deezer, Amazon als Adapter später |
| F13 | Mehrere Accounts/Dienste parallel nutzbar | S | kein Login im Tool nötig, siehe Abschnitt 2 |

### 1.2 Installation und Plattform

| Nr | Anforderung | Prio | Anmerkung |
|----|-------------|------|-----------|
| I1 | Windows 10 (64 Bit), ohne Admin-Rechte | M | auch Windows 11 |
| I2 | Installation: Doppelklick, fertig | M | keine Python-, Node- oder ffmpeg-Installation durch dich |
| I3 | Bedienung im Browser (Chrome/Edge/Firefox) | M | Tool öffnet den Browser selbst |
| I4 | Läuft weiter, wenn der Browser-Tab zu ist | M | Tray-Symbol mit Status und „Beenden“ |
| I5 | Portable Variante (ZIP, Konfiguration neben der EXE) | S | für USB-Stick / zweiten PC |
| I6 | Updates der fragilen Teile (yt-dlp) ohne Neuinstallation | M | siehe Problem P3 |

### 1.3 Oberfläche und Bedienung

| Nr | Anforderung | Prio | Anmerkung |
|----|-------------|------|-----------|
| U1 | Dunkles Design, modern, **kein** „KI-Webseiten-Look“ | M | Design-Regeln in Abschnitt 6 |
| U2 | Hauptweg in 3 Schritten: Link einfügen, Ordner prüfen, Start | M | Standardwerte so gut, dass Schritt 2 meist entfällt |
| U3 | Keine Funktion hinter „Einfachheit“ verstecken | M | Profi-Optionen aufklappbar, nicht entfernt |
| U4 | Tastatur: Strg+V überall fügt Link ein, Enter startet | M | plus Esc, Entf, Strg+O (Ordner) |
| U5 | Drag & Drop eines Links in das Fenster | S | |
| U6 | Alles Wichtige auf einem Bildschirm, keine Assistenten | M | ein Fenster, keine Wizard-Schritte |
| U7 | Deutsch als Standard, Englisch umschaltbar | S | |

### 1.4 Technik und Qualität

| Nr | Anforderung | Prio | Anmerkung |
|----|-------------|------|-----------|
| T1 | Vorhandene, gepflegte Werkzeuge nutzen statt alles neu | M | yt-dlp, ffmpeg, mutagen, ytmusicapi |
| T2 | Bestmögliche Audioqualität der jeweiligen Quelle | M | kein doppeltes Umkodieren |
| T3 | Stabil bei langen Playlists (500+ Titel) | S | Parallelität begrenzt, Wiederaufnahme nach Abbruch |
| T4 | Keine Datei zweimal laden (über Playlists hinweg) | S | siehe Funktion N4 |
| T5 | Lokale Oberfläche gegen fremde Webseiten abgesichert | M | siehe Problem P8 |

### 1.5 Recht (nur als Architektur-Vorgabe, keine Belehrung)

| Nr | Vorgabe | Konsequenz |
|----|---------|------------|
| R1 | Keine Entschlüsselung von DRM (FairPlay, Widevine) im Tool | Direkt-Download aus Apple Music/Spotify-Streams ist **nicht** Teil des Tools |
| R2 | Privatkopie-Wege bleiben: Mitschnitt der Ausgabe („Tonband“) und DRM-freie Quellen | Zwei Engines: **Matcher** (schnell) und **Recorder** (exakt) |
| R3 | Nur für dich, keine Teilen-Funktion | kein Upload, kein Server, kein Account im Tool |

---

## 2. Realitätscheck: Wie kommt die Musik auf die Platte?

Das ist der Kern des Projekts und bestimmt alles andere.

| Weg | Wie | Qualität | Tempo | Rechtlich (DE) | Stabilität |
|-----|-----|----------|-------|----------------|------------|
| A. Offizieller Offline-Download in der App | Apple Music / Spotify App | 256 kbps AAC, Lossless (Apple) | schnell | sauber | hoch, aber Dateien sind verschlüsselt und nur in der App nutzbar, weg bei Kündigung |
| B. Direkt-Download + DRM-Entschlüsselung (gamdl, votify, zotify, streamrip) | Widevine-/FairPlay-Schlüssel | Original | schnell | § 95a UrhG, klar außerhalb | bricht regelmäßig, Account-Sperre realistisch |
| C. **Playlist-Matching**: Playlist auslesen, jeden Titel bei YouTube Music suchen, dort laden (wie spotDL) | yt-dlp + ytmusicapi | Opus ~130 kbps, mit YouTube-Premium-Cookies AAC 256 kbps | schnell, parallel | Grauzone Streamripping, kein DRM-Bruch | mittel, yt-dlp braucht Updates |
| D. **Recorder**: Wiedergabe im Browser mitschneiden (WASAPI-Loopback) + automatische Titeltrennung | Windows-Audio + Media-Session-Daten | exakt der Stream (256 kbps AAC dekodiert, als FLAC/AAC gespeichert) | **Echtzeit** (1x) | Tonband-Prinzip, § 53 UrhG | hoch, unabhängig vom Dienst |
| E. Kauf DRM-frei (iTunes Store, Bandcamp, Qobuz, Amazon) | Download | Original, oft Lossless | schnell | sauber | hoch, kostet Geld |

**Entscheidung:** Das Tool bekommt zwei Engines, die sich ergänzen:

1. **Matcher (Standard, schnell):** Apple-Music-/Spotify-Playlist wird als
   *Liste* ausgelesen (Titel, Artist, Album, Dauer, ISRC). Jeder Titel wird bei
   YouTube Music gesucht, der beste Treffer mit yt-dlp geladen, mit den
   Original-Tags und dem Original-Cover der Playlist versehen. Für 90 % der
   Titel ist das in Sekunden erledigt.
2. **Recorder (exakt, Fallback):** Für Titel ohne guten Treffer, für
   Live-Versionen, Remixe, Hörbücher oder wenn du die exakte Apple-Music-Fassung
   willst. Der Browser spielt die Playlist, das Tool nimmt die Audioausgabe auf,
   trennt die Titel anhand der Windows-„Jetzt läuft“-Daten (Media Session) und
   taggt automatisch. Läuft über Nacht durch.

Weg B wird bewusst nicht gebaut. Weg A und E werden in der Oberfläche als
Hinweis erwähnt, wenn es passt (z. B. „Dieser Titel ist bei iTunes DRM-frei
kaufbar“), mehr nicht.

---

## 3. Architektur-Entscheidung

**„Localhost-App“: ein Windows-Programm mit Oberfläche im Browser.**

Warum nicht reine Browser-Lösung (Erweiterung / Webseite)?
- Ein Browser darf nicht in beliebige Ordner schreiben, nur in „Downloads“.
- Ein Browser kann keine Systemaudio-Aufnahme machen, und DRM-Inhalte werden bei
  Tab-Aufnahme stummgeschaltet.
- yt-dlp und ffmpeg sind native Programme.

Warum nicht Electron / Tauri?
- Electron: 150 MB+, für ein Ein-Zweck-Tool zu schwer.
- Tauri: schlank, aber Rust-Toolchain, und alle Audio-/Windows-APIs müssten in
  Rust neu angebunden werden. Python hat für jeden Baustein fertige Bibliotheken.

**Stack (Vorschlag):**

| Schicht | Wahl | Grund |
|---------|------|-------|
| Backend | Python 3.12, FastAPI + Uvicorn, WebSocket für Fortschritt | klein, schnell zu bauen, überall dokumentiert |
| Download | yt-dlp (als Python-Modul, selbst-aktualisierend) | de-facto Standard |
| Audio | ffmpeg (statisch, LGPL-Build, mitgeliefert) | Konvertierung, Schnitt, Loudness |
| Tags | mutagen | MP3/M4A/FLAC/Opus, Cover einbetten |
| Suche | ytmusicapi (ohne Login) | YouTube-Music-Suche inkl. Dauer, Album |
| Quellen | Apple Music (öffentliche Playlist-Seite + Katalog-API mit öffentlichem Web-Token), Spotify (Web-API), YouTube Music (yt-dlp) | kein Login im Tool nötig |
| Recorder | pyaudiowpatch (WASAPI-Loopback), winsdk (Media Session / „Jetzt läuft“), pycaw (andere Apps stummschalten) | alles Windows-Bordmittel |
| Tray | pystray | Status, Beenden, Ordner öffnen |
| Datenbank | SQLite | Verlauf, Katalog (ISRC), Sync-Zustand |
| Frontend | eine HTML-Seite, Vanilla JS + Preact/htm (ohne Build-Schritt), eigenes CSS | kein Framework-Look, keine Toolchain |
| Paketierung | PyInstaller (onedir) → `SaveIt.exe` + Ordner, als ZIP (portable) und optional Inno-Setup-Installer | Doppelklick, ohne Admin |

Start-Ablauf: Doppelklick → Tray-Symbol erscheint → Browser öffnet
`http://127.0.0.1:<port>/#<token>` → Oberfläche. Schließen des Tabs beendet
nichts, „Beenden“ im Tray beendet alles sauber.

---

## 4. Querverweise und Konflikte zwischen Anforderungen

| Konflikt | Problem | Lösung |
|----------|---------|--------|
| I3 „im Browser“ ↔ F4 „beliebiger Ordner“ | Browser liefert keinen Ordnerpfad, nur Dateien | Backend öffnet den nativen Windows-Ordnerdialog (IFileOpenDialog); im Browser ein Button „Ordner wählen…“ plus Textfeld mit Verlauf der letzten Ordner |
| I3 ↔ T5 Sicherheit | Jede Webseite in deinem Browser könnte `127.0.0.1:<port>` ansprechen und Downloads auslösen oder Pfade setzen | Nur an 127.0.0.1 binden, zufälliger Port, Zufalls-Token in jeder Anfrage (Header), Host-Header prüfen, kein CORS. Standard, aber oft vergessen |
| I2 „Doppelklick“ ↔ T1 „yt-dlp/ffmpeg“ | Drei Fremdprogramme müssten installiert werden | Alles in die EXE-Distribution einpacken (~90 MB). Erster Start braucht keine Internetverbindung |
| I2 ↔ Windows SmartScreen | Unsignierte EXE zeigt „Unbekannter Herausgeber“ | Dokumentiert („Weitere Informationen → Trotzdem ausführen“), SHA-256 im Release, später Code-Signatur möglich |
| U2 „3 Schritte“ ↔ U3 „nichts verstecken“ | Optionen blähen den Hauptweg auf | Oberfläche in zwei Dichten: Hauptleiste mit Link/Ordner/Format/Start, darunter aufklappbar „Mehr“ mit Schema, Qualität, Parallelität, Engine-Wahl. Einstellungen bleiben pro Auftrag sichtbar, nicht in einem versteckten Menü |
| F2 Playlist (schnell) ↔ Recorder (Echtzeit) | 60 Titel = 4 Stunden Aufnahme | Recorder nur als Fallback oder bewusst gewählt; Oberfläche zeigt geschätzte Dauer *vor* dem Start; Rechner wird am Einschlafen gehindert; „Über Nacht“-Modus mit Auto-Stopp |
| Recorder ↔ Windows 10 | Windows 10 kann nicht „nur eine App“ aufnehmen (Prozess-Loopback gibt es erst ab Windows 11); Benachrichtigungstöne landen in der Aufnahme | „Stille-Modus“: während der Aufnahme werden alle anderen Audio-Sitzungen per Core-Audio auf 0 gesetzt und danach wiederhergestellt. Zusätzlich Vorschlag „Benachrichtigungsassistent“ aktivieren |
| Recorder ↔ Titelgrenzen | Wo endet Titel 1, wo beginnt Titel 2? | Primär: Media-Session-Ereignis „Titel gewechselt“ aus dem Browser (Apple Music Web setzt diese Daten). Sekundär: Stille-Erkennung. Tertiär: bekannte Dauer aus der Playlist. Alle drei werden kombiniert, Abweichung > 1,5 s wird markiert |
| Recorder ↔ T2 Qualität | Windows-Mixer resampelt 44,1 kHz auf 48 kHz | Tool prüft das Ausgabegerät und bietet an, es auf 44,1 kHz / 16 Bit zu stellen; Aufnahme als FLAC (verlustfrei gegenüber dem Mixer) oder AAC 256 |
| Matcher ↔ T2 Qualität | YouTube Music liefert ohne Premium nur Opus ~130 kbps | Ehrliche Qualitätsanzeige pro Titel (Bitrate, Codec, Quelle); mit YouTube-Premium-Cookies 256 kbps AAC; für „exakt“ auf Recorder umschalten (ein Klick pro Titel) |
| Matcher ↔ F7 Tags | YouTube-Metadaten sind schlecht | Tags kommen **immer** aus der Original-Playlist (Apple/Spotify), nie von YouTube. Cover in Originalauflösung aus dem Katalog |
| F9 Warteschlange ↔ T3 Rate-Limits | YouTube drosselt bei vielen parallelen Downloads | Max. 3 parallel, kleine Pausen, exponentielles Warten bei 429; Playlist-Lesen und Matching laufen voraus, Downloads hinterher |
| F5 Namensschema ↔ Windows | 260-Zeichen-Grenze, verbotene Zeichen `\ / : * ? " < > |`, Unicode-Varianten | Zentraler Sanitizer, Längen-Kürzung mit Priorität (Titel vor Artist), Vorschau des Dateinamens live in der Oberfläche |
| F13 „mehrere Accounts“ ↔ „kein Login im Tool“ | Private Playlists sind ohne Login nicht lesbar | Apple Music: Playlist in der App auf „Teilen“ stellen, Link einfügen (der Katalog ist dann öffentlich lesbar). Spotify: dito für öffentliche Playlists; für private Playlists einmalige OAuth-Anmeldung im Browser (optional, nicht im Hauptweg) |
| T4 Dubletten ↔ mehrere Playlists | Derselbe Titel in 5 Playlists = 5 Downloads | ISRC-Katalog in SQLite; zweites Vorkommen wird als Hardlink/Kopie aus der ersten Datei erzeugt, nicht erneut geladen |

---

## 5. Probleme, die ich sehe, und Lösungen

| Nr | Problem | Schwere | Lösung |
|----|---------|---------|--------|
| P1 | **yt-dlp bricht regelmäßig**, YouTube ändert alle paar Wochen etwas | hoch | yt-dlp als eigenständiges Modul, Auto-Update beim Start (wöchentlich), Button „Downloader aktualisieren“, Fehlermeldung „Downloader veraltet“ statt kryptischem Stacktrace |
| P2 | YouTube „Bestätige, dass du kein Bot bist“ | mittel | Zuhause mit normaler IP selten. Lösung: Cookies aus dem Browser nutzen. **Achtung:** Chrome/Edge verschlüsseln Cookies seit 2024 app-gebunden, yt-dlp kommt dort nicht mehr dran. Firefox-Cookies funktionieren, oder Export per Erweiterung „Get cookies.txt LOCALLY“. Tool bietet beides an und erklärt es in einem Satz |
| P3 | Apple-Music-Webseite ändert ihr Format | mittel | Zwei Leseverfahren: (1) serialisierte Daten der öffentlichen Playlist-Seite, (2) Katalog-API mit dem öffentlichen Web-Player-Token. Beide austauschbar, Tests mit gespeicherten Beispielseiten |
| P4 | Spotify hat den API-Zugang für neue Apps seit Ende 2024 eingeschränkt | mittel | Öffentliche Playlists über die Web-API mit eigener Client-ID (einmalig anlegen, Tool führt durch). Alternativ Playlist per „Export“ in Apple Music/Spotify-Konverter (TuneMyMusic, Soundiiz) als CSV einlesen: **CSV/M3U-Import** als dritter Quellenweg |
| P5 | Falsche Treffer beim Matching (Cover-Version, Live, Karaoke, Sped-up) | hoch für UX | Score aus Titel, Artist, Album, **Dauer ±3 s**, Kanal „Topic“/„Official“, Negativ-Wörter (karaoke, cover, live, nightcore, sped up). Unter 85 % Score: Titel wird gelb markiert und in der Match-Prüfung gezeigt (siehe N3) |
| P6 | Antivirus-Fehlalarme bei PyInstaller-EXEs | mittel | onedir statt onefile (weniger Fehlalarme), Build reproduzierbar, SHA-256 veröffentlicht, Hinweis in README |
| P7 | Port 8000 o. ä. belegt | niedrig | freien Port automatisch wählen, Browser mit der richtigen URL öffnen, URL im Tray kopierbar |
| P8 | Lokale API von fremden Webseiten angreifbar (DNS-Rebinding, CSRF) | hoch | siehe Querverweis T5: Token, Host-Prüfung, nur 127.0.0.1 |
| P9 | Browser-Tab zu, Nutzer glaubt, das Tool ist aus | niedrig | Tray-Symbol mit Fortschritt im Tooltip, Windows-Benachrichtigung bei Fertigstellung, Klick öffnet Oberfläche wieder |
| P10 | Playlist mit 1 000 Titeln, Abbruch bei Titel 612 | mittel | Jeder Titel hat Zustand in SQLite; Neustart setzt bei 612 fort; fertige Dateien werden per Hash geprüft, nicht neu geladen |
| P11 | Recorder: Apple Music Web pausiert in Hintergrund-Tabs oder bei Bildschirmsperre | mittel | Tool hält den Rechner wach, empfiehlt eigenes Browserfenster, erkennt Pause über Media-Session und pausiert die Aufnahme synchron (keine Stille-Dateien) |
| P12 | Recorder: Werbung oder Sprach-Intros bei manchen Diensten | niedrig | nur bezahlte Accounts sind Ziel; Stille-/Dauer-Abgleich erkennt Fremdmaterial, markiert den Titel |
| P13 | Titel ist im Dienst „ausgegraut“ (nicht mehr verfügbar) | niedrig | Matcher findet ihn trotzdem oft bei YouTube; sonst klarer Status „bei <Dienst> nicht mehr verfügbar“ statt Fehler |
| P14 | Gleicher Titel, andere Fassung (Remaster 2011 vs. 1987) | mittel | ISRC-Vergleich, Dauer-Abgleich, Album-Name im Score; Nutzer kann Fassung in der Match-Prüfung tauschen |
| P15 | Nutzer wählt Format MP3 und bekommt Opus → MP3 doppelt verlustbehaftet | niedrig | Qualitätsanzeige „umkodiert aus Opus 130 kbps“ und Standard auf „Original behalten“ |

---

## 6. UX-Konzept und Design-Regeln

### 6.1 Der Hauptweg (so soll sich 90 % der Nutzung anfühlen)

1. Strg+V irgendwo im Fenster. Link wird erkannt (Dienst, Typ: Titel / Album /
   Playlist), die Titel erscheinen sofort als Liste mit Cover, Dauer, Match-Status.
2. Zielordner steht schon da (letzter Ordner). Format steht schon da.
3. Enter oder „Sichern“. Fortschritt läuft in derselben Liste, kein Wechsel der
   Ansicht. Fertig: Benachrichtigung, Button „Ordner öffnen“.

Keine Anmeldung, kein Assistent, kein „Willkommen“.

### 6.2 Aufbau (ein Fenster, drei Zonen)

```
┌──────────────────────────────────────────────────────────────────────┐
│ [ Link einfügen oder hierher ziehen …          ] [Ordner ▾] [Format ▾] [Sichern] │  ← Eingabeleiste
├──────────────┬───────────────────────────────────────────────────────┤
│ Aufträge     │  Playlist „Sommer 2026“ · 48 Titel · 3:12 h · ~2 min  │
│ ● Sommer 26  │  ──────────────────────────────────────────────────── │
│ ○ Album X    │  #  Cover  Titel / Artist        Dauer  Qualität  Status │
│ ○ Einzel …   │  1  ▣      Song A / Artist      3:41   AAC 256   ✓     │
│              │  2  ▣      Song B / Artist      4:02   Opus 130  ▮▮▮░ 68 % │
│ Verlauf      │  3  ▣      Song C / Artist      2:58   –         ? Prüfen │
│ Einstellungen│  …                                                     │
├──────────────┴───────────────────────────────────────────────────────┤
│ 12 von 48 · 2 parallel · 4,1 MB/s · Noch ~1 min        [Pause] [Abbrechen] │  ← Statusleiste
└──────────────────────────────────────────────────────────────────────┘
```

- Linke Spalte ist einklappbar; bei einem einzigen Auftrag ist sie zu.
- „Mehr“ unter der Eingabeleiste klappt die Profi-Optionen auf: Namensschema
  mit Live-Vorschau, Engine (Matcher / Recorder / automatisch), Parallelität,
  Cookies, Loudness.
- Die Tabelle ist eine echte Tabelle: sortierbar, Mehrfachauswahl, Rechtsklick
  (Erneut laden, Als Recorder laden, Datei zeigen, Match ändern).

### 6.3 Design-Regeln („kein KI-Look“)

Verboten:
- Farbverläufe, Glow, Glassmorphism, „Hero“-Bereiche, zentrierte Marketing-Texte
- Lila/Violett als Akzent, Regenbogen-Icons, Emojis als Icons
- Riesige abgerundete Karten mit 24 px Innenabstand, 3-Spalten-Feature-Grids
- Modale Dialoge für Dinge, die inline gehen; Toast-Fluten
- Platzhalter-Sprache („Supercharge your music“)

Stattdessen:
- Neutrales Dunkelgrau, kein reines Schwarz: Hintergrund `#141517`, Flächen
  `#1c1e21`, Linien `#2a2d31`, Text `#e8e8e8`, Sekundärtext `#9a9fa6`
- **Ein** Akzent (Bernstein `#e8a33d` für Aktion und Fortschritt), Grün nur für
  „fertig“, Rot nur für Fehler, Gelb nur für „prüfen“
- Schrift: Segoe UI Variable (Windows-nativ), Fallback Inter, 13 px Grundgröße,
  Tabellenziffern für Zeiten und Größen
- Radius max. 6 px, 1-px-Linien, Dichte wie ein gutes Desktop-Programm
- Icons: Lucide, einfarbig, 16 px, immer mit Tooltip
- Jede Aktion gibt sofort Rückmeldung in der Zeile, in der sie passiert
- Tastatur komplett bedienbar, sichtbarer Fokus
- Lesbare Fehler: „YouTube hat die Verbindung gedrosselt. Warte 30 s, dann
  Versuch 2 von 3.“ statt `HTTPError 429`

---

## 7. Neue Funktionen (meine Vorschläge)

| Nr | Funktion | Nutzen | Aufwand | Prio |
|----|----------|--------|---------|------|
| N1 | **Zwischenablage-Wächter**: Tool erkennt kopierte Musik-Links und zeigt in der Oberfläche „Sommer 2026 (48 Titel) hinzufügen?“ | Kein Einfügen nötig, ein Klick | klein | S |
| N2 | **Playlist-Abo (Sync)**: Playlist wird dauerhaft mit einem Ordner synchron gehalten. Neue Titel kommen automatisch dazu (Prüfung täglich oder beim Start), entfernte Titel wandern in `_entfernt/` statt gelöscht zu werden | Deine Sicherung bleibt aktuell, ohne dass du dran denkst | mittel | S |
| N3 | **Match-Prüfung mit Konfidenz**: Unsichere Treffer in einer Ansicht: links Original (Apple), rechts 3 Kandidaten mit 10-s-Vorhören, Dauer-Differenz, Kanal. Ein Klick tauscht, ein Klick „als Recorder laden“ | Verhindert falsche Fassungen, der größte Qualitätskiller beim Matching | mittel | M |
| N4 | **Katalog & Dubletten-Schutz über ISRC**: Jeder gesicherte Titel landet mit ISRC, Hash und Pfad in SQLite. Taucht er in einer zweiten Playlist auf, wird nur verknüpft/kopiert, nicht neu geladen | Spart Zeit und Traffic, verhindert 5 Versionen desselben Songs | klein | S |
| N5 | **Recorder-Engine** (Abschnitt 2, Weg D) mit automatischer Titeltrennung und Stille-Modus | Exakte Kopien, unabhängig davon, ob YouTube etwas hat | groß | S |
| N6 | **Liedtexte & Cover-Vollausstattung**: Synchronisierte Liedtexte (LRCLIB, frei) als `.lrc` daneben und eingebettet, Cover in 3000 px, Album-Artist, Disc-Nummer, Jahr, Genre | Dateien sehen in jedem Player so aus wie im Dienst | klein | S |
| N7 | **Playlist-Export**: pro Auftrag `.m3u8` (relative Pfade) und `playlist.json/csv` mit allen Metadaten | Direkt in VLC, foobar2000, Autoradio, Plex nutzbar; Re-Import in andere Dienste | klein | M |
| N8 | **Bibliotheks-Check**: Zielordner scannen, defekte/zu kurze Dateien, fehlende Tags, fehlende Cover finden und mit einem Klick reparieren | Alte Sicherungen bleiben brauchbar | mittel | K |
| N9 | **„Was ist verschwunden?“**: Beim Sync erkennen, welche Titel im Dienst nicht mehr verfügbar sind, und sie markieren: deine lokale Datei ist jetzt die einzige | Genau der Fall, für den man sichert | klein (mit N2) | S |
| N10 | **CSV/M3U-Import** als Quelle: Playlist-Exporte aus TuneMyMusic, Soundiiz, Exportify oder eine Textliste „Artist – Titel“ pro Zeile | Funktioniert auch, wenn ein Dienst seine API dichtmacht | klein | S |
| N11 | **Loudness-Angleichung** (optional, ReplayGain-Tags statt Umkodieren) | Playlist klingt gleichmäßig, Datei bleibt original | klein | K |
| N12 | **Nachtmodus für den Recorder**: Playlist starten, Rechner wach halten, Monitor aus, am Ende Benachrichtigung und automatisches Stummschalten | Lange Aufnahmen ohne Babysitting | klein (mit N5) | S |

---

## 8. Vorhandene Werkzeuge: nutzen oder nicht

| Werkzeug | Rolle | Entscheidung |
|----------|-------|--------------|
| yt-dlp | Download von YouTube Music / YouTube / SoundCloud / Bandcamp | **nutzen**, als Modul mit Auto-Update |
| ffmpeg | Konvertieren, Schneiden, Loudness | **nutzen**, statischer Build mitliefern |
| ytmusicapi | YouTube-Music-Suche mit Dauer/Album | **nutzen** |
| mutagen | Tags, Cover | **nutzen** |
| spotDL | Spotify → YouTube Komplettlösung | **nicht einbetten**, aber als Referenz für den Matcher; eigene Umsetzung, damit Tags aus Apple kommen und die Oberfläche passt |
| gamdl, votify, zotify, streamrip, tidal-dl | Direkt-Download mit DRM-Entschlüsselung | **nicht nutzen** (R1) |
| Audials u. ä. (kommerzielle Recorder) | Mitschnitt | **nicht nutzen**, eigener Recorder ist 300 Zeilen und ohne Lizenzkosten |
| JDownloader, Free Download Manager | Generische Downloader | **nicht nötig**, yt-dlp deckt es ab; Export der Links als Option wäre denkbar |

---

## 9. Vorschlag für die Reihenfolge

| Phase | Inhalt | Ergebnis |
|-------|--------|----------|
| 0.1 | Backend-Gerüst, Tray, Browser-Start, Sicherheit (P8), Ordnerdialog, Settings | leere, aber laufende App als EXE |
| 0.2 | Quelle Apple Music (öffentliche Playlist/Album/Titel), Quelle YouTube Music, Matcher, yt-dlp-Download, Tags+Cover, Warteschlange, Fortschritt | **erster brauchbarer Stand**: Link rein, Dateien raus |
| 0.3 | Match-Prüfung (N3), Katalog/Dubletten (N4), M3U-Export (N7), Verlauf, Wiederaufnahme (P10), Auto-Update yt-dlp | alltagstauglich |
| 0.4 | Spotify-Quelle, CSV-Import (N10), Zwischenablage-Wächter (N1), Liedtexte (N6) | mehrere Dienste |
| 0.5 | Recorder-Engine (N5) mit Stille-Modus, Titeltrennung, Nachtmodus (N12) | exakte Kopien |
| 1.0 | Playlist-Abo (N2), „Verschwunden“ (N9), Installer, Englisch, Feinschliff | Release |

Phase 0.2 ist der Punkt, an dem du das Tool zum ersten Mal wirklich benutzt.

---

## 10. Annahmen, unter denen ich weiterarbeite (sag Bescheid, wenn etwas anders ist)

1. **Dienste:** Apple Music zuerst, dann YouTube Music und Spotify. Tidal/Deezer/Amazon
   später als Adapter.
2. **Standardformat:** „Original behalten“ (M4A/AAC oder Opus, keine Umkodierung),
   MP3 320 als Ein-Klick-Alternative für Autoradio und alte Geräte.
3. **Recorder** ist dir als Fallback willkommen, obwohl er in Echtzeit läuft.
4. **Verteilung:** portable ZIP zuerst, Installer später.
5. **Sprache:** Oberfläche Deutsch, Englisch vorbereitet.
6. **Kein Login im Tool:** Private Playlists werden per „Teilen“-Link geholt;
   Spotify-OAuth nur optional.
