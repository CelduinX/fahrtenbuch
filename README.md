<p align="center">
  <img src="public/brand/logo.png" alt="Fahrtenbuch" width="160">
</p>

# Fahrtenbuch

Eine selbst gehostete Web-Anwendung zur übersichtlichen Erfassung, Auswertung und Sicherung von Dienstfahrten. Alle Daten bleiben in deiner eigenen Docker-Umgebung.

## Funktionen

- Fahrten und wiederkehrende Reisewege verwalten
- Kilometer, abrechenbare Strecken und Erstattungen auswerten
- Monatsansicht drucken oder als PDF speichern
- Fahrten als CSV importieren und exportieren
- automatische sowie manuelle SQLite-Sicherungen
- optionaler Zwei-Faktor-Login mit Authenticator-App und Backup-Codes
- optimierte Darstellung für Desktop, Tablet und Smartphone

## Installation mit Docker

Benötigt werden Docker Engine beziehungsweise Docker Desktop sowie Docker Compose. Für den Betrieb reicht eine einzige Datei.

### 1. Compose-Datei herunterladen

Linux und macOS:

```bash
curl -O https://raw.githubusercontent.com/CelduinX/fahrtenbuch/main/docker-compose.yaml
```

Windows PowerShell:

```powershell
Invoke-WebRequest https://raw.githubusercontent.com/CelduinX/fahrtenbuch/main/docker-compose.yaml -OutFile docker-compose.yaml
```

Alternativ kann die Datei aus dem neuesten [GitHub-Release](https://github.com/CelduinX/fahrtenbuch/releases/latest) heruntergeladen werden.

### 2. Anwendung starten

```bash
docker compose up -d
```

Das Fahrtenbuch ist anschließend unter [http://localhost:3000](http://localhost:3000) erreichbar.

### 3. Erster Login

- Benutzername: `admin`
- Passwort: `admin`

Ändere diese Zugangsdaten direkt nach dem ersten Login unter **Einstellungen → Zugang**, besonders bevor du die Anwendung über das Internet erreichbar machst. Dort kann zusätzlich die Zwei-Faktor-Authentifizierung eingerichtet werden.

## Aktualisieren

```bash
docker compose pull
docker compose up -d
```

Die Daten bleiben dabei im Docker-Volume erhalten. Vor einem Update empfiehlt sich trotzdem eine manuelle Sicherung unter **Einstellungen → Sicherungen**.

## Betrieb und Fehlerdiagnose

Status anzeigen:

```bash
docker compose ps
```

Protokoll anzeigen:

```bash
docker compose logs -f fahrtenbuch
```

Anwendung neu starten:

```bash
docker compose restart fahrtenbuch
```

## Daten und Sicherungen

Die Datenbank und alle Sicherungen liegen dauerhaft im Named Volume `fahrtenbuch-data`. Ein normaler Container-Neustart oder ein Image-Update löscht diese Daten nicht.

- Automatische und manuelle Sicherungen werden unter **Einstellungen → Sicherungen** verwaltet.
- Vor einer Wiederherstellung legt die Anwendung eine zusätzliche Sicherheitskopie an.
- CSV-Exporte sind kein vollständiger Ersatz für eine Datenbanksicherung.

Wenn weder Authenticator-App noch Backup-Code verfügbar sind, kann 2FA auf dem Docker-Host zurückgesetzt werden:

```bash
docker compose exec fahrtenbuch node scripts/disable-two-factor.mjs --confirm DISABLE-2FA
```

Dabei werden alle aktiven Sitzungen abgemeldet.

## Beenden oder deinstallieren

Container beenden, Daten behalten:

```bash
docker compose down
```

Container und alle gespeicherten Daten endgültig löschen:

```bash
docker compose down -v
```

Der zweite Befehl löscht das Fahrtenbuch-Volume unwiderruflich. Er sollte nur nach einer geprüften Sicherung verwendet werden.

## Zugriff über das Internet

Für öffentlichen Zugriff sollte ein Reverse Proxy mit HTTPS, beispielsweise Caddy, Traefik oder Nginx Proxy Manager, vor die Anwendung geschaltet werden. Veröffentliche Port 3000 nicht ungeschützt im Internet und ändere vorher unbedingt die Standard-Zugangsdaten.

## Unterstützte Systeme und Versionen

Das Container-Image unterstützt `linux/amd64` und `linux/arm64`.

- `latest`: aktuellste stabile Version
- `1.0.0`: exakt festgelegte Version
- `1.0`: jeweils neueste Version innerhalb dieser Minor-Version

Images werden über `ghcr.io/celduinx/fahrtenbuch` bereitgestellt.

## Hilfe und Sicherheit

Allgemeine Fehler oder Wünsche können als [GitHub-Issue](https://github.com/CelduinX/fahrtenbuch/issues) gemeldet werden. Sicherheitslücken bitte ausschließlich über eine private Sicherheitsmeldung im Bereich **Security** einreichen.

## Lizenz

Dieses Projekt steht unter der [MIT-Lizenz](LICENSE).

© 2026 IT-Michael.NET
