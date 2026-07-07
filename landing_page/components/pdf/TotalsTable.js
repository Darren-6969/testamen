import { View, Text, StyleSheet } from '@react-pdf/renderer';

const GRAY = '#a8a8a8';
const BORDER = '#000';

const styles = StyleSheet.create({
  wrap: {
    marginTop: 6,
    borderWidth: 1, 
    borderColor: BORDER,
  },

  rowHead: {
    flexDirection: 'row',
    backgroundColor: GRAY,
    borderBottomWidth: 1,
    borderColor: BORDER,
  },

  row: {
    flexDirection: 'row',
  },

  cell: {
    flex: 1,
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRightWidth: 1, 
    alignItems: 'center',
    borderColor: BORDER,
  },

  cellLast: {
    flex: 1,
    paddingVertical: 1,
    paddingHorizontal: 4,
    alignItems: 'center',
  },

  head: {
    fontSize: 8.5,
    textAlign: 'center',
  },

  val: {
    fontSize: 8.5,
    textAlign: 'center',
  },
});

export default function TotalsTable({
  overdueAmount,
  dueDate,
  totalAmount,
  style,
}) {
  return (
    <View style={[styles.wrap, style]}>
      {/* HEADER */}
      <View style={styles.rowHead}>
        <View style={styles.cell}>
          <Text style={styles.head}>Overdue Amount</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.head}>Current Charges Due Date</Text>
        </View>
        <View style={styles.cellLast}>
          <Text style={styles.head}>Total Amount Due</Text>
        </View>
      </View>

      {/* BODY */}
      <View style={styles.row}>
        <View style={styles.cell}>
          <Text style={styles.val}>{overdueAmount}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.val}>{dueDate}</Text>
        </View>
        <View style={styles.cellLast}>
          <Text style={styles.val}>{totalAmount}</Text>
        </View>
      </View>
    </View>
  );
}
