import { View, Text, StyleSheet } from '@react-pdf/renderer';

const GRAY = '#a8a8a8';
const BORDER = '#000';

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 9,
  },

  row: {
    flexDirection: 'row',
    marginBottom: 2,
  },

  label: {
    flex: 1,
    fontSize: 8.5,
  },

  amount: {
    width: 70,
    textAlign: 'right',
    fontSize: 8.5,
  },

  bold: {
    fontWeight: 'bold',
  },

  indent1: { paddingLeft: 12 },
  indent2: { paddingLeft: 22 },

  // footer total bar
  totalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GRAY,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 2,
    paddingHorizontal: 3,
    marginTop: 6,
  },
  totalLabel: {
    flex: 1,
    fontSize: 8,
  },
  totalValue: {
    width: 200,
    textAlign: 'right',
    fontSize: 8,
  },
  note: {
    marginTop: 4,
    fontSize: 9,
    borderBottomWidth: 1.2,
    borderColor: BORDER,
  },
});

function Row({ row }) {
  if (row.spacer) {
    return <View style={{ height: row.spacer }} />;
  }

  const indentStyle =
    row.indent === 1
      ? styles.indent1
      : row.indent === 2
      ? styles.indent2
      : null;

  return (
    <View style={styles.row}>
      <Text style={[styles.label, row.bold && styles.bold, indentStyle]}>
        {row.label}
      </Text>

      <Text style={[styles.amount, row.bold && styles.bold]}>
        {row.amount ?? ''}
      </Text>
    </View>
  );
}

export default function SummarySection({ rows, totalAmountDue, overdueAmount }) {
  if (!rows || rows.length === 0) return null;

  const overdue = Number(overdueAmount || 0);
  const remitAmount = overdue < 0 ? '0.00' : overdue.toFixed(2);

  return (
    <View wrap={false}>
      {/* SUMMARY ROWS */}
      <View style={styles.wrap}>
        {rows.map((row, idx) => (
          <Row key={idx} row={row} />
        ))}
      </View>

      {/* TOTAL AMOUNT DUE */}
      <View style={styles.totalBar}>
        <Text style={styles.totalLabel}>TOTAL AMOUNT DUE</Text>
        <Text style={styles.totalValue}>{totalAmountDue}</Text>
      </View>

      {/* NOTE */}
      <Text style={styles.note}>
        Your account is now overdue. Kindly remit the sum of RM {remitAmount}{' '}
        to avoid any service interruption. If payment have been made, kindly
        disregard this message.
      </Text>
    </View>
  );
}
