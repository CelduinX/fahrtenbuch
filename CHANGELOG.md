# Changelog

## 1.0.9 – 2026-09-29

- Fahrten erhalten eine fortlaufende, chronologische Nummer über alle Monate hinweg. Nachträge, Änderungen, Löschungen und Importe aktualisieren die Nummerierung automatisch.
- Spalten können über ein Dropdown mit Checkboxen in der Monatsauswahl ausgewählt werden. Übersicht und Druck haben unabhängig voneinander gespeicherte, globale Einstellungen.
- Einheitliche Spaltenreihenfolge, besser lesbare zweizeilige Überschriften und angepasste Spaltenbreiten. Desktop-Tabellen behalten ihre Schriftgröße und können bei Bedarf horizontal gescrollt werden.
- Seiteninhalte nutzen bis zu 1600 Pixel Breite; die Loginseite nutzt die volle Fensterbreite. Dashboard-Cards und Abstände wurden optimiert.
- Die Druckvorschau zeigt feste A4-Seiten im Querformat mit wiederholten Tabellenüberschriften, kompakten Kopf- und Fußbereichen und Seitenzahlen. Lange Texte werden auf Folgeseiten fortgesetzt.
- Das amtliche KFZ-Kennzeichen kann unter Einstellungen → Reisewege gespeichert werden und erscheint im Druck unter dem Erstelldatum.
- CSV-Exporte enthalten alle Datenspalten einschließlich laufender Nummer, ausgeschriebener Orte und Abrechnungswerte. Alte CSV-Formate bleiben importierbar; importierte Nummern werden neu berechnet.
- Datenbankmigration und Backup-Wiederherstellung berücksichtigen die neuen Einstellungen. Ältere Backups erhalten alle sichtbaren Spalten als Standard.
- Docker-Images werden ausschließlich für `linux/amd64` veröffentlicht; ARM-Builds und QEMU entfallen.
