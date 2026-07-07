export function buildInvoiceSummary(summary) {
  if (!summary) return [];

  const rows = [];
  // Previous balance
  rows.push({
    label: 'Previous Balance',
    amount: summary.previousBalance,
  });

  const rawPaymentAmount = Number(summary.totalPaymentReceivedAmount || 0);
  const paymentAmount = `-${Math.abs(rawPaymentAmount).toFixed(2)}`;

  rows.push({
    label: `Total Payment Received By ${summary.totalPaymentReceivedDate}. Thank You.`,
    amount: paymentAmount,
  });

  // Adjustment / CN / DN
  if (summary.invoices?.length) {
    summary.invoices.forEach(iv => {
      rows.push({
        label: `${iv.ref}`,
        amount: iv.amount,
      });
    });
  } else if (summary.creditNotes?.length) {
    summary.creditNotes.forEach(cn => {
      rows.push({
        label: `${cn.ref}`,
        amount: cn.amount,
      });
    });
  } else if (summary.debitNotes?.length) {
    summary.debitNotes.forEach(dn => {
      rows.push({
        label: `${dn.ref}`,
        amount: dn.amount,
      });
    });
  } else {
    rows.push({
      label: 'Adjustment',
      amount: summary.adjustment,
    });
  }

  rows.push({ spacer: 12 });

  // Balance forward
  rows.push({
    label: 'Balance Forward',
    amount: summary.balanceForward,
  });

  rows.push({ spacer: 6 });

  // Current charges section
  rows.push({
    label: summary.currentChargesTitle || 'Current Charges',
    bold: true,
  });

  rows.push({
    label: summary.monthlyChargesTitle || 'Monthly Charges',
  });

  // Invoice detail items (MAX 5 as per your rule)
  (summary.items || []).forEach(item => {
    rows.push({
      label: item.label,
      amount: item.amount,
      indent: item.indent ?? 0,
    });
  });

  rows.push({ spacer: 6 });

  // Total current charges
  rows.push({
    label: 'Total Current Charges including service tax',
    amount: summary.totalCurrentCharges,
  });

  return rows;
}
