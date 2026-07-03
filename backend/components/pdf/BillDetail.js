import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  block: { width: '72%', marginTop: 3, lineHeight: 0.62 },

  infoRow: { flexDirection: 'row', marginBottom: 2 },
  label: { width: 85, fontSize: 8.5, fontWeight: 'bold' },
  gap: { width: 8 },
  colon: { width: 6, textAlign: 'center', fontSize: 8.5 },
  value: { flex: 1, fontSize: 8.5 },

  qrBox: { width: 95, alignItems: 'center' },
  qrImg: { width: 80, height: 80, borderWidth: 1 },
});

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.gap} />
      <Text style={styles.colon}>:</Text>
      <View style={styles.gap} />
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export default function BillDetail({ invoice }) {
  return (
    <View style={styles.row}>
      <View style={styles.block}>
        <InfoRow label="Account No." value={invoice.accountNo} />
        <InfoRow label="Account Name" value={invoice.accountName} />
        <InfoRow label="Phone No./PIN" value={invoice.phoneOrPin} />
        <InfoRow label="Bill No." value={invoice.billNo} />
        <InfoRow label="Bill Date" value={invoice.billDate} />
        <InfoRow label="Contract" value={invoice.contract} />
        <InfoRow label="Deposit" value={invoice.deposit} />
        <InfoRow label="Billing Period" value={invoice.billingPeriod} />
      </View>

      <View style={styles.qrBox}>
        {invoice.qrImage ? (
          <Image src={invoice.qrImage} style={styles.qrImg} />
        ) : (
          null
        )}
      </View>
    </View>
  );
}