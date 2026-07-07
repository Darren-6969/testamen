import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    // marginTop: 8,
    lineHeight: 0.61,
  },
  logo: { width: 112, height: 37, marginVertical: 'auto' },
  right: {
    flex: 1,
    textAlign: 'right',
    paddingLeft: 10,
    fontFamily: 'Times',
  },
  name: { fontSize: 13, fontWeight: 'bold', marginBottom: 3 },
  line: { fontSize: 9 },
  title: {
    marginTop: 4,
    marginBottom: 18,
    fontSize: 10,
    fontFamily: 'Times',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default function InvoiceHeader({ company, title, logoSrc }) {
  if (!company) return null;

  return (
    <>
      <View style={styles.row}>
        <Image src={logoSrc} style={styles.logo} />
        <View style={styles.right}>
          <Text style={styles.name}>{company.COMPANYNAME}</Text>
          <Text style={[styles.line, { fontStyle: 'italic' }]}>
            SSM Registration No. {company.BRN2} ({company.BRN})
          </Text>
          <Text style={styles.line}>{company.ADDRESS}</Text>
          <Text style={styles.line}>(ST NO: {company.SERVICETAXNO})</Text>
          <Text style={styles.line}>
            Tel: {company.TEL} &nbsp; Fax: {company.FAX} &nbsp; Handphone: {company.HP}
          </Text>
          <Text style={styles.line}>Email: {company.EMAIL}</Text>
        </View>
      </View>

      {title ? <Text style={styles.title}>{title}</Text> : null}
    </>
  );
}
