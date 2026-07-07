import { Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import InvoiceHeader from './InvoiceHeader';

const GRAY = '#A8A8A8';
const BORDER = '#000';

const styles = StyleSheet.create({
	page: {
    paddingVertical: 26,
    paddingHorizontal: 43,
    fontSize: 8.5,
    lineHeight: 1.2,
    fontFamily: 'Helvetica',
  },

	cutLine: {
		width: '100%',
		borderBottomWidth: 2,
		borderBottomColor: BORDER,
		marginTop: 10,
	},

	paragraph: {
		marginTop: 30,
	},

	paragraphLargeGap: {
		marginTop: 20,
	},

	paragraphDigital: {
		marginTop: 30,
		textAlign: 'center',
	},

	sectionHeader: {
		borderWidth: 1,
		borderColor: BORDER,
		backgroundColor: GRAY,
		paddingVertical: 4,
	},

	sectionHeaderText: {
		textAlign: 'center',
	},
});

export default function PaymentOptionsPage({ company }) {
	if (!company) return null;

	return (
		<Page size="A4" style={styles.page}>
			<InvoiceHeader company={company} title="INVOICE" />

			{/* PAYMENT OPTIONS HEADER */}
			<View style={styles.sectionHeader}>
				<Text style={styles.sectionHeaderText}>PAYMENT OPTIONS</Text>
			</View>

			{/* CHEQUE INFO */}
			<Text style={styles.paragraph}>
				Your cheque should be made payable to{' '}
				<Text style={{ fontWeight: 'bold' }}>
					Reach Ten Multimedia Sdn Bhd
				</Text>
				{'\n'}
				Attach your cheque to the bottom part of this statement, write your
				account number on the back of the cheque
			</Text>

			{/* MAIL TO */}
			<Text style={styles.paragraphLargeGap}>
				Mail your cheque to :
			</Text>

			<Text style={styles.paragraphLargeGap}>
				Reach Ten Multimedia Sdn Bhd{'\n'}
				AT612, Level 6, Tower A1,{'\n'}
				ICOM Square, Jln. Pending,{'\n'}
				93450 Kuching, Sarawak.
			</Text>

			{/* ALTERNATIVE PAYMENT */}
			<Text style={styles.paragraphLargeGap}>
				ALTERNATIVE PAYMENT METHODS:{'\n'}
				Pay by cash/cheque at following bank.
			</Text>

			<Text style={styles.paragraphLargeGap}>
				<Text style={{ fontWeight: 'bold' }}>
					Bank: Malayan Banking Berhad (Maybank)
				</Text>
				{'\n'}
				Remarks: Counter-cash or cheque (payable to{' '}
				<Text style={{ fontWeight: 'bold' }}>
					"Reach Ten Multimedia Sdn Bhd"
				</Text>
				).{'\n'}
				All payments at Maybank should be credited to account number{' '}
				<Text style={{ fontWeight: 'bold' }}>
					"5112 3400 9044"
				</Text>
				.{'\n'}
				<Text style={{ fontWeight: 'bold' }}>
					Ensure to Facsimile the obtain bank in slip to 082-266 566 or forward
					via WhatsApp at 0111-089 0566 or scan and email to
					account@reach10.com.
				</Text>
			</Text>

			{/* CHANGE OF ADDRESS HEADER */}
			<View style={styles.sectionHeader}>
				<Text style={styles.sectionHeaderText}>
					CHANGE OF ADDRESS / TECHNICAL INQUIRIES
				</Text>
			</View>

			{/* FOOT NOTE */}
			<Text style={styles.paragraphLargeGap}>
				For enquiries, please do not hesitate to contact us at 082-266 888.
			</Text>

			<Text style={styles.paragraphDigital}>
				This is a computer generated document, no signature is required.
			</Text>
		</Page>
	);
}
