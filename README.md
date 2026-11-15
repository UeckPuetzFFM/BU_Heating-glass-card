# Heating Glass Card

Home Assistant Lovelace-Karte für eine Heizungssteuerung mit horizontaler Thermostatdarstellung.

## Version 2.4.2
- Kartengröße konfigurierbar, Standard 50 %
- Glass-Effekt ein-/ausschaltbar
- Transparenz und Unschärfe einstellbar
- Temperatursteuerung, Heizstatus und Sensorfelder
- Visueller Home-Assistant-Konfigurationseditor

## Installation
HACS Custom Repository: `https://github.com/UeckPuetzFFM/BU_Heating-glass-card`
Kategorie: Dashboard


Version 2.4.2: Kartengröße wird layoutwirksam angewendet. Glass-Transparenz und Unschärfe werden direkt aus den Editor-Einstellungen übernommen; bei deaktiviertem Glass-Effekt wird Unschärfe ausgeschaltet.


## Version 2.4.2
- Optimiert für zwei Karten nebeneinander in einem Home-Assistant-Abschnitt.
- Füllt die zugewiesene Spaltenbreite; responsive Anpassung anhand der Kartenbreite.
- Kompaktere Thermostatdarstellung und zweireihige Informationskacheln.
- Standard-Kartengröße 100 %; Größenoption bleibt erhalten.
- Glass-Einstellungen bleiben verfügbar.


## Version 2.4.2
- Behebt die fehlerhafte Höhen-/Scrollberechnung in Home-Assistant-Abschnitten.
- Keine CSS-Transform-Skalierung und keine negativen Ausgleichsmargen mehr.
- Kartengröße wird über die tatsächliche Kartenbreite umgesetzt; die natürliche Inhaltshöhe bleibt erhalten.
- Vertikaler Inhalt wird nicht mehr durch die Karte abgeschnitten.


## Version 2.4.2
- Behebt das wiederholte vollständige Rendern bei jedem Home-Assistant-Update.
- Die Karte rendert nur neu, wenn sich Klima-, Batterie- oder Luftfeuchtewerte ändern.
- Verhindert dadurch unnötige DOM-Ersetzungen und reduziert das Zurückspringen der Dashboard-Scrollposition.


## Version 2.4.2
- Entfernt die große CSS-Thermostatillustration.
- Die digitale Solltemperatur steht im Mittelpunkt zwischen Minus- und Plus-Taste.
- Der Temperaturregler, Sensor-Kacheln, Heizstatus und Betriebsarten bleiben erhalten.
- Kompaktere Kartenhöhe, damit zwei Karten besser nebeneinander in einen Abschnitt passen.


## Version 2.4.2
- Alle Bedienelemente, Texte, Icons und Abstände passen sich proportional an die Kartenbreite an.
- Container Queries verwenden die tatsächliche Breite der Karte statt der Viewport-Breite.
- Feste Mindesthöhe und übergroße Innenabstände wurden entfernt.
- Slider, Temperaturanzeige und Modus-Schaltflächen bleiben innerhalb der Kartenbegrenzung.
- Fehlerhafte Header-Verschachtelung wurde korrigiert.


## Version 2.4.2
- Korrigiert einen fehlenden schließenden Container im Kartenkopf, durch den alle Steuerelemente fälschlich in einer einzigen Flex-Zeile lagen.
- Temperatursteuerung, Slider, Sensorfelder und Modus-Schaltflächen stehen wieder in getrennten vertikalen Bereichen.


## Version 2.4.2
- Neues rauchiges, grau-braunes Glass-Design nach der vom Nutzer bereitgestellten Referenz.
- Abgerundeter Glaskörper mit feinem silbernem Rand und innerem Glanz.
- Thermometer-Icon und Heizungsname links, Status-Pill rechts.
- Digitale Solltemperatur mit runden Minus-/Plus-Tasten.
- Slider, kompakte Sensorfelder und pillenförmige Betriebsarten-Schaltflächen.
- Responsive Anpassung über Container Queries; keine feste Kartenhöhe.
- Heizungsfunktionen und Glass-Konfiguration bleiben erhalten.


## Version 2.4.2
- Entfernt den seitlichen Leerraum: Die Karte füllt jetzt die gesamte von Home Assistant zugewiesene Spalten-/Abschnittsbreite aus.
- Die bisherige card_scale-Breite wird nicht mehr auf den äußeren Kartencontainer angewendet.


## Version 2.4.2
- Behebt den Fokusverlust im Feld „Anzeigename“.
- Der Editor und das ha-form werden bei nachfolgenden setConfig-Aufrufen nicht mehr neu aufgebaut.
- Dadurch bleiben Cursorposition und Eingabefokus beim Tippen erhalten.
- Kartenlayout und Glass-Design aus v2.4.1 bleiben unverändert.
