document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('currency-form');
  if (!form) return;

  const inputs = {
    DKK: document.getElementById('dkk'),
    USD: document.getElementById('usd'),
    ARS: document.getElementById('ars'),
  };
  const resultDisplay = document.getElementById('result-display');
  const errorDisplay = document.getElementById('currency-error');
  const rateMeta = document.getElementById('rate-meta');

  let rates = null;
  let isInternalUpdate = false;
  let debounceId;

  form.addEventListener('submit', (event) => event.preventDefault());

  Object.entries(inputs).forEach(([currency, input]) => {
    input.addEventListener('input', () => {
      if (isInternalUpdate) return;

      clearTimeout(debounceId);
      debounceId = setTimeout(() => {
        convertFromInput(currency, input.value);
      }, 220);
    });
  });

  loadRates().then((loadedRates) => {
    rates = loadedRates;
    renderRateMeta(rates);
  }).catch(() => {
    showError('No se pudieron cargar las tasas en este momento.');
  });

  async function convertFromInput(sourceCurrency, rawValue) {
    clearError();

    const hasAnyValue = Object.values(inputs).some((input) => input.value.trim() !== '');
    if (!hasAnyValue) {
      resultDisplay.textContent = 'Ingresá un monto para convertir.';
      return;
    }

    const amount = parseLocalizedNumber(rawValue);
    if (amount === null) {
      return;
    }

    if (!Number.isFinite(amount) || amount < 0) {
      showError('Ingresá un monto válido mayor o igual a 0.');
      return;
    }

    if (!rates) {
      try {
        rates = await loadRates();
        renderRateMeta(rates);
      } catch {
        showError('No se pudieron actualizar las tasas de cambio.');
        return;
      }
    }

    const converted = convertAmount(amount, sourceCurrency, rates);

    isInternalUpdate = true;
    Object.entries(inputs).forEach(([currency, input]) => {
      if (currency === sourceCurrency) return;
      input.value = formatEditableNumber(converted[currency]);
    });
    isInternalUpdate = false;

    resultDisplay.textContent = `${formatCurrency(amount, sourceCurrency)} equivalen a ${formatCurrency(
      converted.DKK,
      'DKK'
    )}, ${formatCurrency(converted.USD, 'USD')} y ${formatCurrency(converted.ARS, 'ARS')}.`;
  }

  function convertAmount(amount, sourceCurrency, loadedRates) {
    const usdToDkk = loadedRates.dkkPerEur / loadedRates.usdPerEur;
    const dkkToUsd = loadedRates.usdPerEur / loadedRates.dkkPerEur;
    const usdToArs = loadedRates.arsPerUsd;

    if (sourceCurrency === 'DKK') {
      const usd = amount * dkkToUsd;
      return {
        DKK: amount,
        USD: usd,
        ARS: usd * usdToArs,
      };
    }

    if (sourceCurrency === 'USD') {
      return {
        DKK: amount * usdToDkk,
        USD: amount,
        ARS: amount * usdToArs,
      };
    }

    const usd = amount / usdToArs;
    return {
      DKK: usd * usdToDkk,
      USD: usd,
      ARS: amount,
    };
  }

  async function loadRates() {
    const cacheKey = 'salary_app_rates_v2';
    const tenMinutes = 10 * 60 * 1000;
    const cachedRaw = localStorage.getItem(cacheKey);
    const staleCache = parseCache(cachedRaw);

    if (staleCache) {
      const cached = staleCache;
      if (Date.now() - cached.fetchedAt < tenMinutes) {
        return cached;
      }
    }

    try {
      const [fxResponse, arsResponse] = await Promise.all([
        fetchJsonWithFallback([
          {
            url: 'https://api.frankfurter.app/latest?from=EUR&to=USD,DKK',
            source: 'Frankfurter',
          },
          {
            url: 'https://latest.currency-api.pages.dev/v1/currencies/eur.json',
            source: 'Currency API',
          },
        ]),
        fetchJsonWithFallback([
          {
            url: 'https://dolarapi.com/v1/dolares/blue',
            source: 'DolarAPI',
          },
          {
            url: 'https://api.bluelytics.com.ar/v2/latest',
            source: 'Bluelytics',
          },
        ]),
      ]);

      const frankfurterData = fxResponse.data;
      const dolarData = arsResponse.data;

      const payload = {
        usdPerEur: frankfurterData?.rates?.USD ?? frankfurterData?.eur?.usd,
        dkkPerEur: frankfurterData?.rates?.DKK ?? frankfurterData?.eur?.dkk,
        arsPerUsd: dolarData?.venta ?? dolarData?.blue?.value_sell,
        fetchedAt: Date.now(),
        sources: {
          fxSource: fxResponse.source,
          arsSource: arsResponse.source,
          frankfurterDate: frankfurterData?.date ?? null,
          dolarDate: dolarData?.fechaActualizacion ?? dolarData?.last_update ?? null,
        },
      };

      if (!payload.usdPerEur || !payload.dkkPerEur || !payload.arsPerUsd) {
        throw new Error('Datos incompletos de tasas');
      }

      localStorage.setItem(cacheKey, JSON.stringify(payload));
      return payload;
    } catch (error) {
      if (staleCache) {
        return staleCache;
      }
      throw error;
    }
  }

  async function fetchJsonWithFallback(urls) {
    let lastError = null;

    for (const { url, source } of urls) {
      try {
        const response = await fetchWithTimeout(url, 6000);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return {
          data: await response.json(),
          source,
        };
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError ?? new Error('No se pudo consultar ninguna API');
  }

  async function fetchWithTimeout(url, timeoutMs) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, { signal: controller.signal });
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  function renderRateMeta(loadedRates) {
    const localFetchTime = new Date(loadedRates.fetchedAt);
    const frankfurterDate = loadedRates.sources.frankfurterDate
      ? new Date(loadedRates.sources.frankfurterDate)
      : null;
    const dolarDate = loadedRates.sources.dolarDate
      ? new Date(loadedRates.sources.dolarDate)
      : null;

    const lines = [
      `Última actualización local: ${formatDateTime(localFetchTime)}.`,
      `Fuente DKK/USD: ${loadedRates.sources.fxSource ?? 'Frankfurter'}${frankfurterDate ? ` (${formatDate(frankfurterDate)})` : ''}.`,
      `Fuente ARS/USD: ${loadedRates.sources.arsSource ?? 'DolarAPI'}${dolarDate ? ` (${formatDateTime(dolarDate)})` : ''}.`,
    ];

    rateMeta.innerHTML = lines.map((line) => `<div>${line}</div>`).join('');
  }

  function parseLocalizedNumber(value) {
    const sanitized = value.trim().replace(/\s+/g, '').replace(/[^\d.,-]/g, '');
    if (!sanitized) return null;

    const lastComma = sanitized.lastIndexOf(',');
    const lastDot = sanitized.lastIndexOf('.');
    const decimalSeparator = lastComma > lastDot ? ',' : '.';

    let normalized = sanitized;

    if (decimalSeparator === ',') {
      normalized = normalized.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = normalized.replace(/,/g, '');
    }

    return Number(normalized);
  }

  function parseCache(value) {
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  function formatEditableNumber(number) {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(number);
  }

  function formatCurrency(amount, currency) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  function showError(message) {
    errorDisplay.textContent = message;
  }

  function clearError() {
    errorDisplay.textContent = '';
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  function formatDateTime(date) {
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
});
