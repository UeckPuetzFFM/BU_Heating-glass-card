# Heating Glass Card

Custom Lovelace-Karte für Home Assistant – vorkonfiguriert für `climate.hk_flur`.

## Installation
1. Lege `heating-glass-card.js` unter `/config/www/` ab.
2. Füge unter **Einstellungen → Dashboards → Ressourcen** eine Ressource hinzu:
   - URL: `/local/heating-glass-card.js`
   - Typ: JavaScript-Modul
3. Füge die Karte in einem Dashboard über **Manuell** hinzu:

```yaml
type: custom:heating-glass-card
entity: climate.hk_flur
name: Heizung Flur
```

## Optionale Sensoren
Die Karte liest Raumtemperatur aus `current_temperature`, den Modus aus dem Climate-Zustand und den Heizstatus aus `hvac_action`.
Batterie und Luftfeuchtigkeit werden zuerst aus Attributen der Climate-Entität gelesen (`battery`, `battery_level`, `battery_percentage`, `current_humidity`, `humidity`).
Wenn diese Werte als separate Sensoren vorhanden sind, kannst du sie explizit zuordnen:

```yaml
type: custom:heating-glass-card
entity: climate.hk_flur
name: Heizung Flur
battery_entity: sensor.hk_flur_battery
humidity_entity: sensor.hk_flur_humidity
min_height: 210
```

Die Temperaturgrenzen und der Schritt werden automatisch aus `min_temp`, `max_temp` und `target_temp_step` der Climate-Entität übernommen. Fallbacks sind 5–30 °C und 0,5 °C.

## Thermostat-Animation
Die Karte zeigt ein rundes Glas-Wandthermostat mit digitalem Display und umlaufendem Einstellring. Bei einer Änderung der Solltemperatur dreht sich der Ring kurz und das Display pulsiert. Wenn `hvac_action` den Wert `heating` meldet, bewegen sich zusätzlich dezente Wärmewellen über dem Thermostat. Bewegungen werden bei aktivierter Betriebssystem-Einstellung „Bewegung reduzieren“ abgeschaltet.

## Hinweise
- Temperaturänderungen rufen `climate.set_temperature` auf.
- Modus-Schaltflächen werden anhand der von der Entität gemeldeten `hvac_modes` erzeugt und rufen `climate.set_hvac_mode` auf.
- Falls Batterie oder Luftfeuchtigkeit nicht als Attribut an der Climate-Entität hängen, trage die tatsächlichen Sensor-Entity-IDs in `battery_entity` bzw. `humidity_entity` ein.


## Visueller Editor (Version 1.3)
Die Karte stellt im Lovelace-Karteneditor einen visuellen Konfigurationseditor über `ha-form` bereit. Dort kannst du die Climate-Entität, den Namen, optionale Batterie- und Feuchtigkeitssensoren, die Kartenhöhe und die Sichtbarkeit der einzelnen Informationsfelder auswählen. Die Sensorfelder verwenden die Home-Assistant-Entity-Auswahl.


## Version 1.4 – 3D-Thermostatkopf
Die runde Thermostatdarstellung wurde durch einen CSS-gezeichneten, räumlich wirkenden Heizkörper-Thermostatkopf ersetzt: metallischer Anschluss, weiß-silbernes Gehäuse, digitales Sollwertdisplay und geriffelter Einstellring. Bei Sollwertänderungen dreht sich der Einstellring; bei aktivem Heizstatus erscheinen Wärmewellen. Der visuelle HA-Editor aus V1.3 bleibt enthalten.


## Version 1.5 – tado°-inspirierte 3D-Darstellung
Der 3D-Thermostatkopf orientiert sich nun an der Formensprache eines tado° Heizkörper-Thermostats: mattweißes zylindrisches Gehäuse, silberner geriffelter Einstellring und dezente LED-Punktanzeige. Die Solltemperatur wird dynamisch angezeigt. Bei Sollwertänderungen bewegt sich der Einstellring; im Heizbetrieb erscheinen dezente Wärmewellen. Die Darstellung ist eine eigenständige CSS-Illustration und verwendet keine Produktbilder oder tado°-Software. Der visuelle Home-Assistant-Editor aus V1.3 bleibt erhalten.


## Version 2.0 – Premium-3D-Ansicht
Die Thermostatillustration wurde grundlegend überarbeitet und liegt jetzt horizontal wie ein Heizkörperthermostat: länglicher weißer Zylinder, gerippter Metalladapter, metallischer Einstellkragen und rundes schwarzes Display. Das Display zeigt Solltemperatur und – sofern vorhanden – die aktuelle Raumtemperatur. Im Heizbetrieb wird der Displayrand orange hervorgehoben und ein warmer Lichtschein mit animierten Wärmewellen eingeblendet. Temperatursteuerung, Sensoranzeigen und der visuelle Editor bleiben erhalten.


## Version 2.0.1 – Fehlerkorrektur
Behebt einen nicht definierten Variablennamen in der 3D-Temperaturanzeige, der beim Rendern einen JavaScript-Fehler ausgelöst und dadurch die Kartenansicht verhindert hat. Außerdem ist das Anlegen des Shadow DOMs gegen wiederholte `setConfig`-Aufrufe abgesichert.
