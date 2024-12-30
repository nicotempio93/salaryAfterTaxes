document.addEventListener('DOMContentLoaded', () => {
    const currencyForm = document.getElementById('currency-form');
    const inputs = {
        dkk: document.getElementById('dkk'),
        usd: document.getElementById('usd'),
        ars: document.getElementById('ars')
    };

    // Limpiar otros inputs cuando se escribe en uno
    Object.keys(inputs).forEach(currency => {
        inputs[currency].addEventListener('input', () => {
            Object.keys(inputs).forEach(otherCurrency => {
                if (otherCurrency !== currency && inputs[currency].value) {
                    inputs[otherCurrency].value = '';
                }
            });
        });
    });

    currencyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        convertCurrency();
    });
});

// Función para obtener tasas de cambio de la API de Frankfurter
async function fetchExchangeRates() {
    const url = 'https://api.frankfurter.app/latest?symbols=USD,DKK'; // Solicitar USD y DKK desde EUR
    try {
        const response = await fetch(url);
        const data = await response.json();

        // Devolver las tasas de cambio de EUR a USD y EUR a DKK
        return {
            USD: data.rates.USD,  // Tasa de EUR a USD
            DKK: data.rates.DKK   // Tasa de EUR a DKK
        };
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        return null;  // Devolver null si hay un error
    }
}

// Función para obtener la cotización de USD a ARS desde DolarApi
async function fetchArsExchangeRate() {
    const url = 'https://dolarapi.com/v1/dolares/blue';  // URL de la API
    try {
        const response = await fetch(url);
        const data = await response.json();

        // Acceder al valor de venta de USD a ARS
        return data.venta;  // Aquí accedemos al valor "venta"
    } catch (error) {
        console.error('Error fetching ARS exchange rate:', error);
        return null;  // Devolver null si hay un error
    }
}

async function convertCurrency() {
    const dkkInput = document.getElementById('dkk').value;
    const usdInput = document.getElementById('usd').value;
    const arsInput = document.getElementById('ars').value;

    let amount, sourceCurrency;
    
    // Determinar qué input se llenó
    if (dkkInput) {
        amount = parseFloat(dkkInput.replace(/\./g, ''));
        sourceCurrency = 'DKK';
    } else if (usdInput) {
        amount = parseFloat(usdInput.replace(/\./g, ''));
        sourceCurrency = 'USD';
    } else if (arsInput) {
        amount = parseFloat(arsInput.replace(/\./g, ''));
        sourceCurrency = 'ARS';
    } else {
        displayResult('Please enter an amount in one of the fields');
        return;
    }

    if (isNaN(amount)) {
        displayResult('Please enter a valid number');
        return;
    }

    // Obtener tasas de cambio de la API
    const exchangeRates = await fetchExchangeRates();
    const arsRate = await fetchArsExchangeRate();

    if (!exchangeRates || arsRate === null) {
        displayResult('Error fetching exchange rates');
        return;
    }

    let conversions = {};

    // Conversiones dependiendo de la moneda base
    if (sourceCurrency === 'DKK') {
        conversions = {
            DKK: amount.toFixed(2),
            USD: (amount / exchangeRates.DKK * exchangeRates.USD).toFixed(2),
            ARS: (amount / exchangeRates.DKK * arsRate).toFixed(2)  // Usar tasa "venta" para ARS
        };
    } else if (sourceCurrency === 'USD') {
        conversions = {
            DKK: (amount * exchangeRates.DKK / exchangeRates.USD).toFixed(2),
            USD: amount.toFixed(2),
            ARS: (amount * arsRate).toFixed(2)  // Usar tasa "venta" para ARS
        };
    } else if (sourceCurrency === 'ARS') {
        conversions = {
            DKK: (amount * exchangeRates.DKK / arsRate).toFixed(2),  // Usar tasa "venta" para ARS
            USD: (amount / arsRate * exchangeRates.USD).toFixed(2),  // Usar tasa "venta" para ARS
            ARS: amount.toFixed(2)
        };
    }

    // Formatear los resultados con separadores de miles
    const formattedConversions = {
        DKK: formatNumber(conversions.DKK),
        USD: formatNumber(conversions.USD),
        ARS: formatNumber(conversions.ARS)
    };

    // Mostrar resultados sin repetir la moneda de entrada
    let resultMessage = `<div><strong>${amount} ${sourceCurrency} equals:</strong></div>`;
    
    // Mostrar solo las conversiones que no corresponden a la moneda de entrada
    if (sourceCurrency !== 'DKK') {
        resultMessage += `<div>${formattedConversions.DKK} DKK</div>`;
    }
    if (sourceCurrency !== 'USD') {
        resultMessage += `<div>${formattedConversions.USD} USD</div>`;
    }
    if (sourceCurrency !== 'ARS') {
        resultMessage += `<div>${formattedConversions.ARS} ARS</div>`;
    }

    displayResult(resultMessage);
}

// Función para formatear números con separadores de miles (SOLO EN LOS RESULTADOS)
function formatNumber(number) {
    return parseFloat(number).toLocaleString('es-AR');  // 'es-AR' para usar el formato de Argentina (puedes cambiarlo a otro idioma o región)
}

function displayResult(message) {
    const resultDisplay = document.getElementById('result-display');
    resultDisplay.innerHTML = message.replace(/\n/g, '<br>');
}
