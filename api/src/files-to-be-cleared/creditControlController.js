// src/controllers/creditControlController.js

const { getConnection, runQuery } = require('../db/connectionManager');
const { sendEmail } = require('../utils/sendemail');

/**
 * IMPORTANT:
 * Frontend customer listing sends users.id.
 * customer_credit_control.customer_id stores customer.id.
 */

function formatMoney(amount) {
  return `RM ${Number(amount || 0).toFixed(2)}`;
}

function formatDate(dateValue) {
  if (!dateValue) return '-';

  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return '-';

  return d.toLocaleDateString('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getReminderLabel(stage) {
  if (stage === 'FIRST') return '1st Warning';
  if (stage === 'SECOND') return '2nd Warning';
  if (stage === 'FINAL') return 'Final Warning';
  return 'Reminder';
}

function buildReminderEmail(row, stage) {
  const warningLabel = getReminderLabel(stage);
  const isFinal = stage === 'FINAL';

  const subject = isFinal
    ? `Final Reminder: Overdue Invoice ${row.docno} - Account Barred`
    : `${warningLabel}: Overdue Invoice ${row.docno}`;

  const text = `
Dear ${row.admin_name || row.customer_name || 'Customer'},

Good day.

This is a ${warningLabel.toLowerCase()} regarding your overdue invoice. Our record shows that the following bill remains unpaid after the due date.

Invoice No.: ${row.docno}
Invoice Amount: ${formatMoney(row.docamt)}
Outstanding Amount: ${formatMoney(row.balance)}
Due Date: ${formatDate(row.duedate)}
Days Overdue: ${row.days_overdue} day(s)

${
  isFinal
    ? 'As this is the final warning, your account has been barred. Kindly arrange payment as soon as possible to avoid further service interruption.'
    : 'Kindly arrange payment as soon as possible to avoid further action.'
}

If payment has already been made, kindly ignore this reminder or contact our support team for verification.

Thank you.

Regards,
Billing Department
`;

  const html = `
<div style="font-family:Arial,sans-serif;max-width:700px;color:#1f2937;line-height:1.6">
  <p>Dear ${row.admin_name || row.customer_name || 'Customer'},</p>

  <p>Good day.</p>

  <p>
    This is a <strong>${warningLabel.toLowerCase()}</strong> regarding your overdue invoice.
    Our record shows that the following bill remains unpaid after the due date.
  </p>

  <table style="border-collapse:collapse;width:100%;margin:18px 0;border:1px solid #e5e7eb">
    <tr>
      <td style="padding:10px;background:#f9fafb;border:1px solid #e5e7eb"><strong>Invoice No.</strong></td>
      <td style="padding:10px;border:1px solid #e5e7eb">${row.docno}</td>
    </tr>
    <tr>
      <td style="padding:10px;background:#f9fafb;border:1px solid #e5e7eb"><strong>Invoice Amount</strong></td>
      <td style="padding:10px;border:1px solid #e5e7eb">${formatMoney(row.docamt)}</td>
    </tr>
    <tr>
      <td style="padding:10px;background:#f9fafb;border:1px solid #e5e7eb"><strong>Outstanding Amount</strong></td>
      <td style="padding:10px;border:1px solid #e5e7eb">${formatMoney(row.balance)}</td>
    </tr>
    <tr>
      <td style="padding:10px;background:#f9fafb;border:1px solid #e5e7eb"><strong>Due Date</strong></td>
      <td style="padding:10px;border:1px solid #e5e7eb">${formatDate(row.duedate)}</td>
    </tr>
    <tr>
      <td style="padding:10px;background:#f9fafb;border:1px solid #e5e7eb"><strong>Days Overdue</strong></td>
      <td style="padding:10px;border:1px solid #e5e7eb">${row.days_overdue} day(s)</td>
    </tr>
  </table>

  ${
    isFinal
      ? `<p style="color:#b91c1c">
          <strong>As this is the final warning, your account has been barred.</strong>
          Kindly arrange payment as soon as possible to avoid further service interruption.
        </p>`
      : `<p>Kindly arrange payment as soon as possible to avoid further action.</p>`
  }

  <p>
    If payment has already been made, kindly ignore this reminder or contact our support team for verification.
  </p>

  <p>Thank you.</p>

  <p>
    Regards,<br/>
    <strong>Billing Department</strong>
  </p>
</div>
`;

  return { subject, text, html };
}

async function getOrCreateCreditControl(db, customerId, dockey) {
  const rows = await runQuery(
    db,
    `
      SELECT *
      FROM customer_credit_control
      WHERE customer_id = $1
        AND dockey = $2
      LIMIT 1
    `,
    [customerId, dockey]
  );

  if (rows && rows.length > 0) {
    return rows[0];
  }

  const inserted = await runQuery(
    db,
    `
      INSERT INTO customer_credit_control (
        customer_id,
        dockey,
        first_reminder_sent,
        second_reminder_sent,
        final_reminder_sent,
        barred,
        created_at,
        updated_at
      )
      VALUES (
        $1,
        $2,
        FALSE,
        FALSE,
        FALSE,
        FALSE,
        NOW(),
        NOW()
      )
      RETURNING *
    `,
    [customerId, dockey]
  );

  return inserted[0];
}

async function updateCreditControlStage(db, creditControlId, stage) {
  if (stage === 'FIRST') {
    await runQuery(
      db,
      `
        UPDATE customer_credit_control
        SET
          first_reminder_sent = TRUE,
          first_reminder_date = NOW(),
          updated_at = NOW()
        WHERE id = $1
      `,
      [creditControlId]
    );
    return;
  }

  if (stage === 'SECOND') {
    await runQuery(
      db,
      `
        UPDATE customer_credit_control
        SET
          second_reminder_sent = TRUE,
          second_reminder_date = NOW(),
          updated_at = NOW()
        WHERE id = $1
      `,
      [creditControlId]
    );
    return;
  }

  if (stage === 'FINAL') {
    await runQuery(
      db,
      `
        UPDATE customer_credit_control
        SET
          final_reminder_sent = TRUE,
          final_reminder_date = NOW(),
          barred = TRUE,
          barred_date = NOW(),
          updated_at = NOW()
        WHERE id = $1
      `,
      [creditControlId]
    );
  }
}

async function updateCustomerToBarred(db, userId) {
  await runQuery(
    db,
    `
      UPDATE users
      SET acc_status = 'Barred'
      WHERE id = $1
    `,
    [userId]
  );
}

/**
 * POST /api/credit-control/customers/:id/send-reminder
 *
 * req.params.id = users.id from customer listing
 */
exports.sendCustomerReminder = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);
    const userId = Number(req.params.id);

    if (!userId || Number.isNaN(userId)) {
      return res.status(400).json({
        message: 'Invalid customer id.',
      });
    }

    /**
     * Get oldest fully unpaid invoice.
     *
     * This DOES NOT use billing_fb.vw_customer_invoice.
     * It directly follows your existing invoice controller pattern:
     * - billing_fb.ar_iv
     * - billing_fb.ar_knockoff
     * - customer.customer_code = ar_iv.code
     *
     * Current rule:
     * - cancelled invoice excluded
     * - due date required
     * - invoice amount must be more than 0
     * - paymentamt must be 0
     * - knockoff payment must be 0
     */
    const rows = await runQuery(
      db,
      `
        WITH unpaid_invoice AS (
          SELECT
            iv.dockey,
            iv.docno,
            iv.code AS customer_code,
            iv.docdate,
            iv.duedate,
            iv.localdocamt AS docamt,
            COALESCE(iv.paymentamt, 0) AS paymentamt,
            COALESCE(SUM(k.localkoamt), 0) AS total_knockoff,
            iv.localdocamt - COALESCE(SUM(k.localkoamt), 0) AS balance
          FROM billing_fb.ar_iv iv
          LEFT JOIN billing_fb.ar_knockoff k
            ON k.todockey = iv.dockey
           AND k.todoctype = 'IV'
           AND k.fromdoctype IN ('PM', 'CN')
          WHERE iv.cancelled IS NOT TRUE
            AND iv.duedate IS NOT NULL
            AND COALESCE(iv.localdocamt, 0) > 0
            AND COALESCE(iv.paymentamt, 0) = 0
          GROUP BY
            iv.dockey,
            iv.docno,
            iv.code,
            iv.docdate,
            iv.duedate,
            iv.localdocamt,
            iv.paymentamt
          HAVING COALESCE(SUM(k.localkoamt), 0) = 0
          ORDER BY iv.duedate ASC, iv.dockey ASC
        )
        SELECT
          u.id AS user_id,
          u.name AS customer_name,
          u.email AS user_email,
          u.acc_status AS customer_status,

          c.id AS customer_id,
          c.customer_code,
          c.admin_email,
          c.admin_name,
          c.admin_contact,

          inv.dockey,
          inv.docno,
          inv.docdate,
          inv.duedate,
          inv.docamt,
          inv.paymentamt,
          inv.total_knockoff,
          inv.balance,

          (CURRENT_DATE - inv.duedate) AS days_overdue,

          ccc.id AS credit_control_id,
          COALESCE(ccc.first_reminder_sent, FALSE) AS first_reminder_sent,
          COALESCE(ccc.second_reminder_sent, FALSE) AS second_reminder_sent,
          COALESCE(ccc.final_reminder_sent, FALSE) AS final_reminder_sent,
          COALESCE(ccc.barred, FALSE) AS barred

        FROM users u
        JOIN customer c
          ON c.user_id = u.id
        JOIN unpaid_invoice inv
          ON inv.customer_code = c.customer_code
        LEFT JOIN customer_credit_control ccc
          ON ccc.customer_id = c.id
         AND ccc.dockey = inv.dockey
        WHERE u.id = $1
        ORDER BY inv.duedate ASC, inv.dockey ASC
        LIMIT 1
      `,
      [userId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        message: 'No unpaid overdue billing found for this customer.',
      });
    }

    const row = rows[0];

    if (String(row.customer_status || '').toLowerCase() === 'barred') {
      return res.status(400).json({
        message: 'Customer is already barred.',
      });
    }

    const emailTo = row.admin_email || row.user_email;

    if (!emailTo) {
      return res.status(400).json({
        message: 'Customer email is empty. Cannot send reminder.',
      });
    }

    const daysOverdue = Number(row.days_overdue || 0);

    let stage = null;

    if (!row.first_reminder_sent && daysOverdue >= 16) {
      stage = 'FIRST';
    } else if (
      row.first_reminder_sent &&
      !row.second_reminder_sent &&
      daysOverdue >= 23
    ) {
      stage = 'SECOND';
    } else if (
      row.second_reminder_sent &&
      !row.final_reminder_sent &&
      daysOverdue >= 26
    ) {
      stage = 'FINAL';
    }

    if (!stage) {
      return res.status(400).json({
        message: `No reminder is due yet. Current overdue day is ${daysOverdue}.`,
        docno: row.docno,
        dockey: row.dockey,
        days_overdue: daysOverdue,
        first_reminder_sent: row.first_reminder_sent,
        second_reminder_sent: row.second_reminder_sent,
        final_reminder_sent: row.final_reminder_sent,
      });
    }

    const creditControl = await getOrCreateCreditControl(
      db,
      row.customer_id,
      row.dockey
    );

    const email = buildReminderEmail(row, stage);

    await sendEmail({
      to: emailTo,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });

    await updateCreditControlStage(db, creditControl.id, stage);

    let barred = false;

    if (stage === 'FINAL') {
      await updateCustomerToBarred(db, row.user_id);
      barred = true;
    }

    return res.status(200).json({
      message: barred
        ? 'Final reminder email sent successfully. Customer has been barred.'
        : `${getReminderLabel(stage)} email sent successfully.`,
      stage,
      docno: row.docno,
      dockey: row.dockey,
      email_to: emailTo,
      days_overdue: daysOverdue,
      barred,
    });
  } catch (err) {
    console.error('sendCustomerReminder error:', err);

    return res.status(500).json({
      message: 'Failed to send customer reminder.',
      error: err.message,
    });
  }
};