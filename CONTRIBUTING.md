# Mitwirken

Beiträge sind willkommen. Für die lokale Entwicklung werden Node.js 24 und npm benötigt.

```bash
npm ci
npm run dev
```

Vor einem Pull Request müssen mindestens diese Prüfungen erfolgreich sein:

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

Die Anwendung verwendet Next.js, SQLite und Drizzle ORM. Lokale Daten liegen unter `data/` und dürfen nicht committet werden.

Die Git-Hooks lassen sich einmalig mit folgendem Befehl aktivieren:

```bash
git config core.hooksPath .githooks
```

Danach erhöht jeder Commit die Patch-Version und ergänzt den Changelog. Andere Versionssprünge werden ausdrücklich über `VERSION_BUMP=minor`, `VERSION_BUMP=major` oder eine konkrete semantische Version gesteuert.
