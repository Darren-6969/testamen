// components/pdf/InvoiceLayout.js
import { Page, Text, View, Document, StyleSheet, Image } from "@react-pdf/renderer";
import { registerPdfFonts, resolvePdfAssetSrc } from './fonts';
import InvoiceHeader from './InvoiceHeader';
import TotalsTable from './TotalsTable';
import BillDetail from './BillDetail';
import SummarySection from './SummarySection';
import { buildInvoiceSummary } from "../../app/utils/buildInvoiceSummary";
import PaymentOptionsPage from './PaymentOptionsSection';
import CallDetailSection from './CallDetailSection';

const styles = StyleSheet.create({
  page: {
    paddingVertical: 27,
    paddingHorizontal: 43,
    fontSize: 8.5,
    lineHeight: 1.2,
    fontFamily: 'Helvetica',
  },

  logo: { width: 112, height: 37, marginVertical: 'auto' },


  // SECTION BARS
  bar: {
    marginTop: 9,
    borderBottomWidth: 1.2,
    borderColor: '#000',
    paddingHorizontal: 1,
  },

  barText: {
    fontSize: 8.8,
    fontWeight: 'bold',
  },


  // PAYMENT SLIP
  paymentTitle: {
    fontFamily: 'Times',
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 4,
  },

  payRow: { flexDirection: "row", justifyContent: "space-between" },
  payLeft: { width: "50%" },
  payRight: { width: "50%" },

  payLogoRow: { flexDirection: "row", alignItems: "center", marginBottom: 15 },

  payAddrLine: {
    fontSize: 8,
  },

  payInfoRow: { flexDirection: "row", marginBottom: 2 },
  payInfoLabel: { width: 85, fontSize: 8.2 },
  payInfoValue: { flex: 1, fontSize: 8.2 },

  attnRow: { flexDirection: "row", marginTop: 6 },
  attnLabel: { width: 20, fontSize: 8.2 },
  attnValue: { flex: 1, fontSize: 8.2 },

  payFoot: { marginTop: 8, fontSize: 8.5, borderTopWidth: 1.2, paddingTop: 9 },

});

export default function InvoiceLayout({ invoice, company, assetBaseUrl = '' }) {
  registerPdfFonts(assetBaseUrl);

  const inv = { ...(invoice ?? {}) };
  const comp = { ...(company ?? {}) };
  const sum = { ...(inv.summary ?? {}) };
  const summaryRows = buildInvoiceSummary(sum);
  const logoSrc = resolvePdfAssetSrc('/reach10_new.jpg', assetBaseUrl);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <InvoiceHeader company={comp} title="INVOICE" logoSrc={logoSrc} />

        <BillDetail invoice={inv} />

        {/* TOTALS table section */}
        <TotalsTable
          overdueAmount={inv.overdueAmount}
          dueDate={inv.currentChargesDueDate}
          totalAmount={inv.totalAmountDue}
          style={{ marginTop: 6 }}
        />

        {/* SUMMARY OF CHARGE */}
        <View style={styles.bar}>
          <Text style={styles.barText}>SUMMARY OF CHARGE</Text>
        </View>

        <SummarySection
          rows={summaryRows}
          totalAmountDue={inv.totalAmountDue}
          overdueAmount={inv.overdueAmount}
        />

        {/* PAYMENT SLIP (same page) */}
        <Text style={styles.paymentTitle}>PAYMENT SLIP</Text>

        <View style={styles.payLogoRow}>
          <Image src={logoSrc} style={styles.logo} />
        </View>
		
        <View style={styles.payRow}>
          <View style={styles.payLeft}>

            {(inv.customerAddressLines || []).map((line, i) => (
              <Text key={i} style={styles.payAddrLine}>{line}</Text>
            ))}
          </View>

          <View style={styles.payRight}>
            <View style={styles.payInfoRow}>
              <Text style={styles.payInfoLabel}>Account Number</Text>
              <Text style={styles.payInfoValue}>{inv.accountNo}</Text>
            </View>
            <View style={styles.payInfoRow}>
              <Text style={styles.payInfoLabel}>Account Name</Text>
              <Text style={styles.payInfoValue}>{inv.accountName}</Text>
            </View>
          </View>
        </View>

        <View style={styles.attnRow}>
          <Text style={styles.attnLabel}>Attn:</Text>
          <Text style={styles.attnValue}>{inv.attn || ""}</Text>
        </View>

        <View wrap={false}>
          {/* Payment slip totals bar */}
          <TotalsTable
            overdueAmount={inv.overdueAmount}
            dueDate={inv.currentChargesDueDate}
            totalAmount={inv.totalAmountDue}
          />

          <Text style={styles.payFoot}>
            For Mail-in payment, please detach and send this portion together with your cheque/postal/money order payment.
            Please do not staple.
          </Text>
        </View>
      </Page>

      <PaymentOptionsPage company={comp} />

      <CallDetailSection cdr={inv.cdr} company={comp} />    
    </Document>
  );
}


