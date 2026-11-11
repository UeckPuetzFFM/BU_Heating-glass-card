/* Heating Glass Card v2.1.4 - corrected horizontal glass layout */
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
      glass_enabled: true,
      glass_opacity: 75,
      glass_blur: 18,
      card_scale: 50,
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
    if (value === null || value === undefined || value === "") return null;
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
        .scale-shell { width:100%; transform:scale(${Math.max(25,Math.min(100,Number(c.card_scale ?? 50)))/100}); transform-origin:top center; margin-bottom:-${100-Math.max(25,Math.min(100,Number(c.card_scale ?? 50)))}%; }
        .scale-shell ha-card { width:100%; }
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
      
        /* v2.1 original horizontal glass layout */
        :host { color:#f4f8fc; }
        ha-card {
          border-radius:28px;
          background:radial-gradient(ellipse at 50% 38%,rgba(83,139,171,.22),transparent 55%),linear-gradient(145deg,rgba(15,37,54,.96),rgba(24,49,66,.94) 52%,rgba(9,27,41,.98));
          border:1px solid rgba(166,211,235,.42);
          box-shadow:0 14px 36px rgba(0,0,0,.32),inset 0 1px 0 rgba(255,255,255,.18);
          backdrop-filter:blur(var(--glass-blur,18px));
        }
        .wrap { min-height:${Math.max(300, Number(c.min_height) || 390)}px; padding:22px 24px 20px; position:relative; background:linear-gradient(120deg,rgba(255,255,255,.055),transparent 34%,rgba(255,255,255,.025)); }
        .wrap:before {content:"";position:absolute;inset:7px;border:1px solid rgba(174,220,244,.16);border-radius:22px;pointer-events:none}
        .heading {gap:13px;font-size:inherit}
        .heat-icon {width:48px;height:48px;border-radius:16px;background:linear-gradient(145deg,rgba(255,177,104,.24),rgba(255,142,67,.10));color:#ffb36f}
        .heat-icon ha-icon {--mdc-icon-size:29px}
        .heading-copy{min-width:0}
        .name{font-size:clamp(19px,3vw,27px);font-weight:650;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .pill{display:flex;align-items:center;gap:8px;padding:9px 15px;border:1px solid rgba(255,173,91,.65);background:linear-gradient(145deg,rgba(255,164,76,.28),rgba(255,124,42,.12));color:#ffe2c4;font-size:13px;font-weight:650;box-shadow:0 0 18px rgba(255,143,60,.12)}
        .heat-symbol{font-size:20px;letter-spacing:-4px;color:#ffad55;padding-right:4px}
        .thermostat-stage{padding:22px 0 12px}
        .tado-device{width:min(500px,96%);height:220px;transform:rotateY(-10deg) rotateX(2deg)}
        .tado-adapter{left:1%;top:72px;width:24%;height:76px}
        .tado-body{left:17%;top:28px;width:55%;height:164px}
        .tado-collar{left:61%;top:18px;width:14%;height:184px}
        .tado-face{right:2%;top:17px;width:184px;height:184px;border-width:6px}
        .tado-brand{top:22px;font-size:12px}
        .tado-display{margin-top:16px}
        .tado-display strong{font-size:clamp(30px,5vw,43px)}
        .tado-display small{font-size:11px;letter-spacing:1.5px}
        .tado-temp-current{bottom:20px;font-size:13px}
        .tado-glow{right:-6%;top:46px;width:34%;height:130px}
        .main{padding:0 0 3px}
        .temperature{font-size:clamp(38px,6vw,54px);color:#f7fbff;text-shadow:0 0 16px #dff7ff22}
        .sub{color:#b8cbd7;font-size:13px}
        .temp-controls{gap:24px;margin:15px 0 18px}
        .stepper{width:52px;height:52px;background:linear-gradient(145deg,rgba(179,214,234,.23),rgba(104,147,172,.13));border:1px solid rgba(200,231,248,.20);font-size:30px;box-shadow:inset 0 1px 0 #ffffff1b,0 4px 12px #0002}
        .target{min-width:104px;font-size:23px}
        input[type=range]{height:8px;background:linear-gradient(to right,#ffad70 0%,#ffad70 ${pct}%,rgba(190,220,237,.25) ${pct}%,rgba(190,220,237,.25) 100%)}
        input[type=range]::-webkit-slider-thumb{width:20px;height:20px;background:#ffb16d;border:3px solid #f5f9fb;box-shadow:0 1px 7px #0007}
        .limits{color:#c2d2dc;font-size:11px}
        .metrics{grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-top:9px}
        .metric{min-height:76px;flex-direction:column;align-items:center;justify-content:center;gap:5px;padding:10px 7px;border-radius:17px;background:linear-gradient(145deg,rgba(180,218,239,.15),rgba(123,166,191,.075));border:1px solid rgba(182,220,241,.20);box-shadow:inset 0 1px 0 #ffffff16}
        .metric ha-icon{color:#c6dbe7;--mdc-icon-size:23px}
        .metric-text{text-align:center}
        .label{color:#c0d2de;font-size:11px}
        .val{font-size:15px;color:#f4f8fb}
        .status-line{text-align:center;color:#ffbd85;font-size:11px;margin-top:8px}
        .mode-row{margin-top:12px}
        .mode{background:rgba(177,211,230,.10);border:1px solid rgba(190,223,241,.15);color:#dce9f0}
        .mode.selected{background:rgba(255,157,91,.20);border-color:rgba(255,173,112,.48);color:#fff0df}
        @media(max-width:520px){
          .wrap{padding:18px 16px 16px}
          .thermostat-stage{padding:18px 0 10px}
          .tado-device{width:100%;height:190px;transform:scale(.92) rotateY(-10deg) rotateX(2deg);transform-origin:center}
          .tado-face{width:158px;height:158px;right:1%;top:16px}
          .tado-collar{height:160px;top:15px}
          .tado-body{height:142px;top:25px}
          .tado-adapter{top:61px;height:66px}
          .metrics{grid-template-columns:repeat(2,minmax(0,1fr))}
          .metric{min-height:66px}
          .heading{gap:10px}.heat-icon{width:42px;height:42px}
          .pill{padding:8px 11px;font-size:12px}
        }
        @media(max-width:360px){
          .wrap{padding:16px 12px}.name{font-size:18px}
          .tado-device{transform:scale(.82) rotateY(-10deg) rotateX(2deg);margin:-12px 0}
          .temperature{font-size:38px}.stepper{width:45px;height:45px}.temp-controls{gap:14px}
        }

        /* v2.1.1 – präzise Layout-Anpassung an die freigegebene Referenz */
        :host { display:block; width:100%; color:#f3f8fc; }
        ha-card {
          width:100%; overflow:hidden; box-sizing:border-box; border-radius:28px;
          background:radial-gradient(ellipse at 50% 34%,rgba(73,126,157,.22),transparent 58%),linear-gradient(145deg,#102838 0%,#142f42 48%,#0b1d2b 100%);
          border:1px solid rgba(160,207,232,.48);
          box-shadow:0 14px 36px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.18);
          -webkit-backdrop-filter:blur(var(--glass-blur,18px)); backdrop-filter:blur(var(--glass-blur,18px));
        }
        .wrap {
          min-height:0 !important; height:auto; box-sizing:border-box;
          padding:22px 24px 20px;
          background:radial-gradient(ellipse at 50% 34%,rgba(91,148,180,.12),transparent 58%);
          position:relative;
        }
        .wrap:before { inset:7px; border-radius:22px; border-color:rgba(174,220,244,.18); }
        .top { min-height:58px; position:relative; z-index:2; }
        .heading { gap:13px; min-width:0; }
        .heat-icon { width:48px;height:48px;flex:none;border-radius:15px;background:linear-gradient(145deg,rgba(255,177,104,.25),rgba(255,142,67,.10));color:#ffb36f; }
        .heat-icon ha-icon { --mdc-icon-size:29px; }
        .heading-copy { display:flex; flex-direction:column; min-width:0; }
        .name { display:block;font-size:clamp(20px,3vw,27px);font-weight:650;line-height:1.12;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#f4f8fc; }
        .pill { flex:none;display:flex;align-items:center;gap:8px;padding:9px 15px;border:1px solid rgba(255,173,91,.7);border-radius:30px;background:linear-gradient(145deg,rgba(255,164,76,.30),rgba(255,124,42,.13));color:#ffe2c4;font-size:13px;font-weight:650;box-shadow:0 0 18px rgba(255,143,60,.14); }
        .thermostat-stage { display:flex;justify-content:center;align-items:center;padding:12px 0 3px;perspective:1100px;overflow:visible; }
        .tado-device { position:relative;width:min(470px,88%);height:220px;transform:rotateY(-10deg) rotateX(2deg);transform-style:preserve-3d;filter:drop-shadow(0 18px 16px rgba(0,0,0,.30)); }
        .tado-adapter { left:1%;top:72px;width:24%;height:76px; }
        .tado-body { left:17%;top:28px;width:55%;height:164px; }
        .tado-collar { left:61%;top:18px;width:14%;height:184px; }
        .tado-face { right:2%;top:17px;width:184px;height:184px;border-width:6px; }
        .tado-brand { top:22px;font-size:12px; }
        .tado-display { margin-top:16px; }
        .tado-display strong { font-size:clamp(30px,5vw,43px); }
        .tado-display small { font-size:11px;letter-spacing:1.5px; }
        .tado-temp-current { bottom:20px;font-size:13px; }
        .tado-glow { right:-6%;top:46px;width:34%;height:130px; }
        .main { text-align:center;padding:0 0 2px; }
        .temperature { font-size:clamp(40px,6vw,54px);line-height:1.08;font-weight:350;letter-spacing:-1.5px;color:#f7fbff;text-shadow:0 0 16px rgba(223,247,255,.12); }
        .sub { color:#b8cbd7;font-size:13px;margin-top:5px; }
        .temp-controls { justify-content:center;gap:24px;margin:14px 0 16px; }
        .stepper { width:54px;height:54px;flex:none;border-radius:50%;background:linear-gradient(145deg,rgba(179,214,234,.24),rgba(104,147,172,.14));border:1px solid rgba(200,231,248,.22);font-size:30px;box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 4px 12px rgba(0,0,0,.16); }
        .target { min-width:110px;text-align:center;font-size:23px;font-weight:600;color:#f5f9fc; }
        .slider-block { padding:0 2px 10px; }
        input[type=range] { height:8px;border-radius:20px; }
        input[type=range]::-webkit-slider-thumb { width:20px;height:20px;background:#ffb16d;border:3px solid #f5f9fb;box-shadow:0 1px 7px rgba(0,0,0,.45); }
        input[type=range]::-moz-range-thumb { width:14px;height:14px;background:#ffb16d;border:3px solid #f5f9fb;box-shadow:0 1px 7px rgba(0,0,0,.45); }
        .limits { color:#c2d2dc;font-size:11px;margin-top:8px; }
        .metrics { display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-top:10px; }
        .metric { min-width:0;min-height:82px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;padding:10px 6px;border-radius:17px;background:linear-gradient(145deg,rgba(180,218,239,.16),rgba(123,166,191,.075));border:1px solid rgba(182,220,241,.22);box-shadow:inset 0 1px 0 rgba(255,255,255,.10); }
        .metric ha-icon { color:#c6dbe7;--mdc-icon-size:24px; }
        .metric-text { min-width:0;text-align:center; }
        .label { color:#c0d2de;font-size:11px;white-space:nowrap; }
        .val { font-size:15px;color:#f4f8fb;font-weight:650;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
        .status-line { text-align:center;color:#ffbd85;font-size:11px;margin-top:8px; }
        .mode-row { margin-top:10px; }
        .mode { background:rgba(177,211,230,.10);border:1px solid rgba(190,223,241,.15);color:#dce9f0; }
        .mode.selected { background:rgba(255,157,91,.20);border-color:rgba(255,173,112,.48);color:#fff0df; }
        @media(max-width:600px) {
          .wrap { padding:18px 16px 16px; }
          .thermostat-stage { padding:10px 0 2px; }
          .tado-device { width:100%;height:190px;transform:scale(.92) rotateY(-10deg) rotateX(2deg);transform-origin:center; }
          .tado-face { width:158px;height:158px;right:1%;top:16px; }
          .tado-collar { height:160px;top:15px; }
          .tado-body { height:142px;top:25px; }
          .tado-adapter { top:61px;height:66px; }
          .metrics { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .metric { min-height:72px; }
          .heading { gap:10px; }
          .heat-icon { width:42px;height:42px; }
          .pill { padding:8px 11px;font-size:12px; }
        }
        @media(max-width:380px) {
          .wrap { padding:16px 12px; }
          .name { font-size:19px; }
          .tado-device { transform:scale(.82) rotateY(-10deg) rotateX(2deg);margin:-10px 0; }
          .temperature { font-size:38px; }
          .stepper { width:46px;height:46px; }
          .temp-controls { gap:14px; }
        }
        @media(prefers-reduced-motion:reduce) { .tado-device,.tado-device * { animation:none!important; } }

        /* v2.1.3: verbindliche Layout-Regeln passend zur freigegebenen Querformat-Referenz */
        :host { display:block !important; width:100% !important; }
        ha-card { display:block !important; width:100% !important; max-width:none !important; }
        .wrap { display:block !important; width:100% !important; min-height:0 !important; padding:22px 24px 20px !important; }
        .top { display:flex !important; flex-direction:row !important; align-items:center !important; justify-content:space-between !important; }
        .thermostat-stage { display:flex !important; width:100% !important; min-height:220px !important; align-items:center !important; justify-content:center !important; padding:12px 0 3px !important; }
        .tado-device { width:min(470px,88%) !important; height:220px !important; margin:0 auto !important; }
        .main { display:block !important; text-align:center !important; }
        .temperature { display:block !important; text-align:center !important; font-size:clamp(42px,6vw,58px) !important; }
        .sub { display:block !important; text-align:center !important; }
        .temp-controls { display:flex !important; flex-direction:row !important; justify-content:center !important; align-items:center !important; }
        .slider-block { display:block !important; width:100% !important; }
        .metrics { display:grid !important; grid-template-columns:repeat(4,minmax(0,1fr)) !important; gap:9px !important; }
        .metric { display:flex !important; flex-direction:column !important; align-items:center !important; justify-content:center !important; text-align:center !important; min-width:0 !important; }
        .metric-text { text-align:center !important; }
        .mode-row { display:flex !important; flex-direction:row !important; }
        @media(max-width:620px) {
          .wrap { padding:18px 14px 16px !important; }
          .thermostat-stage { min-height:190px !important; }
          .tado-device { width:100% !important; height:190px !important; transform:scale(.92) rotateY(-10deg) rotateX(2deg) !important; }
          .tado-face { width:158px !important; height:158px !important; right:1% !important; top:16px !important; }
          .tado-collar { height:160px !important; top:15px !important; }
          .tado-body { height:142px !important; top:25px !important; }
          .tado-adapter { top:61px !important; height:66px !important; }
          .metrics { grid-template-columns:repeat(2,minmax(0,1fr)) !important; }
        }
        @media(prefers-reduced-motion:reduce) { .tado-device,.tado-device * { animation:none!important; } }
      </style>
      <ha-card data-card-version="2.1.3"><div class="wrap">
        <div class="top">
          <div class="heading"><span class="heat-icon"><ha-icon icon="mdi:thermometer"></ha-icon></span><div class="heading-copy"><div class="name">${this._esc(name)}</div></div></div>
          <span class="pill"><span class="heat-symbol">≋</span>${this._esc(actionText)}</span>
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
          ${c.show_current_temperature ? `<div class="metric"><ha-icon icon="mdi:thermometer"></ha-icon><div class="metric-text"><div class="label">Raumtemp.</div><div class="val">${this._esc(currentText)}</div></div></div>` : ""}
          ${c.show_humidity ? `<div class="metric"><ha-icon icon="mdi:water-percent"></ha-icon><div class="metric-text"><div class="label">Luftfeuchte</div><div class="val">${this._esc(humidityText)}</div></div></div>` : ""}
          ${c.show_battery ? `<div class="metric"><ha-icon icon="mdi:battery"></ha-icon><div class="metric-text"><div class="label">Batterie</div><div class="val">${this._esc(batteryText)}</div></div></div>` : ""}
          ${c.show_hvac_mode ? `<div class="metric"><ha-icon icon="mdi:heat-wave"></ha-icon><div class="metric-text"><div class="label">Heizmodus</div><div class="val">${this._esc(modeText)}</div></div></div>` : ""}
        </div>
        ${c.show_hvac_action ? `<div class="status-line">${this._esc(actionText)}</div>` : ""}
        ${modes.length ? `<div class="mode-row">${modesHtml}</div>` : ""}
      </div></ha-card></div>`;

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
      { name: "card_scale", selector: { number: { min: 25, max: 100, step: 5, mode: "slider", unit_of_measurement: "%" } } },
      { name: "glass_enabled", selector: { boolean: {} } },
      { name: "glass_opacity", selector: { number: { min: 10, max: 100, step: 5, mode: "slider", unit_of_measurement: "%" } } },
      { name: "glass_blur", selector: { number: { min: 0, max: 40, step: 1, mode: "slider", unit_of_measurement: "px" } } },
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
      card_scale: this._config.card_scale ?? 50,
      glass_enabled: this._config.glass_enabled ?? true,
      glass_opacity: this._config.glass_opacity ?? 75,
      glass_blur: this._config.glass_blur ?? 18,
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
      card_scale: "Kartengröße",
      glass_enabled: "Glass-Effekt aktivieren",
      glass_opacity: "Glas-Transparenz",
      glass_blur: "Glas-Unschärfe",
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
if (!customElements.get("heating-glass-card")) customElements.define("heating-glass-card", HeatingGlassCard);
if (!customElements.get("heating-glass-card-editor")) customElements.define("heating-glass-card-editor", HeatingGlassCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type:"heating-glass-card", name:"Heating Glass Card", description:"Horizontale Glass-Thermostatkarte mit 3D-Thermostat, Temperaturregler und Sensoranzeigen." });
