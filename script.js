document.addEventListener('DOMContentLoaded', () => {
  const salaryForm = document.getElementById('salary-form');
  if (!salaryForm) return;

  salaryForm.addEventListener('submit', (event) => {
    event.preventDefault();
    calculateSalary();
  });
});

function calculateSalary() {
  const hoursWorked = parseFloat(document.getElementById('hoursWorked').value);
  const hourlyWage = parseFloat(document.getElementById('hourlyWage').value);
  const extraHours = parseFloat(document.getElementById('extraHours').value || '0');
  const extraMultiplier = parseFloat(document.getElementById('extraMultiplier').value || '1.5');
  const fradrag = parseFloat(document.getElementById('fradrag').value || '0');
  const taxRateMultiplier = parseFloat(
    document.querySelector('input[name="taxType"]:checked').value
  );

  clearError();

  if (
    [hoursWorked, hourlyWage, extraHours, extraMultiplier, fradrag].some((value) =>
      Number.isNaN(value)
    )
  ) {
    showError('Ingresá valores numéricos válidos.');
    return;
  }

  if (hoursWorked < 0 || hourlyWage < 0 || extraHours < 0 || extraMultiplier < 1 || fradrag < 0) {
    showError('Revisá los datos: no puede haber negativos y el multiplicador debe ser mayor a 1.');
    return;
  }

  const baseGross = hoursWorked * hourlyWage;
  const extraGross = extraHours * hourlyWage * extraMultiplier;
  const gross = baseGross + extraGross;

  const amBidrag = gross * 0.08;
  const taxableAfterAM = Math.max(gross - amBidrag - fradrag, 0);
  const remainingTax = taxableAfterAM * (1 - taxRateMultiplier);
  const net = gross - amBidrag - remainingTax;

  displayResult(formatDKK(net));
  renderBreakdown({
    gross,
    baseGross,
    extraGross,
    amBidrag,
    fradrag,
    taxableAfterAM,
    remainingTax,
  });
}

function renderBreakdown(data) {
  const breakdown = document.getElementById('salary-breakdown');
  breakdown.innerHTML = `
    <div class="breakdown-item">
      <p class="breakdown-label">Bruto total</p>
      <p class="breakdown-value">${formatDKK(data.gross)}</p>
    </div>
    <div class="breakdown-item">
      <p class="breakdown-label">Bruto horas normales</p>
      <p class="breakdown-value">${formatDKK(data.baseGross)}</p>
    </div>
    <div class="breakdown-item">
      <p class="breakdown-label">Bruto horas extra</p>
      <p class="breakdown-value">${formatDKK(data.extraGross)}</p>
    </div>
    <div class="breakdown-item">
      <p class="breakdown-label">AM-bidrag (8%)</p>
      <p class="breakdown-value">-${formatDKK(data.amBidrag)}</p>
    </div>
    <div class="breakdown-item">
      <p class="breakdown-label">Fradrag aplicado</p>
      <p class="breakdown-value">-${formatDKK(data.fradrag)}</p>
    </div>
    <div class="breakdown-item">
      <p class="breakdown-label">Base imponible final</p>
      <p class="breakdown-value">${formatDKK(data.taxableAfterAM)}</p>
    </div>
    <div class="breakdown-item">
      <p class="breakdown-label">Impuesto estimado (A-skat)</p>
      <p class="breakdown-value">-${formatDKK(data.remainingTax)}</p>
    </div>
  `;
}

function showError(message) {
  document.getElementById('salary-error').textContent = message;
}

function clearError() {
  document.getElementById('salary-error').textContent = '';
}

function displayResult(netValue) {
  document.getElementById('result-display').textContent = `Neto estimado en cuenta: ${netValue}`;
}

function formatDKK(amount) {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' DKK';
}

