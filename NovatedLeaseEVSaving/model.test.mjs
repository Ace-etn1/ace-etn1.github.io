import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateComparison, leasePayment, residentTaxWithMedicare, ModelInputError, DEFAULTS } from './model.mjs';

const near = (actual, expected, tolerance = 1e-7) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);
const noRunning = { insurance: 0, rego: 0, homeCharging: 0, publicCharging: 0, maintenance: 0, runningInflation: 0 };

test('finance matches workbook repayment and amortises to the balloon', () => {
    near(leasePayment(60000, 18000, 9), 1006.8509195068626);
    near(leasePayment(60000, 18000, 0), 700);
    const m = calculateComparison();
    let balance = m.principal;
    for (let i = 0; i < 60; i++) balance = balance * (1 + DEFAULTS.leaseRate / 1200) - m.financeMonthly;
    near(balance, m.residualExGst);
});

test('GST, financed setup and GST-inclusive residual are applied once', () => {
    const m = calculateComparison();
    near(m.purchaseGstCredit, 57000 / 11);
    near(m.principal, 60000 - 57000 / 11 + 500);
    near(m.residualInclGst, (60000 - 57000 / 11) * .2813 * 1.1);
    near(m.cashflows[60].lease - m.cashflows[59].lease, m.residualInclGst);
    const capped = calculateComparison({ vehiclePrice: 85000, employerAdjustment: 0 });
    near(capped.purchaseGstCredit, 6353);
    near(calculateComparison({ purchaseGstCredit: 0 }).purchaseGstCredit, 0);
});

test('five-year ownership includes only four rego renewals beyond drive-away', () => {
    const m = calculateComparison({ ...noRunning, rego: 1200 });
    near(m.outrightTotal, 60000 + 4 * 1200);
    near(m.cashflows[1].outright, 0);
    near(m.cashflows[12].outright, 0);
    near(m.cashflows[13].outright, 100);
    near(m.cashflows[60].outright, 100);
});

test('self-arranged insurance creates only tax and invoice GST savings', () => {
    const reimbursed = calculateComparison({ ...noRunning, insurance: 1200, insuranceGst: 100 });
    const privatePaid = calculateComparison({ ...noRunning, insurance: 1200, insuranceGst: 100, packageInsurance: false });
    near(reimbursed.outrightTotal, privatePaid.outrightTotal);
    // $1,200 paid privately versus ($1,200 - $100 GST) * (1 - 32%) = $748.
    near(privatePaid.leaseTotal - reimbursed.leaseTotal, (1200 - 748) * 5);
    const noCredit = calculateComparison({ ...noRunning, insurance: 1200 });
    near(privatePaid.leaseTotal - noCredit.leaseTotal, 1200 * .32 * 5);
});

test('home charging GST is not assumed; reimbursement can be disabled', () => {
    const packaged = calculateComparison({ ...noRunning, homeCharging: 600 });
    const personal = calculateComparison({ ...noRunning, homeCharging: 600, packageHomeCharging: false });
    near(personal.leaseTotal - packaged.leaseTotal, 600 * .32 * 5);
});

test('income mode splits salary sacrifice across the 39% and 32% bands', () => {
    near(residentTaxWithMedicare(150000) - residentTaxWithMedicare(130000), 15000 * .39 + 5000 * .32);
    const flat = calculateComparison({ ...noRunning, taxRate: 39 });
    const income = calculateComparison({ ...noRunning, taxRate: 39, annualIncome: 140000 });
    const sacrifice = income.annualSacrifices[0];
    near(income.annualTaxSavings[0], 5000 * .39 + (sacrifice - 5000) * .32);
    assert.ok(income.saving < flat.saving);
    near(calculateComparison({ ...noRunning, annualIncome: 100000 }).saving, calculateComparison({ ...noRunning, taxRate: 32 }).saving);
});

test('LITO is included while full 2% Medicare assumption is preserved', () => {
    near(residentTaxWithMedicare(66000) - residentTaxWithMedicare(65000), 335);
    assert.throws(() => calculateComparison({ annualIncome: 50000 }), ModelInputError);
});

test('discount rate is exactly loan rate minus 2, including zero and negative', () => {
    const zero = calculateComparison({ leaseRate: 2 });
    near(zero.discountRate, 0);
    near(zero.saving, zero.outrightTotal - zero.leaseTotal);
    const negative = calculateComparison({ leaseRate: 0 });
    near(negative.discountRate, -.02);
    assert.ok(Number.isFinite(negative.saving));
    near(calculateComparison().discountRate, .07);
});

test('month-zero and final fees have the correct present values', () => {
    const base = calculateComparison();
    near(base.saving - calculateComparison({ upfrontExpense: 1000 }).saving, 1000);
    near(base.saving - calculateComparison({ buyoutFees: 1000 }).saving, 1000 / 1.07 ** 5);
});

test('quote overrides replace finance and residual, not add to them', () => {
    const m = calculateComparison({ repaymentOverride: 800, buyoutOverride: 16500 });
    near(m.financeMonthly, 800);
    near(m.residualExGst, 15000);
    near(m.residualInclGst, 16500);
});

test('PV independently reconciles to a level-annuity calculation without running costs', () => {
    const m = calculateComparison({ ...noRunning, upfrontExpense: 123, buyoutFees: 456 });
    const d = 1.07 ** (1 / 12) - 1;
    const monthly = (m.financeMonthly + 25 / 1.1) * .68;
    const expectedLeasePV = 123 + monthly * (1 - (1 + d) ** -60) / d + (m.residualInclGst + 456) / 1.07 ** 5;
    near(m.leasePV, expectedLeasePV);
    near(m.saving, 60000 - expectedLeasePV);
});

test('invalid inputs and unquoted high-value adjustments do not produce savings', () => {
    for (const input of [{ vehiclePrice: NaN }, { vehiclePrice: 0 }, { nonGstPurchase: 70000 }, { insuranceGst: 200 }, { regoGst: 100 }, { purchaseGstCredit: 6000 }, { vehiclePrice: 80000 }, { annualIncome: -1 }, { leaseRate: -1 }]) {
        assert.throws(() => calculateComparison(input), ModelInputError);
    }
    assert.ok(Number.isFinite(calculateComparison({ vehiclePrice: 80000, employerAdjustment: 0 }).saving));
});
