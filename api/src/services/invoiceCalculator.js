import dayjs from 'dayjs';

export function formatMoney(n) {
  return Number(n || 0).toFixed(2);
}

/* =========================
   OVERDUE
   ========================= */
export function calculateOverdue(previousInvoices = []) {
  return previousInvoices.reduce((sum, iv) => {
    const balance =
      (Number(iv.LOCALDOCAMT) || 0) -
      (Number(iv.PAYMENTAMT) || 0);
    return balance > 0 ? sum + balance : sum;
  }, 0);
}

/* =========================
   BILLING PERIOD
   ========================= */
export function extractBillingPeriod(description = '') {
  const match = description.match(
    /(\d{2}\/\d{2}\/\d{4})\s*-\s*(\d{2}\/\d{2}\/\d{4})/
  );
  return match ? `${match[1]} - ${match[2]}` : '';
}

/* =========================
   SUMMARY
   ========================= */
export function calculateSummary({
  ar_iv,
  ar_ivdtl,
  billingPeriod,
  overdueAmount,
  callTotals,
}) {
  /* Monthly charges */
  const monthlyItems = ar_ivdtl
    .filter(d =>
      Number(d.LOCALDOCAMT) > 0 &&
      !/call/i.test(d.DESCRIPTION)
    )
    .map(d => ({
      label: d.DESCRIPTION,
      amount: formatMoney(d.LOCALDOCAMT),
      indent: 2,
    }));

  const monthlyTotal = ar_ivdtl.reduce(
    (sum, d) =>
      !/call/i.test(d.DESCRIPTION)
        ? sum + (Number(d.LOCALDOCAMT) || 0)
        : sum,
    0
  );

  /* Call charges */
  const callItems = [
    { label: 'Local Call Charges', amount: formatMoney(callTotals.local) },
    { label: 'Trunk Call Charges', amount: formatMoney(callTotals.trunk) },
    { label: 'Mobile Call Charges', amount: formatMoney(callTotals.mobile) },
    { label: 'International Call Charges', amount: formatMoney(callTotals.international) },
  ];

  const callTotal =
    callTotals.local +
    callTotals.trunk +
    callTotals.mobile +
    callTotals.international;

  const totalBeforeTax = monthlyTotal + callTotal;
  const sst = Number((totalBeforeTax * 0.06).toFixed(2));
  const totalCurrentCharges = totalBeforeTax + sst;

  /* Payment info (normal case) */
  const paymentReceived =
    Number(ar_iv.PAYMENTAMT) > 0
      ? {
          date: dayjs(ar_iv.PAYMENTDATE).format('DD-MMM-YYYY'),
          amount: -Number(ar_iv.PAYMENTAMT),
        }
      : {
          date: billingPeriod.split(' - ')[1],
          amount: 0,
        };

  return {
    previousBalance: formatMoney(overdueAmount),
    totalPaymentReceivedDate: paymentReceived.date,
    totalPaymentReceivedAmount: formatMoney(paymentReceived.amount),
    adjustment: '0.00',
    balanceForward: formatMoney(
      overdueAmount + paymentReceived.amount
    ),

    currentChargesTitle: 'Current Charges',
    monthlyChargesTitle: 'Monthly Charges',

    items: [
      ...monthlyItems,
      ...callItems,
      { label: 'Total Before Service Tax', amount: formatMoney(totalBeforeTax) },
      { label: 'Service Tax 6%', amount: formatMoney(sst) },
    ],

    totalCurrentCharges: formatMoney(totalCurrentCharges),
  };
}
