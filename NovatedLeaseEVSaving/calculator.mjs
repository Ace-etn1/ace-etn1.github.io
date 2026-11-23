import { calculateComparison, ModelInputError } from './model.mjs?v=20261003-monthly-lease';

const form = document.querySelector('#assumptions');
const fields = [...form.querySelectorAll('[data-model]')];
const result = document.querySelector('#result-value');
const leasePV = document.querySelector('#lease-pv');
const outrightPV = document.querySelector('#outright-pv');
const leaseMonthly = document.querySelector('#lease-monthly');
const explanation = document.querySelector('#result-explainer');
const errorMessage = document.querySelector('#input-errors');
const taxRate = document.querySelector('#tax-rate');
const incomeNote = document.querySelector('#income-note');
const formatAUD = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });
const formatPercent = new Intl.NumberFormat('en-AU', { maximumFractionDigits: 2 });

function updateEstimate() {
    const values = {};
    for (const field of fields) {
        field.removeAttribute('aria-invalid');
        values[field.name] = field.type === 'checkbox' ? field.checked
            : field.validity.badInput ? NaN
            : field.value.trim() === '' ? (field.hasAttribute('data-optional') ? null : NaN)
            : Number(field.value);
    }
    const incomeMode = values.annualIncome !== null;
    taxRate.disabled = incomeMode;
    incomeNote.textContent = incomeMode
        ? 'Income mode uses resident tax brackets + 2% Medicare and overrides the rate selection.'
        : 'Before this lease, after other deductions, excluding super. Leave blank to use the selected rate.';
    errorMessage.hidden = true;
    try {
        const estimate = calculateComparison(values);
        const rounded = Math.round(estimate.saving);
        result.textContent = `${rounded < 0 ? '−' : ''}${formatAUD.format(Math.abs(rounded))}`;
        result.classList.toggle('is-negative', rounded < 0);
        leasePV.textContent = formatAUD.format(estimate.leasePV);
        outrightPV.textContent = formatAUD.format(estimate.outrightPV);
        leaseMonthly.textContent = formatAUD.format(estimate.averageMonthlyLeaseCost);
        explanation.textContent = rounded === 0 ? 'The two options have the same estimated cost in today’s dollars.'
            : rounded < 0 ? 'The lease plus buyout costs more on these assumptions.'
            : 'Less than buying outright, in today’s dollars.';
        document.querySelector('#discount-note').textContent = `Discount rate: ${formatPercent.format(estimate.discountRate * 100)}% a year (lease rate − 2 percentage points).`;
    } catch (error) {
        if (!(error instanceof ModelInputError)) throw error;
        result.textContent = '—';
        leasePV.textContent = '—';
        outrightPV.textContent = '—';
        leaseMonthly.textContent = '—';
        result.classList.remove('is-negative');
        explanation.textContent = 'Check the highlighted assumptions to calculate your saving.';
        errorMessage.textContent = error.message;
        errorMessage.hidden = false;
        for (const field of fields) if (error.fields[field.name]) {
            field.setAttribute('aria-invalid', 'true');
            const details = field.closest('details');
            if (details) details.open = true;
        }
        document.querySelector('#discount-note').textContent = Number.isFinite(values.leaseRate)
            ? `Discount rate: ${formatPercent.format(values.leaseRate - 2)}% a year (lease rate − 2 percentage points).` : 'Discount rate = lease rate − 2 percentage points.';
    }
}

form.addEventListener('input', updateEstimate);
form.addEventListener('change', updateEstimate);
form.addEventListener('submit', event => event.preventDefault());
const methodButton = document.querySelector('#method-button');
const methodDialog = document.querySelector('#method-dialog');
methodButton.addEventListener('click', () => methodDialog.showModal());
document.querySelector('#method-close').addEventListener('click', () => methodDialog.close());
methodDialog.addEventListener('close', () => methodButton.focus());
methodDialog.addEventListener('click', event => {
    const bounds = methodDialog.getBoundingClientRect();
    if (event.target === methodDialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) methodDialog.close();
});
updateEstimate();
