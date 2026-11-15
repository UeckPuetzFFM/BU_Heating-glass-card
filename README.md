# Glass Entity Grid

Eigenständige Lovelace-Karte im Frosted-Glass-Stil mit visuellem Dialog-Editor.

## Installation über HACS
1. Dieses Repository als benutzerdefiniertes Repository in HACS (Kategorie: Dashboard) hinzufügen.
2. **Glass Entity Grid** installieren.
3. Home Assistant neu laden und die Ressource `/hacsfiles/glass-entity-grid/glass-entity-grid.js` als JavaScript-Modul einbinden, falls HACS sie nicht automatisch registriert.
4. Im Dashboard eine Karte hinzufügen und **Glass Entity Grid** auswählen.

## Konfiguration
Die Karte kann vollständig über den visuellen Editor konfiguriert werden: Layout, Glas-Design, Farben, Schatten, Typografie und Geräte. Die Live-Vorschau zeigt eine beispielhafte Darstellung.

### YAML-Beispiel
```yaml
type: custom:glass-entity-grid
columns: 3
height: 52
radius: 18
gap: 10
entities:
  - entity: light.wohnzimmer_lampe
    name: Stehlampe
    icon: mdi:floor-lamp
```

## Hinweise
- Die Karte verwendet native Home-Assistant-Frontend-Komponenten (`ha-icon`, `ha-entity-picker`).
- Tippen schaltet unterstützte Domains um; Gedrückthalten öffnet „Mehr Informationen“.
- Vor produktivem Einsatz bitte in einer Testansicht deiner Home-Assistant-Installation prüfen.
