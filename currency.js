/* ─── Currency data ─────────────────────────────────────────── */
const CURRENCIES = [
  // Major
  { code: 'USD', name: 'US Dollar',          flag: '🇺🇸', group: 'major' },
  { code: 'EUR', name: 'Euro',               flag: '🇪🇺', group: 'major' },
  { code: 'GBP', name: 'British Pound',      flag: '🇬🇧', group: 'major' },
  { code: 'DKK', name: 'Danish Krone',       flag: '🇩🇰', group: 'major' },
  { code: 'SEK', name: 'Swedish Krona',      flag: '🇸🇪', group: 'major' },
  { code: 'NOK', name: 'Norwegian Krone',    flag: '🇳🇴', group: 'major' },
  { code: 'CHF', name: 'Swiss Franc',        flag: '🇨🇭', group: 'major' },
  { code: 'JPY', name: 'Japanese Yen',       flag: '🇯🇵', group: 'major' },
  { code: 'CAD', name: 'Canadian Dollar',    flag: '🇨🇦', group: 'major' },
  { code: 'AUD', name: 'Australian Dollar',  flag: '🇦🇺', group: 'major' },
  // LATAM
  { code: 'ARS', name: 'Peso Argentino',       flag: '🇦🇷', group: 'latam' },
  { code: 'BRL', name: 'Real Brasileño',       flag: '🇧🇷', group: 'latam' },
  { code: 'CLP', name: 'Peso Chileno',         flag: '🇨🇱', group: 'latam' },
  { code: 'COP', name: 'Peso Colombiano',      flag: '🇨🇴', group: 'latam' },
  { code: 'MXN', name: 'Peso Mexicano',        flag: '🇲🇽', group: 'latam' },
  { code: 'PEN', name: 'Sol Peruano',          flag: '🇵🇪', group: 'latam' },
  { code: 'UYU', name: 'Peso Uruguayo',        flag: '🇺🇾', group: 'latam' },
  { code: 'PYG', name: 'Guaraní Paraguayo',    flag: '🇵🇾', group: 'latam' },
  { code: 'BOB', name: 'Boliviano',            flag: '🇧🇴', group: 'latam' },
  { code: 'DOP', name: 'Peso Dominicano',      flag: '🇩🇴', group: 'latam' },
  { code: 'CRC', name: 'Colón Costarricense',  flag: '🇨🇷', group: 'latam' },
  { code: 'GTQ', name: 'Quetzal Guatemalteco', flag: '🇬🇹', group: 'latam' },
  { code: 'HNL', name: 'Lempira Hondureño',    flag: '🇭🇳', group: 'latam' },
  { code: 'NIO', name: 'Córdoba Nicaragüense', flag: '🇳🇮', group: 'latam' },
  { code: 'PAB', name: 'Balboa Panameño',      flag: '🇵🇦', group: 'latam' },
];

const LATAM_CODES = ['ARS','BRL','CLP','COP','MXN','PEN','UYU','PYG','BOB','DOP','CRC','GTQ','HNL','NIO','PAB'];

// Currencies that normally trade in large numbers — show 0 decimal places
const ZERO_DECIMAL = new Set(['JPY','CLP','PYG','COP','CRC','HNL','DOP','GTQ','NIO','IDR','KRW','VND']);

/* ─── Rate cache (5 min TTL) ────────────────────────────────── */
const ratesCache = {};
const cacheMeta  = {};
const CACHE_MS   = 5 * 60 * 1000;

async function fetchRates(base) {
  const now = Date.now();
  if (ratesCache[base] && (now - cacheMeta[base]) < CACHE_MS) {
    return ratesCache[base];
  }

  // Primary: open.er-api.com (free, no key, CORS-enabled)
  let data;
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
    data = await res.json();
    if (data.result !== 'success') throw new Error('bad result');
  } catch {
    // Fallback: exchangerate-api.com v4 (also free, no key)
    const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`);
    data = await res.json();
    data.rates = data.rates;   // same shape
    data.result = 'success';
  }

  ratesCache[base] = data.rates;
  cacheMeta[base]  = now;
  return data.rates;
}

/* Returns the ARS blue-market sell rate (USD→ARS), or null on failure */
async function fetchArsBlue() {
  try {
    const res  = await fetch('https://dolarapi.com/v1/dolares/blue');
    const data = await res.json();
    return data.venta ?? null;
  } catch {
    return null;
  }
}

/* ─── Formatting ─────────────────────────────────────────────── */
function fmt(amount, code) {
  const decimals = ZERO_DECIMAL.has(code) ? 0 : 2;
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/* ─── Populate selects ───────────────────────────────────────── */
function populateSelects() {
  ['from-currency', 'to-currency'].forEach(id => {
    const sel = document.getElementById(id);
    const majorGrp = document.createElement('optgroup');
    majorGrp.label = '─ Principales';
    const latamGrp = document.createElement('optgroup');
    latamGrp.label = '─ América Latina';

    CURRENCIES.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.code;
      opt.textContent = `${c.flag}  ${c.code} — ${c.name}`;
      (c.group === 'major' ? majorGrp : latamGrp).appendChild(opt);
    });

    sel.appendChild(majorGrp);
    sel.appendChild(latamGrp);
  });

  document.getElementById('from-currency').value = 'DKK';
  document.getElementById('to-currency').value   = 'USD';
}

/* ─── Main convert ───────────────────────────────────────────── */
async function convert() {
  const amountInput = document.getElementById('amount');
  const amount      = parseFloat(amountInput.value);
  const fromCode    = document.getElementById('from-currency').value;
  const toCode      = document.getElementById('to-currency').value;
  const resultEl    = document.getElementById('result-amount');
  const rateEl      = document.getElementById('rate-info');
  const latamGrid   = document.getElementById('latam-grid');
  const arsNote     = document.getElementById('ars-note');

  if (!amount || isNaN(amount) || amount <= 0) {
    resultEl.textContent = '—';
    rateEl.textContent   = '';
    latamGrid.innerHTML  = '';
    arsNote.style.display = 'none';
    return;
  }

  resultEl.textContent = '...';
  resultEl.classList.add('loading');
  setLoading(true);

  try {
    const rates = await fetchRates(fromCode);

    const toRate = rates[toCode];
    if (toRate == null) throw new Error(`No hay tasa para ${toCode}`);

    const converted = amount * toRate;
    resultEl.textContent = fmt(converted, toCode);
    resultEl.classList.remove('loading');

    rateEl.textContent = `1 ${fromCode} = ${fmt(toRate, toCode)} ${toCode}`;

    // ── LATAM grid ──
    latamGrid.innerHTML = LATAM_CODES.map(code => {
      const c    = CURRENCIES.find(x => x.code === code);
      const rate = rates[code];
      if (!c || rate == null) return '';
      const isActive = code === fromCode || code === toCode;
      return `
        <div class="latam-item${isActive ? ' latam-item--active' : ''}">
          <span class="latam-flag">${c.flag}</span>
          <span class="latam-code">${code}</span>
          <span class="latam-amount">${fmt(amount * rate, code)}</span>
        </div>`;
    }).join('');

    // ── ARS blue rate (shown when either side is ARS) ──
    if (fromCode === 'ARS' || toCode === 'ARS') {
      const blue = await fetchArsBlue();
      if (blue) {
        let blueConverted, lineText;
        if (fromCode === 'USD') {
          blueConverted = amount * blue;
          lineText = `${fmt(amount, 'USD')} USD = <strong>${fmt(blueConverted, 'ARS')} ARS</strong> (blue)`;
        } else if (fromCode === 'ARS' && toCode === 'USD') {
          blueConverted = amount / blue;
          lineText = `${fmt(amount, 'ARS')} ARS = <strong>${fmt(blueConverted, 'USD')} USD</strong> (blue)`;
        } else {
          lineText = `Dólar blue: 1 USD = <strong>${fmt(blue, 'ARS')} ARS</strong>`;
        }
        arsNote.innerHTML   = `<span class="note-label">ARS Blue</span> ${lineText}`;
        arsNote.style.display = 'block';
      } else {
        arsNote.style.display = 'none';
      }
    } else {
      arsNote.style.display = 'none';
    }

  } catch (err) {
    resultEl.textContent  = 'Error';
    resultEl.classList.remove('loading');
    rateEl.textContent    = 'No se pudo obtener la tasa de cambio';
    console.error('Currency convert error:', err);
  } finally {
    setLoading(false);
  }
}

function setLoading(on) {
  const btn = document.getElementById('convert-btn');
  btn.disabled    = on;
  btn.textContent = on ? 'Cargando...' : 'Convertir';
}

function swap() {
  const from = document.getElementById('from-currency');
  const to   = document.getElementById('to-currency');
  [from.value, to.value] = [to.value, from.value];
  convert();
}

/* ─── Init ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  populateSelects();

  document.getElementById('convert-btn').addEventListener('click', convert);
  document.getElementById('swap-btn').addEventListener('click', swap);

  document.getElementById('amount').addEventListener('input', () => {
    clearTimeout(window._ct);
    window._ct = setTimeout(convert, 450);
  });

  document.getElementById('from-currency').addEventListener('change', convert);
  document.getElementById('to-currency').addEventListener('change', convert);

  convert();
});
