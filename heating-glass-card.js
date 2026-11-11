/* Heating Glass Card v2.0.2 - current temperature reference fix */
/* Heating Glass Card for Home Assistant
 * Custom Lovelace card. No external dependencies.
 */
class HeatingGlassCard extends HTMLElement {
  static getStubConfig() {
    return { type: "custom:heating-glass-card", entity: "climate.hk_flur", name: "Heizung Flur", min_height: 180 };
  }

  setConfig(config) {
    if (!config || !config.entity) throw new Error("Heating Glass Card: Bitte eine climate-Entität angeben.");
    this.config = {
      name: "Heizung",
      min_temp: 5,
      max_temp: 30,
      step: 0.5,
      show_current_temperature: true,
      show_hvac_mode: true,
      show_hvac_action: true,
      show_battery: true,
      show_humidity: true,
      min_height: 180,
      ...config
    };
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this.shadowRoot && this.config) this._render();
  }

  getCardSize() { return 3; }

  _entity(id) { return id ? this._hass?.states?.[id] : undefined; }
  _num(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  _fmt(value) {
    const n = this._num(value);
    return n === null ? "—" : `${Number.isInteger(n) ? n : n.toFixed(1).replace(".", ",")} °C`;
  }
  _esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  }
  _attribute(entity, keys) {
    if (!entity) return null;
    for (const key of keys) {
      const value = entity.attributes?.[key];
      if (value !== undefined && value !== null && value !== "") return value;
    }
    return null;
  }
  _render() {
    if (!this.shadowRoot || !this.config) return;
    const c = this.config;
    const entity = this._entity(c.entity);
    if (!entity) {
      this.shadowRoot.innerHTML = `<ha-card><div class="missing">Entität nicht gefunden: ${this._esc(c.entity)}</div></ha-card>`;
      return;
    }

    const a = entity.attributes || {};
    const target = this._num(a.temperature);
    const current = this._num(a.current_temperature);
    const min = this._num(a.min_temp) ?? this._num(c.min_temp) ?? 5;
    const max = this._num(a.max_temp) ?? this._num(c.max_temp) ?? 30;
    const step = this._num(a.target_temp_step) ?? this._num(c.step) ?? 0.5;
    const value = target ?? min;
    const targetChanged = this._lastTarget !== undefined && target !== null && this._lastTarget !== target;
    this._lastTarget = target;
    const pct = Math.max(0, Math.min(100, ((value - min) / (max - min || 1)) * 100));
    const modes = Array.isArray(a.hvac_modes) ? a.hvac_modes : [];
    const mode = entity.state;
    const action = this._attribute(entity, ["hvac_action"]) || "—";
    const modeLabels = { heat:"Heizen", auto:"Automatik", off:"Aus", cool:"Kühlen", heat_cool:"Heizen/Kühlen", dry:"Entfeuchten", fan_only:"Nur Lüfter" };
    const actionLabels = { heating:"Heizt", idle:"Bereitschaft", cooling:"Kühlt", off:"Aus", drying:"Entfeuchtet", fan:"Lüfter" };
    const batteryEntity = this._entity(c.battery_entity);
    const humidityEntity = this._entity(c.humidity_entity);
    const battery = batteryEntity?.state ?? this._attribute(entity, ["battery", "battery_level", "battery_percentage"]);
    const humidity = humidityEntity?.state ?? this._attribute(entity, ["current_humidity", "humidity"]);
    const batteryText = battery === null || battery === undefined ? "—" : `${battery}%`;
    const humidityText = humidity === null || humidity === undefined ? "—" : `${humidity}%`;
    const fmtTemp = v => v === null ? "—" : `${String(v).replace(".", ",")} °C`;
    const name = c.name || a.friendly_name || "Heizung";
    const tempText = fmtTemp(target);
    const currentText = fmtTemp(current);
    const modeText = modeLabels[mode] || mode || "—";
    const actionText = actionLabels[action] || action;
    const modesHtml = modes.map(m => `<button class="mode ${m === mode ? "selected" : ""}" data-mode="${this._esc(m)}" title="${this._esc(modeLabels[m] || m)}">${this._esc(modeLabels[m] || m)}</button>`).join("");

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; color:var(--primary-text-color); }
        ha-card { overflow:hidden; border-radius:22px; background:linear-gradient(145deg,rgba(255,255,255,.13),rgba(255,255,255,.045)); border:1px solid var(--divider-color,rgba(255,255,255,.16)); box-shadow:0 8px 28px rgba(0,0,0,.12); backdrop-filter:blur(18px); }
        .wrap { padding:18px; min-height:${Math.max(120, Number(c.min_height) || 180)}px; box-sizing:border-box; }
        .top,.row,.metric,.temp-controls,.mode-row { display:flex; align-items:center; }
        .top { justify-content:space-between; gap:12px; }
        .heading { display:flex; align-items:center; gap:10px; font-size:16px; font-weight:600; letter-spacing:.2px; }
        .heat-icon { width:38px;height:38px;border-radius:13px;display:grid;place-items:center;background:rgba(255,157,91,.16);color:#ffad70; }
        .heat-icon ha-icon { --mdc-icon-size:23px; }
        .pill { font-size:11px; padding:6px 10px; border-radius:30px; background:rgba(255,157,91,.14); color:var(--primary-text-color); white-space:nowrap; }
        .thermostat-stage { display:flex; justify-content:center; align-items:center; padding:24px 0 16px; perspective:1100px; overflow:visible; }
        .tado-device { position:relative; width:min(330px,94%); height:190px; transform:rotateY(-13deg) rotateX(4deg); transform-style:preserve-3d; filter:drop-shadow(0 18px 16px rgba(0,0,0,.28)); }
        .tado-body { position:absolute; left:72px; top:28px; width:190px; height:132px; border-radius:62px 72px 72px 62px; background:linear-gradient(100deg,#d5dadd 0%,#f8f9f9 13%,#ffffff 33%,#eef1f2 67%,#c8d0d4 100%); border:1px solid #fff; box-shadow:inset 7px 0 12px #ffffffc9,inset -9px 0 13px #6e7a8040,inset 0 -10px 12px #8c999e33,0 8px 14px #10182055; transform:translateZ(10px); }
        .tado-body:before { content:"";position:absolute;left:12px;top:7px;bottom:7px;width:1px;background:#ffffff;opacity:.9; }
        .tado-body:after { content:"";position:absolute;right:58px;top:0;bottom:0;width:1px;background:linear-gradient(180deg,#ffffff,#c5cdd1,#ffffff);opacity:.8; }
        .tado-adapter { position:absolute;left:9px;top:57px;width:91px;height:75px;border-radius:17px 7px 7px 17px;background:repeating-linear-gradient(0deg,#718087 0 2px,#dfe4e6 2px 5px,#9ba8ae 5px 7px);border:2px solid #e8edef;box-shadow:inset 0 4px 7px #ffffffb8,inset 0 -5px 8px #26343c88,0 5px 8px #111a2055;transform:translateZ(13px); }
        .tado-adapter:after { content:"";position:absolute;right:-13px;top:8px;width:17px;height:55px;border-radius:4px;background:linear-gradient(90deg,#64727a,#f1f4f5,#8a989f);box-shadow:2px 2px 4px #17232a66; }
        .tado-collar { position:absolute;left:218px;top:18px;width:69px;height:151px;border-radius:32px;background:repeating-linear-gradient(90deg,#9aa5aa 0 2px,#f4f6f7 2px 4px,#c3cbd0 4px 6px);border:2px solid #f7f9fa;box-shadow:inset 3px 0 6px #ffffffd9,inset -5px 0 8px #5a686f55,0 5px 9px #17232a66;transform:translateZ(18px); }
        .tado-face { position:absolute;right:0;top:23px;width:139px;height:139px;border-radius:50%;background:radial-gradient(circle at 35% 25%,#34424b 0%,#111a20 52%,#03080c 100%);border:5px solid #aeb9be;box-shadow:inset 0 4px 8px #ffffff22,inset 0 -8px 13px #000c,0 5px 10px #10182088;transform:translateZ(27px);display:flex;align-items:center;justify-content:center;flex-direction:column;color:#fff;overflow:hidden; }
        .tado-face:before { content:"";position:absolute;inset:4px;border-radius:50%;border:1px solid #ffffff22;box-shadow:inset 0 0 14px #ffffff0d;pointer-events:none; }
        .tado-brand { position:absolute;top:18px;font-size:11px;letter-spacing:.3px;color:#d7e0e4; }
        .tado-display { margin-top:14px;display:flex;flex-direction:column;align-items:center;justify-content:center; }
        .tado-display strong { font-size:36px;font-weight:400;letter-spacing:-1.4px;font-variant-numeric:tabular-nums;text-shadow:0 0 10px #dff7ff66;line-height:1.1; }
        .tado-display small { font-size:10px;letter-spacing:1.2px;color:#ffad70;margin-top:5px;text-shadow:0 0 8px #ff9d5b99; }
        .tado-temp-current { position:absolute;bottom:17px;font-size:12px;color:#aebdc5; }
        .tado-glow { position:absolute;right:-23px;top:49px;width:164px;height:88px;border-radius:50%;background:radial-gradient(ellipse,#ff9d5b44 0%,#ff9d5b18 40%,transparent 72%);filter:blur(8px);opacity:0;transform:translateZ(5px);pointer-events:none; }
        .tado-device.heating .tado-glow { opacity:1;animation:glow-breathe 2s ease-in-out infinite; }
        .tado-device.changed .tado-face { animation:face-pulse .9s ease-out; }
        .tado-device.changed .tado-collar { animation:tado-turn .85s cubic-bezier(.2,.8,.2,1); }
        .tado-device.heating .tado-face { border-color:#ffad70;box-shadow:inset 0 4px 8px #ffffff22,inset 0 -8px 13px #000c,0 0 18px #ff9d5b88; }
        .heat-waves { position:absolute;right:4px;top:0;width:92px;height:30px;pointer-events:none;opacity:0;z-index:5; }
        .tado-device.heating .heat-waves { opacity:1; }
        .heat-waves i { position:absolute;bottom:0;width:10px;height:22px;border-left:3px solid rgba(255,173,112,.95);border-radius:50%;filter:drop-shadow(0 0 5px rgba(255,157,91,.8));animation:wave-rise 1.5s ease-in-out infinite; }
        .heat-waves i:nth-child(1){left:12px}.heat-waves i:nth-child(2){left:37px;height:27px;animation-delay:.25s}.heat-waves i:nth-child(3){left:62px;animation-delay:.5s}
        @keyframes face-pulse { 0%{filter:brightness(1)} 35%{filter:brightness(1.55)} 100%{filter:brightness(1)} }
        @keyframes tado-turn { 0%{transform:translateZ(18px) rotate(0)} 55%{transform:translateZ(18px) rotate(38deg)} 100%{transform:translateZ(18px) rotate(0)} }
        @keyframes glow-breathe { 0%,100%{opacity:.55;transform:translateZ(5px) scale(.94)} 50%{opacity:1;transform:translateZ(5px) scale(1.08)} }
        @keyframes wave-rise { 0%,100%{transform:translateY(3px) scaleY(.75);opacity:.25} 50%{transform:translateY(-5px) scaleY(1.1);opacity:1} }
        @media (max-width:390px) { .tado-device { transform:scale(.88) rotateY(-13deg) rotateX(4deg); transform-origin:center; margin:-8px 0; } }
        @media (prefers-reduced-motion: reduce) { .tado-device,.tado-device * { animation:none!important; } }
        .main { text-align:center; padding:7px 0 5px; }
        .temperature { font-size:42px; line-height:1.1; font-weight:300; letter-spacing:-1.5px; font-variant-numeric:tabular-nums; }
        .sub { color:var(--secondary-text-color); font-size:12px; margin-top:5px; }
        .temp-controls { justify-content:center; gap:18px; margin:12px 0 16px; }
        button { font:inherit; color:inherit; cursor:pointer; border:0; }
        .stepper { width:42px;height:42px;border-radius:50%; background:rgba(127,145,163,.18); font-size:25px; display:grid;place-items:center; transition:background .15s,transform .15s; }
        .stepper:active,.mode:active { transform:scale(.95); }
        .stepper:hover,.mode:hover { background:rgba(127,145,163,.3); }
        .target { min-width:86px; text-align:center; font-size:19px; font-weight:600; font-variant-numeric:tabular-nums; }
        .slider-block { padding:0 2px 12px; }
        input[type=range] { width:100%; height:6px; border-radius:20px; appearance:none; outline:none; background:linear-gradient(to right,#ffad70 0%,#ffad70 ${pct}%,rgba(127,145,163,.28) ${pct}%,rgba(127,145,163,.28) 100%); }
        input[type=range]::-webkit-slider-thumb { appearance:none;width:18px;height:18px;border-radius:50%;background:#ffad70;border:3px solid var(--card-background-color,#fff);box-shadow:0 1px 5px #0003; }
        input[type=range]::-moz-range-thumb { width:13px;height:13px;border-radius:50%;background:#ffad70;border:3px solid var(--card-background-color,#fff); }
        .limits { display:flex;justify-content:space-between;color:var(--secondary-text-color);font-size:10px;margin-top:7px; }
        .metrics { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:6px; }
        .metric { min-width:0; gap:9px; padding:10px 11px; border-radius:14px; background:rgba(127,145,163,.10); }
        .metric ha-icon { color:var(--secondary-text-color);--mdc-icon-size:19px;flex:none; }
        .metric-text { min-width:0; }
        .label { color:var(--secondary-text-color);font-size:10px;white-space:nowrap; }
        .val { font-size:13px;font-weight:600;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
        .mode-row { flex-wrap:wrap; gap:6px; margin-top:12px; }
        .mode { flex:1 1 auto; min-width:0; padding:8px 10px; border-radius:12px; background:rgba(127,145,163,.12); font-size:11px; }
        .mode.selected { background:rgba(255,157,91,.22); box-shadow:inset 0 0 0 1px rgba(255,173,112,.35); }
        .missing { padding:18px; color:var(--error-color); }
        @media (max-width:360px) { .wrap{padding:14px}.temperature{font-size:36px}.metrics{gap:6px}.metric{padding:9px} }
      </style>
      <ha-card><div class="wrap">
        <div class="top">
          <div class="heading"><span class="heat-icon"><ha-icon icon="mdi:radiator"></ha-icon></span><span>${this._esc(name)}</span></div>
          <span class="pill">${this._esc(actionText)}</span>
        </div>
        <div class="thermostat-stage">
          <div class="tado-device ${targetChanged ? "changed" : ""} ${action === "heating" ? "heating" : ""}" role="img" aria-label="3D-Thermostat im Stil eines tado° Heizkörper-Thermostats">
            <div class="tado-glow"></div>
            <div class="heat-waves" aria-hidden="true"><i></i><i></i><i></i></div>
            <div class="tado-adapter"></div>
            <div class="tado-body"></div>
            <div class="tado-collar"></div>
            <div class="tado-face">
              <span class="tado-brand">tado°</span>
              <div class="tado-display"><strong>${this._esc(tempText.replace(" °C","°"))}</strong><small>${action === "heating" ? "∿  HEIZT  ∿" : "SOLL"}</small></div>
              <span class="tado-temp-current">${current !== null ? this._esc(currentText.replace(" °C","°")) : ""}</span>
            </div>
          </div>
        </div>
        <div class="main">
          <div class="temperature">${this._esc(tempText)}</div>
          <div class="sub">Eingestellte Temperatur</div>
        </div>
        <div class="temp-controls">
          <button class="stepper" data-delta="-1" aria-label="Temperatur senken">−</button>
          <div class="target">${this._esc(tempText)}</div>
          <button class="stepper" data-delta="1" aria-label="Temperatur erhöhen">+</button>
        </div>
        <div class="slider-block">
          <input aria-label="Solltemperatur" type="range" min="${min}" max="${max}" step="${step}" value="${value}">
          <div class="limits"><span>${min} °C</span><span>${max} °C</span></div>
        </div>
        <div class="metrics">
          ${c.show_current_temperature ? `<div class="metric"><ha-icon icon="mdi:thermometer"></ha-icon><div class="metric-text"><div class="label">Raumtemperatur</div><div class="val">${this._esc(currentText)}</div></div></div>` : ""}
          ${c.show_hvac_mode ? `<div class="metric"><ha-icon icon="mdi:heat-wave"></ha-icon><div class="metric-text"><div class="label">Heizmodus</div><div class="val">${this._esc(modeText)}</div></div></div>` : ""}
          ${c.show_hvac_action ? `<div class="metric"><ha-icon icon="mdi:fire"></ha-icon><div class="metric-text"><div class="label">Heizstatus</div><div class="val">${this._esc(actionText)}</div></div></div>` : ""}
          ${c.show_battery ? `<div class="metric"><ha-icon icon="mdi:battery"></ha-icon><div class="metric-text"><div class="label">Batterie</div><div class="val">${this._esc(batteryText)}</div></div></div>` : ""}
          ${c.show_humidity ? `<div class="metric"><ha-icon icon="mdi:water-percent"></ha-icon><div class="metric-text"><div class="label">Luftfeuchtigkeit</div><div class="val">${this._esc(humidityText)}</div></div></div>` : ""}
        </div>
        ${modes.length ? `<div class="mode-row">${modesHtml}</div>` : ""}
      </div></ha-card>`;

    this.shadowRoot.querySelectorAll("[data-delta]").forEach(btn => btn.addEventListener("click", () => {
      const next = Math.max(min, Math.min(max, value + Number(btn.dataset.delta) * step));
      this._setTemperature(next);
    }));
    const slider = this.shadowRoot.querySelector('input[type="range"]');
    slider?.addEventListener("change", e => this._setTemperature(Number(e.target.value)));
    slider?.addEventListener("input", e => {
      const n = Number(e.target.value);
      const p = Math.max(0, Math.min(100, ((n-min)/(max-min || 1))*100));
      e.target.style.background = `linear-gradient(to right,#ffad70 0%,#ffad70 ${p}%,rgba(127,145,163,.28) ${p}%,rgba(127,145,163,.28) 100%)`;
      const display = this.shadowRoot.querySelector(".target");
      if (display) display.textContent = `${n.toFixed(1).replace(".", ",")} °C`;
    });
    this.shadowRoot.querySelectorAll("[data-mode]").forEach(btn => btn.addEventListener("click", () => {
      this._hass.callService("climate", "set_hvac_mode", { entity_id: c.entity, hvac_mode: btn.dataset.mode });
    }));
  }

  _setTemperature(temperature) {
    if (!this._hass) return;
    this._hass.callService("climate", "set_temperature", {
      entity_id: this.config.entity,
      temperature: Number(temperature.toFixed(2))
    });
  }

  static getConfigElement() { return document.createElement("heating-glass-card-editor"); }
}

class HeatingGlassCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._initialized = false;
  }

  setConfig(config) {
    this._config = { ...config };
    this._renderEditor();
  }

  set hass(hass) {
    this._hass = hass;
    const form = this.shadowRoot?.querySelector("ha-form");
    if (form) form.hass = hass;
  }

  _schema() {
    return [
      {
        name: "entity",
        required: true,
        selector: { entity: { domain: "climate" } }
      },
      {
        name: "name",
        selector: { text: {} }
      },
      {
        name: "battery_entity",
        selector: { entity: { domain: "sensor" } }
      },
      {
        name: "humidity_entity",
        selector: { entity: { domain: "sensor" } }
      },
      {
        name: "min_height",
        selector: { number: { min: 120, max: 600, step: 10, mode: "box", unit_of_measurement: "px" } }
      },
      {
        name: "show_current_temperature",
        selector: { boolean: {} }
      },
      {
        name: "show_hvac_mode",
        selector: { boolean: {} }
      },
      {
        name: "show_hvac_action",
        selector: { boolean: {} }
      },
      {
        name: "show_battery",
        selector: { boolean: {} }
      },
      {
        name: "show_humidity",
        selector: { boolean: {} }
      }
    ];
  }

  _renderEditor() {
    if (!this.shadowRoot || !this._config) return;
    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; }
        .editor { display:grid; gap:12px; padding:8px 0; }
        .section { color:var(--primary-text-color); font-size:14px; font-weight:600; padding:8px 0 0; }
        ha-form { display:block; }
        .hint { color:var(--secondary-text-color); font-size:12px; line-height:1.45; padding:0 12px; }
      </style>
      <div class="editor">
        <div class="section">Thermostat</div>
        <ha-form id="main-form"></ha-form>
        <div class="hint">Wähle hier deine Climate-Entität. Batterie- und Feuchtigkeitssensoren sind optional. Werden sie nicht gesetzt, versucht die Karte passende Attribute der Climate-Entität auszulesen.</div>
      </div>
    `;
    const form = this.shadowRoot.querySelector("#main-form");
    form.hass = this._hass;
    form.data = {
      entity: this._config.entity || "climate.hk_flur",
      name: this._config.name || "Heizung Flur",
      battery_entity: this._config.battery_entity || "",
      humidity_entity: this._config.humidity_entity || "",
      min_height: this._config.min_height ?? 180,
      show_current_temperature: this._config.show_current_temperature ?? true,
      show_hvac_mode: this._config.show_hvac_mode ?? true,
      show_hvac_action: this._config.show_hvac_action ?? true,
      show_battery: this._config.show_battery ?? true,
      show_humidity: this._config.show_humidity ?? true
    };
    form.schema = this._schema();
    form.computeLabel = (schema) => ({
      entity: "Thermostat-Entität",
      name: "Anzeigename",
      battery_entity: "Batteriesensor (optional)",
      humidity_entity: "Luftfeuchtigkeitssensor (optional)",
      min_height: "Karten-Mindesthöhe",
      show_current_temperature: "Raumtemperatur anzeigen",
      show_hvac_mode: "Heizmodus anzeigen",
      show_hvac_action: "Heizstatus anzeigen",
      show_battery: "Batteriestand anzeigen",
      show_humidity: "Luftfeuchtigkeit anzeigen"
    }[schema.name] || schema.name);
    form.addEventListener("value-changed", (event) => {
      event.stopPropagation();
      const next = { ...this._config, ...event.detail.value };
      Object.keys(next).forEach(key => {
        if (next[key] === "" || next[key] === undefined) delete next[key];
      });
      this._config = next;
      this.dispatchEvent(new CustomEvent("config-changed", {
        bubbles: true,
        composed: true,
        detail: { config: next }
      }));
    });
  }
}
customElements.define("heating-glass-card", HeatingGlassCard);
customElements.define("heating-glass-card-editor", HeatingGlassCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type:"heating-glass-card", name:"Heating Glass Card", description:"Glass-Thermostatkarte mit Solltemperaturregler und Statusanzeigen." });
