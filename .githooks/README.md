# Versions-Hook

Der `post-commit`-Hook erhöht nach jedem Commit standardmäßig die Patch-Version (`+0.0.1`), aktualisiert `package.json`, `package-lock.json` und `lib/changelog.json` und nimmt diese Änderungen automatisch in denselben Commit auf.

Für einen ausdrücklich gewünschten Sprung kann beim Commit `VERSION_BUMP=minor`, `VERSION_BUMP=major` oder eine konkrete semantische Version wie `VERSION_BUMP=2.0.0` gesetzt werden.

Einmalig pro Arbeitskopie aktivieren:

```bash
git config core.hooksPath .githooks
```

Unter Linux und macOS muss die Hook-Datei außerdem ausführbar sein:

```bash
chmod +x .githooks/post-commit
```
