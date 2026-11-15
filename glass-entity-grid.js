const DEFAULTS = {
  columns: 3, height: 52, radius: 18, gap: 10, padding: 6, blur: 18,
  transparency: 18, nameSize: 12, stateSize: 10, iconSize: 17, iconCircle: 30,
  backgroundColor: '#ffffff', borderColor: '#ffffff', iconColor: '#98a2b3',
  activeColor: '#34c759', activeBackground: '#34c759', shadow: 25,
  entities: []
};

class GlassEntityGrid extends HTMLElement {
  setConfig(config) {
    if (!config || !Array.isArray(config.entities)) throw new Error('Bitte mindestens eine Entity konfigurieren.');
    this.config = { ...DEFAULTS, ...config, entities: config.entities };
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this.render();
  }
  set hass(hass) { this._hass = hass; if (this.shadowRoot && this.config) this.render(); }
  getCardSize() { return Math.max(1, Math.ceil((this.config?.entities?.length || 1) / (this.config?.columns || 3))); }

  render() {
    if (!this.shadowRoot || !this.config) return;
    const c = this.config;
    const entities = c.entities || [];
    const cards = entities.map((item, index) => {
      const stateObj = this._hass?.states?.[item.entity];
      const state = stateObj?.state ?? 'unavailable';
      const isOn = state === 'on' || state === 'true';
      const unavailable = !stateObj || ['unavailable', 'unknown'].includes(state);
      const label = item.name || stateObj?.attributes?.friendly_name || item.entity || 'Entity';
      const icon = item.icon || stateObj?.attributes?.icon || 'mdi:lightbulb-outline';
      return `<button class="tile ${isOn ? 'active' : ''} ${unavailable ? 'unavailable' : ''}" data-index="${index}" title="${this.escape(label)}" aria-label="${this.escape(label)}: ${this.escape(this.stateLabel(state))}">
        <span class="icon-wrap"><ha-icon icon="${this.escape(icon)}"></ha-icon></span>
        <span class="texts"><span class="name">${this.escape(label)}</span><span class="state">${this.escape(this.stateLabel(state))}</span></span>
      </button>`;
    }).join('');
    const bgAlpha = Math.max(0, Math.min(100, Number(c.transparency))) / 100;
    const borderAlpha = Math.max(0, Math.min(100, Number(c.borderOpacity ?? 22))) / 100;
    const shadowAlpha = Math.max(0, Math.min(100, Number(c.shadow))) / 100;
    const rgb = (hex) => this.hexToRgb(hex);
    const bg = rgb(c.backgroundColor), border = rgb(c.borderColor), active = rgb(c.activeBackground);
    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block}
        .grid{display:grid;grid-template-columns:repeat(${Math.max(1,Number(c.columns)||3)},minmax(0,1fr));gap:${Math.max(0,Number(c.gap)||0)}px}
        .tile{box-sizing:border-box;width:100%;height:${Math.max(40,Number(c.height)||52)}px;padding:${Math.max(0,Number(c.padding)||0)}px 10px;border-radius:${Math.max(0,Number(c.radius)||18)}px;display:grid;grid-template-columns:${Math.max(18,Number(c.iconCircle)||30)}px minmax(0,1fr);grid-template-rows:1fr 1fr;grid-template-areas:"i n" "i s";column-gap:8px;text-align:left;align-items:center;color:var(--primary-text-color);background:linear-gradient(145deg,rgba(${bg},${Math.min(1,bgAlpha+.08)}),rgba(${bg},${bgAlpha*.28}));border:1px solid rgba(${border},${borderAlpha});backdrop-filter:blur(${Math.max(0,Number(c.blur)||0)}px) saturate(160%);-webkit-backdrop-filter:blur(${Math.max(0,Number(c.blur)||0)}px) saturate(160%);box-shadow:0 8px 24px rgba(0,0,0,${shadowAlpha}),inset 0 1px 0 rgba(255,255,255,.28);cursor:pointer;font:inherit;min-width:0}
        .icon-wrap{grid-area:i;width:${Math.max(18,Number(c.iconCircle)||30)}px;height:${Math.max(18,Number(c.iconCircle)||30)}px;border-radius:50%;background:rgba(152,162,179,.22);display:flex;align-items:center;justify-content:center;align-self:center;justify-self:start;color:${c.iconColor}}
        ha-icon{--mdc-icon-size:${Math.max(10,Number(c.iconSize)||17)}px}
        .texts{grid-column:2;grid-row:1 / 3;display:grid;grid-template-rows:1fr 1fr;min-width:0;height:100%;align-items:center}
        .name{font-size:${Math.max(8,Number(c.nameSize)||12)}px;font-weight:500;opacity:.95;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;align-self:end;line-height:1.15}
        .state{font-size:${Math.max(7,Number(c.stateSize)||10)}px;opacity:.6;align-self:start;line-height:1.2}
        .active .icon-wrap{background:rgba(${active},.25);box-shadow:0 0 10px rgba(${active},.45);color:${c.activeColor}}
        .unavailable{opacity:.5}
        .tile:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}
        @media(max-width:500px){.tile{padding:${Math.max(0,Number(c.padding)||0)}px 7px;grid-template-columns:${Math.max(18,Number(c.iconCircle)||30)}px minmax(0,1fr);column-gap:6px}}
      </style><div class="grid">${cards}</div>`;
    this.shadowRoot.querySelectorAll('.tile').forEach((button) => {
      const item = entities[Number(button.dataset.index)];
      let holdTimer, held = false;
      button.addEventListener('click', () => { if (held) { held = false; return; } this.handleTap(item); });
      button.addEventListener('contextmenu', (event) => { event.preventDefault(); this.handleHold(item); });
      button.addEventListener('pointerdown', () => { held = false; holdTimer = setTimeout(() => { held = true; this.handleHold(item); }, 550); });
      ['pointerup','pointerleave','pointercancel'].forEach((eventName) => button.addEventListener(eventName, () => clearTimeout(holdTimer)));
    });
  }
  handleTap(item) {
    if (!this._hass || !item?.entity) return;
    const [domain] = item.entity.split('.');
    const toggleDomains = ['light','switch','input_boolean','fan','automation','script','humidifier','remote','media_player'];
    if (toggleDomains.includes(domain)) this._hass.callService(domain, 'toggle', { entity_id: item.entity });
    else this.handleHold(item);
  }
  handleHold(item) { if (item?.entity) this.dispatchEvent(new CustomEvent('hass-more-info', { bubbles:true, composed:true, detail:{ entityId:item.entity } })); }
  stateLabel(state) {
    const labels = {on:'Ein',off:'Aus',true:'Ein',false:'Aus',unavailable:'Nicht verfügbar',unknown:'Unbekannt',home:'Zuhause',not_home:'Nicht zuhause',open:'Offen',closed:'Geschlossen',playing:'Wiedergabe',paused:'Pausiert'};
    return labels[state] || state;
  }
  hexToRgb(hex) {
    const clean = String(hex || '#ffffff').replace('#','');
    const full = clean.length === 3 ? clean.split('').map(x=>x+x).join('') : clean;
    const n = parseInt(full,16);
    return `${(n>>16)&255},${(n>>8)&255},${n&255}`;
  }
  escape(value) { return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
}

class GlassEntityGridEditor extends HTMLElement {
  setConfig(config) { this._config = { ...DEFAULTS, ...config, entities: (config.entities || []).map(x=>({...x})) }; this.render(); }
  set hass(hass) { this._hass = hass; if (this.isConnected && this._config) this.render(); }
  connectedCallback() { if (this._config) this.render(); }
  render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({mode:'open'});
    const c = this._config;
    const field = (key,label,min=0,max=200,step=1) => `<label>${label}<input type="number" data-key="${key}" min="${min}" max="${max}" step="${step}" value="${c[key]}"></label>`;
    const color = (key,label) => `<label class="color-field">${label}<input type="color" data-key="${key}" value="${c[key]}"></label>`;
    const entityRows = c.entities.map((item,i)=>`
      <div class="device" data-index="${i}">
        <div class="device-head"><strong>Gerät ${i+1}</strong><div class="move"><button data-move="-1" title="Nach oben" ${i===0?'disabled':''}>↑</button><button data-move="1" title="Nach unten" ${i===c.entities.length-1?'disabled':''}>↓</button><button class="remove" title="Entfernen">✕</button></div></div>
        <ha-entity-picker class="picker" label="Home-Assistant-Entity" allow-custom-entity></ha-entity-picker>
        <div class="device-fields"><label>Name<input data-field="name" value="${this.escape(item.name||'')}" placeholder="z. B. Stehlampe"></label><label>Icon (MDI)<input data-field="icon" value="${this.escape(item.icon||'')}" placeholder="mdi:floor-lamp"></label></div>
      </div>`).join('');
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;color:var(--primary-text-color);font-family:var(--paper-font-body1)}
      h3{font-size:16px;margin:20px 0 10px}.hint{color:var(--secondary-text-color);font-size:12px;margin:-4px 0 12px}
      .section{border:1px solid var(--divider-color);border-radius:14px;padding:14px;margin:14px 0;background:var(--card-background-color,transparent)}
      .section-title{font-weight:600;margin-bottom:12px;display:flex;align-items:center;gap:8px}
      .fields{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
      label{display:flex;flex-direction:column;gap:5px;font-size:12px;color:var(--secondary-text-color);min-width:0}
      input:not([type=color]){box-sizing:border-box;width:100%;min-width:0;background:var(--input-fill-color, var(--secondary-background-color));color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:8px;padding:9px;font:inherit;font-size:14px}
      input[type=color]{width:100%;height:38px;padding:3px;border:1px solid var(--divider-color);border-radius:8px;background:transparent}
      .device{border:1px solid var(--divider-color);border-radius:12px;padding:12px;margin:10px 0}
      .device-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.move{display:flex;gap:5px}
      button{border:1px solid var(--divider-color);background:var(--secondary-background-color);color:var(--primary-text-color);border-radius:7px;padding:6px 10px;cursor:pointer}button:disabled{opacity:.35;cursor:default}
      .device-fields{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:9px}
      .actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.primary{background:var(--primary-color);color:var(--text-primary-color,#fff);border:0;padding:9px 14px}
      .preview-grid{display:grid;grid-template-columns:repeat(${Math.max(1,Number(c.columns)||3)},minmax(0,1fr));gap:${Math.max(0,Number(c.gap)||10)}px}
      .preview-tile{min-width:0;height:${Math.max(40,Number(c.height)||52)}px;padding:6px 10px;border-radius:${Math.max(0,Number(c.radius)||18)}px;display:flex;align-items:center;gap:9px;background:linear-gradient(145deg,rgba(255,255,255,.18),rgba(255,255,255,.05));border:1px solid rgba(255,255,255,.22);backdrop-filter:blur(${c.blur}px) saturate(160%);box-shadow:0 8px 24px rgba(0,0,0,${Number(c.shadow)/100}),inset 0 1px 0 rgba(255,255,255,.28)}
      .preview-icon{width:${c.iconCircle}px;height:${c.iconCircle}px;flex:0 0 ${c.iconCircle}px;border-radius:50%;background:rgba(152,162,179,.22);display:grid;place-items:center;color:${c.iconColor};font-size:${c.iconSize}px}
      .preview-text{min-width:0;display:flex;flex-direction:column;gap:1px}.preview-name{font-size:${c.nameSize}px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.preview-state{font-size:${c.stateSize}px;color:var(--secondary-text-color)}
      @media(max-width:760px){.fields{grid-template-columns:repeat(2,minmax(0,1fr))}.device-fields{grid-template-columns:1fr}.preview-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:430px){.preview-grid{grid-template-columns:1fr}}
    </style>
    <div class="section"><div class="section-title">▦ Layout</div><div class="hint">Anordnung und Größe der Kacheln</div><div class="fields">
      ${field('columns','Spalten',1,6)}${field('height','Kachelhöhe (px)',40,240)}${field('radius','Eckenradius (px)',0,60)}${field('gap','Abstand (px)',0,40)}
      ${field('padding','Innenabstand (px)',0,30)}
    </div></div>
    <div class="section"><div class="section-title">◈ Design</div><div class="hint">Glasoptik, Farben, Schatten und Typografie</div><div class="fields">
      ${field('blur','Glas-Blur (px)',0,40)}${field('transparency','Glas-Deckkraft (%)',0,100)}${field('shadow','Schattenstärke (%)',0,100)}${field('borderOpacity','Rahmen-Deckkraft (%)',0,100)}
      ${field('iconCircle','Icon-Kreis (px)',18,80)}${field('iconSize','Icon-Größe (px)',10,50)}${field('nameSize','Schriftgröße Name (px)',8,30)}${field('stateSize','Schriftgröße Status (px)',7,24)}
      ${color('backgroundColor','Glasfarbe')}${color('borderColor','Rahmenfarbe')}${color('iconColor','Icon-Farbe (Aus)')}${color('activeColor','Icon-Farbe (Ein)')}${color('activeBackground','Icon-Kreisfarbe (Ein)')}
    </div></div>
    <div class="section"><div class="section-title">▣ Geräte</div><div class="hint">Entities auswählen, benennen, mit Icons versehen und sortieren</div>
      <div id="devices">${entityRows}</div><div class="actions"><button class="primary" id="add">＋ Gerät hinzufügen</button></div>
    </div>
    <div class="section"><div class="section-title">◉ Live-Vorschau</div><div class="hint">Beispielansicht mit den aktuellen Design-Einstellungen</div>
      <div class="preview-grid">${(c.entities.length?c.entities:[{name:'Stehlampe',icon:'mdi:floor-lamp'}]).map((item,i)=>`<div class="preview-tile"><span class="preview-icon">${this.iconGlyph(item.icon)}</span><span class="preview-text"><strong class="preview-name">${this.escape(item.name||item.entity||'Gerät')}</strong><span class="preview-state">${this.escape(this.previewState(item))}</span></span></div>`).join('')}</div>
    </div>`;
    this.shadowRoot.querySelectorAll('input[data-key]').forEach(input=>{
      const update=()=>{this._config[input.dataset.key]=input.type==='color'?input.value:Number(input.value);this.emit();this.renderPreviewOnly();};
      input.addEventListener('change',update);
    });
    this.shadowRoot.querySelectorAll('.device').forEach(row=>{
      const i=Number(row.dataset.index), item=this._config.entities[i], picker=row.querySelector('.picker');
      picker.hass=this._hass; picker.value=item.entity||'';
      picker.addEventListener('value-changed',e=>{this._config.entities[i].entity=e.detail.value;this.emit();this.render();});
      row.querySelectorAll('input[data-field]').forEach(input=>input.addEventListener('change',()=>{this._config.entities[i][input.dataset.field]=input.value;this.emit();this.renderPreviewOnly();}));
      row.querySelector('.remove').addEventListener('click',()=>{this._config.entities.splice(i,1);this.emit();this.render();});
      row.querySelectorAll('[data-move]').forEach(btn=>btn.addEventListener('click',()=>{const j=i+Number(btn.dataset.move);if(j<0||j>=this._config.entities.length)return;[this._config.entities[i],this._config.entities[j]]=[this._config.entities[j],this._config.entities[i]];this.emit();this.render();}));
    });
    this.shadowRoot.getElementById('add').addEventListener('click',()=>{this._config.entities.push({entity:'',name:'',icon:''});this.emit();this.render();});
  }
  renderPreviewOnly(){ /* The full editor refreshes on the next config change; keep edits responsive without rebuilding focused inputs. */ }
  previewState(item){const s=this._hass?.states?.[item.entity]?.state;return s?({'on':'Ein','off':'Aus','true':'Ein','false':'Aus'}[s]||s):'Ein / Aus';}
  iconGlyph(icon){const map={'mdi:floor-lamp':'♟','mdi:lightbulb':'●','mdi:television':'▣','mdi:robot-vacuum':'◉','mdi:deck':'▱'};return map[icon]||'◉';}
  escape(v){return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
  emit(){this.dispatchEvent(new CustomEvent('config-changed',{bubbles:true,composed:true,detail:{config:{...this._config,entities:this._config.entities.filter(x=>x.entity)}}}));}
}
GlassEntityGrid.getConfigElement=()=>document.createElement('glass-entity-grid-editor');
GlassEntityGrid.getStubConfig=()=>({ ...DEFAULTS, entities:[{entity:'light.example',name:'Beispiel',icon:'mdi:lightbulb'}] });
if(!customElements.get('glass-entity-grid'))customElements.define('glass-entity-grid',GlassEntityGrid);
if(!customElements.get('glass-entity-grid-editor'))customElements.define('glass-entity-grid-editor',GlassEntityGridEditor);
window.customCards=window.customCards||[];
window.customCards.push({type:'glass-entity-grid',name:'Glass Entity Grid',description:'Anpassbare Frosted-Glass-Gerätekarte mit visuellem Dialog-Editor',preview:true});
