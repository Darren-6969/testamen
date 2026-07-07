import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import InvoiceHeader from './InvoiceHeader';

const GRAY = "#a8a8a8";
const BORDER = "#000";

const styles = StyleSheet.create({
  page: {
    paddingVertical: 26,
    paddingHorizontal: 43,
    fontSize: 8.5,
    fontFamily: 'Times',
    lineHeight: 1.2,
  },

  fixedLineBar: {
    backgroundColor: GRAY,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 2,
    paddingHorizontal: 6,
    width: 90,
    marginBottom: 12,
  },

  fixedLineText: {
    fontSize: 9,
    fontWeight: "bold",
  },

  phoneRow: {
    flexDirection: "row",
    marginBottom: 10,
    fontSize: 9,
    marginLeft: 2,
  },

  phoneLabel: { width: 80, fontWeight: "bold" },
  phoneColon: { width: 10 },
  phoneValue: { fontWeight: "bold" },

  tableTitle: {
    textAlign: "center",
    fontSize: 8,
    fontWeight: "bold",
  },

  tableHeader: {
    flexDirection: "row",
    fontSize: 8,
    fontWeight: "bold",
  },

  row: {
    flexDirection: "row",
    fontSize: 8,
  },

  colDate: { width: "20%", textAlign: "center" },
  colTo: { width: "20%", textAlign: "center" },
  colTime: { width: "20%", textAlign: "center" },
  colDur: { width: "20%", textAlign: "center" },
  colAmt: { width: "20%", textAlign: "center" },

  summaryRow: {
    flexDirection: "row",
    marginTop: 2,
    fontSize: 8,
    fontWeight: "bold",
  },

  amountFooter: {
    marginTop: 20,
    textAlign: "right",
    fontSize: 11,
    fontWeight: "bold",
  },
  boldText: {
    fontWeight: "bold",
  },

  divider: {
    borderBottomWidth: 1.2,
    borderColor: BORDER,
    marginVertical: 6,
  },

  tableBlock: {
    marginBottom: 6,
  },
});

function CallTableChunk({ title, data, chunk, showSummary }) {
  const isLocalSection = title === 'Local Calls';
  const localUnitsRaw = Number(data.total || 0) / 0.04;
  const localUnits = Number.isInteger(localUnitsRaw) ? String(localUnitsRaw) : localUnitsRaw.toFixed(2);
  const totalDurationSec = Number(data.duration || 0);
  const localHours = String(Math.floor(totalDurationSec / 3600)).padStart(2, '0');
  const localMins = String(Math.floor((totalDurationSec % 3600) / 60)).padStart(2, '0');
  const localSecs = String(totalDurationSec % 60).padStart(2, '0');
  return (
    <View style={styles.tableBlock}>
      <Text style={styles.tableTitle}>{title}</Text>

      <View style={styles.tableHeader}>
        <Text style={styles.colDate}>Date</Text>
        <Text style={styles.colTo}>Number Called</Text>
        <Text style={styles.colTime}>Time</Text>
        <Text style={styles.colDur}>Duration</Text>
        <Text style={styles.colAmt}>Amount(RM)</Text>
      </View>

      {isLocalSection ? (
        <>
          <View style={styles.row}>
            <Text style={styles.colDate}></Text>
            <Text style={styles.colTo}>KUCHING</Text>
            <Text style={styles.colTime}></Text>
            <Text style={styles.colDur}>{localUnits} UNITS</Text>
            <Text style={styles.colAmt}></Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.colDate}></Text>
            <Text style={styles.colTo}></Text>
            <Text style={styles.colTime}></Text>
            <Text style={styles.colDur}>{localHours}:{localMins}:{localSecs}</Text>
            <Text style={[styles.colAmt, styles.boldText]}>{Number(data.total || 0).toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.colDate}>{data.count} CALLS</Text>
            <Text style={styles.colTo}></Text>
            <Text style={styles.colTime}></Text>
            <Text style={styles.colDur}></Text>
            <Text style={styles.colAmt}></Text>
          </View>
        </>
      ) : (
        <>
          {chunk.map((c, i) => (
            <View key={`${title}-${i}`} style={styles.row}>
              <Text style={styles.colDate}>{c.date}</Text>
              <Text style={styles.colTo}>{c.to}</Text>
              <Text style={styles.colTime}>{c.time}</Text>
              <Text style={styles.colDur}>{c.duration}</Text>
              <Text style={styles.colAmt}>{Number(c.amount || 0).toFixed(2)}</Text>
            </View>
          ))}

          {showSummary && (
            <View style={styles.summaryRow}>
              <Text style={styles.colDate}>{data.count} CALLS</Text>
              <Text style={styles.colTo}></Text>
              <Text style={styles.colTime}></Text>
              <Text style={styles.colDur}></Text>
              <Text style={styles.colAmt}>{Number(data.total || 0).toFixed(2)}</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

function buildPhonePages(phone) {
  // Planner that keeps sections on same page when possible, and only continues when full.
  const PAGE_ROW_CAPACITY = 58;
  const PHONE_HEADER_ROWS = 5;
  const SECTION_HEADER_ROWS = 2;
  const SUMMARY_ROWS = 1;

  const sections = [
    { key: 'local', title: 'Local Calls' },
    { key: 'trunk', title: 'Trunk Calls' },
    { key: 'mobile', title: 'Mobile Calls' },
    { key: 'international', title: 'International Calls' },
  ];
  const sectionHasData = (data = {}) =>
    (data.calls || []).length > 0 ||
    Number(data.count || 0) > 0 ||
    Number(data.total || 0) > 0 ||
    Number(data.duration || 0) > 0;
  const hasAnyCallRecords = sections.some((section) => sectionHasData(phone?.[section.key]));

  const pages = [{ showPhoneHeader: true, blocks: [], usedRows: PHONE_HEADER_ROWS }];

  const pushNewPage = () => {
    pages.push({ showPhoneHeader: false, blocks: [], usedRows: 0 });
  };

  const ensureSpace = (neededRows) => {
    const current = pages[pages.length - 1];
    if (current.usedRows + neededRows > PAGE_ROW_CAPACITY) {
      pushNewPage();
    }
  };

  sections.forEach((section) => {
    const data = phone?.[section.key] || { calls: [], count: 0, total: 0 };
    const calls = data.calls || [];
    const hasData = sectionHasData(data);

    if (!hasAnyCallRecords) return;

    if (section.key === 'local') {
      // Legacy local section is summarized only (no per-call rows).
      const LOCAL_SUMMARY_ROWS = 3;
      const needed = SECTION_HEADER_ROWS + LOCAL_SUMMARY_ROWS;
      ensureSpace(needed);
      const current = pages[pages.length - 1];
      current.blocks.push({
        title: section.title,
        data,
        chunk: [],
        showSummary: true,
      });
      current.usedRows += needed;
      return;
    }

    if (!calls.length) {
      const needed = SECTION_HEADER_ROWS + SUMMARY_ROWS;
      ensureSpace(needed);
      const current = pages[pages.length - 1];
      current.blocks.push({
        title: section.title,
        data,
        chunk: [],
        showSummary: true,
      });
      current.usedRows += needed;
      return;
    }

    let index = 0;
    while (index < calls.length) {
      ensureSpace(SECTION_HEADER_ROWS + 1);

      let current = pages[pages.length - 1];
      const remainingRows = PAGE_ROW_CAPACITY - current.usedRows;
      const rowsForCalls = remainingRows - SECTION_HEADER_ROWS;
      const remainingCalls = calls.length - index;

      let take = remainingCalls;
      let showSummary = false;

      if (remainingCalls + SUMMARY_ROWS <= rowsForCalls) {
        showSummary = true;
      } else {
        take = rowsForCalls;
      }

      if (take <= 0) {
        pushNewPage();
        continue;
      }

      const chunk = calls.slice(index, index + take);
      current.blocks.push({
        title: section.title,
        data,
        chunk,
        showSummary,
      });

      current.usedRows += SECTION_HEADER_ROWS + take + (showSummary ? SUMMARY_ROWS : 0);
      index += take;
    }
  });

  if (!pages.some((p) => p.blocks.length > 0)) {
    sections.forEach((section) => {
      pages[0].blocks.push({
        title: section.title,
        data: { calls: [], count: 0, total: 0, duration: 0 },
        chunk: [],
        showSummary: true,
      });
      pages[0].usedRows += SECTION_HEADER_ROWS + (section.key === 'local' ? 3 : SUMMARY_ROWS);
    });
  }

  pages[pages.length - 1].isLastPhonePage = true;
  return pages;
}

export default function CallDetailSection({ cdr, company }) {
  if (!company) return null;
  if (!cdr?.phones?.length) return null;

  return (
    <>
      {cdr.phones.map((phone, phoneIdx) => {
        const phonePages = buildPhonePages(phone);

        return phonePages.map((page, pageIdx) => (
          <Page key={`${phoneIdx}-${pageIdx}`} size="A4" style={styles.page}>
            <InvoiceHeader company={company} title="INVOICE" />

            <View>
              {page.showPhoneHeader && (
                <>
                  <View style={styles.fixedLineBar}>
                    <Text style={styles.fixedLineText}>Fixed Line</Text>
                  </View>

                  <View style={styles.phoneRow}>
                    <Text style={styles.phoneLabel}>Phone Number</Text>
                    <Text style={styles.phoneColon}>:</Text>
                    <Text style={styles.phoneValue}>{phone.phoneNumber}</Text>
                  </View>
                </>
              )}

              {page.blocks.map((block, blockIdx) => (
                <CallTableChunk
                  key={`${phoneIdx}-${pageIdx}-${block.title}-${blockIdx}`}
                  title={block.title}
                  data={block.data}
                  chunk={block.chunk}
                  showSummary={block.showSummary}
                />
              ))}

              {page.isLastPhonePage && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.amountFooter}>
                    AMOUNT: RM {Number(phone.totalAmount || 0).toFixed(2)}
                  </Text>
                </>
              )}
            </View>
          </Page>
        ));
      })}
    </>
  );
}
