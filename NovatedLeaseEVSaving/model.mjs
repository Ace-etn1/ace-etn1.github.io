// AUD, private use, 60 months, fully FBT-exempt EV; model reviewed 3 October 2026.
// GST cap: 2026–27 car limit $69,883 / 11 = $6,353. Source: PwC July 2026
// (reporting the ATO limit), plus GST Act s69-10. Rental GST is not capped.
// Residual: ATO TD 93/142, 8-year effective life, 5-year lease: 28.13%.
// Tax: 2026–27 resident brackets, LITO and full 2% Medicare levy. Income mode
// is limited to remaining taxable income >= $45,000; the legislated 2027
// lower-bracket cut cancels in the before/after difference above this floor.
export const POLICY = Object.freeze({ months: 60, carLimit: 69883, gstCap: 6353, minimumResidual: 28.13 });

export const DEFAULTS = Object.freeze({
    vehiclePrice: 60000, leaseRate: 9, taxRate: 32, annualIncome: null,
    insurance: 1500, rego: 900, homeCharging: 600, publicCharging: 300,
    maintenance: 600, runningInflation: 3,
    nonGstPurchase: 3000, purchaseGstCredit: null, setupFee: 500,
    adminMonthly: 25, upfrontExpense: 0, buyoutFees: 0, residualRate: 28.13,
    buyoutOverride: null, repaymentOverride: null, employerAdjustment: null,
    insuranceGst: 0, regoGst: 0, packageInsurance: true, packageHomeCharging: true,
});

export class ModelInputError extends Error {
    constructor(fields) { super(Object.values(fields)[0]); this.fields = fields; }
}

export function leasePayment(principal, residual, annualRate, months = POLICY.months) {
    const r = annualRate / 100 / 12;
    if (r === 0) return (principal - residual) / months;
    return (principal - residual) * r / -Math.expm1(-months * Math.log1p(r)) + residual * r;
}

export function residentTaxWithMedicare(income) {
    const brackets = [[18200, 45000, .15], [45000, 135000, .30], [135000, 190000, .37], [190000, Infinity, .45]];
    let incomeTax = 0;
    for (const [low, high, rate] of brackets) incomeTax += Math.max(0, Math.min(income, high) - low) * rate;
    const lito = income <= 37500 ? 700 : income <= 45000
        ? Math.max(0, 700 - (income - 37500) * .05)
        : Math.max(0, 325 - (income - 45000) * .015);
    return Math.max(0, incomeTax - lito) + Math.max(0, income) * .02;
}

export function calculateComparison(input = {}) {
    const a = { ...DEFAULTS, ...input };
    const errors = {};
    const optional = new Set(['annualIncome', 'purchaseGstCredit', 'buyoutOverride', 'repaymentOverride', 'employerAdjustment']);
    for (const [key, value] of Object.entries(a)) {
        if (key === 'packageInsurance' || key === 'packageHomeCharging') continue;
        if (optional.has(key) && value === null) continue;
        if (!Number.isFinite(value) || value < 0) errors[key] = 'Enter a valid, non-negative amount in each highlighted field.';
    }
    if (!(a.vehiclePrice > 0)) errors.vehiclePrice = 'Vehicle price must be greater than $0.';
    if (![32, 39].includes(a.taxRate)) errors.taxRate = 'Choose 32% or 39%, including the Medicare levy.';
    if (a.leaseRate > 100) errors.leaseRate = 'Enter an annual lease interest rate between 0% and 100%.';
    if (a.runningInflation > 100) errors.runningInflation = 'Enter annual cost growth between 0% and 100%.';
    if (a.nonGstPurchase > a.vehiclePrice) errors.nonGstPurchase = 'Non-GST purchase charges cannot exceed the drive-away price.';
    if (a.residualRate < POLICY.minimumResidual || a.residualRate > 100) errors.residualRate = 'Use a residual from 28.13% to 100%, or enter the quoted buyout.';
    if (a.insuranceGst > a.insurance / 11 + .01) errors.insuranceGst = 'Insurance GST cannot exceed one-eleventh of the total premium.';
    if (a.regoGst > a.rego / 11 + .01) errors.regoGst = 'Registration / CTP GST cannot exceed one-eleventh of the total.';
    if (a.repaymentOverride !== null && a.repaymentOverride <= 0) errors.repaymentOverride = 'A quoted monthly finance payment must be greater than $0.';
    if (a.annualIncome !== null && a.annualIncome < 45000) errors.annualIncome = 'Income mode supports taxable income of at least $45,000 after salary sacrifice.';
    if (Object.keys(errors).length) throw new ModelInputError(errors);

    const gstInPrice = (a.vehiclePrice - a.nonGstPurchase) / 11;
    if (a.purchaseGstCredit !== null && a.purchaseGstCredit > gstInPrice + .01) {
        errors.purchaseGstCredit = 'The purchase GST saving cannot exceed the GST in the vehicle price.';
    }
    // A high-value car may produce an employer tax adjustment even when FBT-exempt.
    // Require the user to supply the actual quoted adjustment, including a confirmed zero.
    if (a.vehiclePrice > POLICY.carLimit && a.employerAdjustment === null) {
        errors.employerAdjustment = 'For a car above the $69,883 car limit, enter the quoted monthly employer adjustment (0 if confirmed nil).';
    }
    if (Object.keys(errors).length) throw new ModelInputError(errors);

    const purchaseGstCredit = a.purchaseGstCredit ?? Math.min(gstInPrice, POLICY.gstCap);
    const netVehicleCost = a.vehiclePrice - purchaseGstCredit;
    const principal = netVehicleCost + a.setupFee;
    const residualInclGst = a.buyoutOverride ?? netVehicleCost * a.residualRate / 100 * 1.1;
    const residualExGst = residualInclGst / 1.1;
    if (residualExGst > principal) throw new ModelInputError({ buyoutOverride: 'The buyout before GST cannot exceed the amount financed.' });
    const financeMonthly = a.repaymentOverride ?? leasePayment(principal, residualExGst, a.leaseRate);
    const discountRate = (a.leaseRate - 2) / 100;
    const cashflows = [{ month: 0, outright: a.vehiclePrice, lease: a.upfrontExpense, preTax: 0, taxSaving: 0 }];
    const annualSacrifices = [];
    const annualTaxSavings = [];

    for (let year = 0; year < 5; year += 1) {
        const growth = (1 + a.runningInflation / 100) ** year;
        // Drive-away price already contains the first registration / CTP period.
        const renewal = year === 0 ? 0 : a.rego * growth;
        const renewalGst = year === 0 ? 0 : a.regoGst * growth;
        const insurance = a.insurance * growth;
        const home = a.homeCharging * growth;
        const publicCharge = a.publicCharging * growth;
        const upkeep = a.maintenance * growth;
        const outrightRunning = (insurance + renewal + home + publicCharge + upkeep) / 12;
        const packagedRunning = (
            (a.packageInsurance ? insurance - a.insuranceGst * growth : 0)
            + renewal - renewalGst + (a.packageHomeCharging ? home : 0)
            + (publicCharge + upkeep) / 1.1
        ) / 12;
        const personalRunning = ((a.packageInsurance ? 0 : insurance) + (a.packageHomeCharging ? 0 : home)) / 12;
        // Lease rentals and admin are modelled net of fully passed-through GST credits.
        // Home electricity receives no assumed GST credit without substantiation.
        const preTax = financeMonthly + a.adminMonthly / 1.1 + (a.employerAdjustment ?? 0) + packagedRunning;
        const sacrifice = preTax * 12;
        if (a.annualIncome !== null && a.annualIncome - sacrifice < 45000) {
            throw new ModelInputError({ annualIncome: 'Salary sacrifice leaves taxable income below $45,000. This model does not cover low-income Medicare adjustments; clear income to use the flat-rate assumption.' });
        }
        const taxSaving = a.annualIncome === null ? sacrifice * a.taxRate / 100
            : residentTaxWithMedicare(a.annualIncome) - residentTaxWithMedicare(a.annualIncome - sacrifice);
        annualSacrifices.push(sacrifice);
        annualTaxSavings.push(taxSaving);
        for (let i = 1; i <= 12; i += 1) {
            const month = year * 12 + i;
            cashflows.push({
                month, outright: outrightRunning,
                lease: preTax - taxSaving / 12 + personalRunning
                    + (month === POLICY.months ? residualInclGst + a.buyoutFees : 0),
                preTax, taxSaving: taxSaving / 12,
            });
        }
    }
    let outrightPV = 0, leasePV = 0, outrightTotal = 0, leaseTotal = 0;
    for (const flow of cashflows) {
        const discount = (1 + discountRate) ** (flow.month / 12);
        outrightPV += flow.outright / discount;
        leasePV += flow.lease / discount;
        outrightTotal += flow.outright;
        leaseTotal += flow.lease;
    }
    const saving = outrightPV - leasePV;
    if (!Number.isFinite(saving)) throw new ModelInputError({ vehiclePrice: 'These inputs produce a value outside the supported range.' });
    const averageMonthlyLeaseCost = (leaseTotal - residualInclGst - a.buyoutFees) / POLICY.months;
    return { saving, outrightPV, leasePV, outrightTotal, leaseTotal, averageMonthlyLeaseCost, cashflows, annualSacrifices, annualTaxSavings,
        financeMonthly, principal, purchaseGstCredit, residualExGst, residualInclGst, discountRate };
}
