-- =============================================================
-- Performance Indexes for reach10_app
-- Addresses slow queries on people (customers), billing (invoices),
-- and payment pages caused by unindexed JOIN and WHERE columns.
-- =============================================================

-- -------------------------
-- customer table
-- -------------------------

-- customer.user_id  →  used in every JOIN: customer c ON c.user_id = u.id
CREATE INDEX IF NOT EXISTS idx_customer_user_id
    ON public.customer (user_id);

-- customer.customer_code  →  JOIN with payment_pending ON customer_code
CREATE INDEX IF NOT EXISTS idx_customer_customer_code
    ON public.customer (customer_code);

-- customer.package  →  JOIN: package p ON p.id = c.package
CREATE INDEX IF NOT EXISTS idx_customer_package
    ON public.customer (package);

-- customer.customer_group_id  →  GROUP / JOIN usage
CREATE INDEX IF NOT EXISTS idx_customer_customer_group_id
    ON public.customer (customer_group_id);

-- -------------------------
-- users table
-- -------------------------

-- users.status_id  →  WHERE users.status_id = 2  (customer filter, staff filter)
CREATE INDEX IF NOT EXISTS idx_users_status_id
    ON public.users (status_id);

-- users.role_id  →  JOIN: user_role ur ON u.role_id = ur.id
CREATE INDEX IF NOT EXISTS idx_users_role_id
    ON public.users (role_id);

-- -------------------------
-- payment_pending table
-- -------------------------

-- payment_pending.created_at  →  ORDER BY pp.created_at DESC (all payment list queries)
CREATE INDEX IF NOT EXISTS idx_payment_pending_created_at
    ON public.payment_pending (created_at DESC);

-- payment_pending.deleted_at  →  WHERE pp.deleted_at IS NULL (soft-delete filter)
-- Partial index: only indexes live rows, keeping it small and fast.
CREATE INDEX IF NOT EXISTS idx_payment_pending_deleted_at_null
    ON public.payment_pending (id)
    WHERE deleted_at IS NULL;

-- -------------------------
-- payment_items table
-- -------------------------

-- payment_items.deleted_at  →  LEFT JOIN ... AND pi.deleted_at IS NULL
CREATE INDEX IF NOT EXISTS idx_payment_items_deleted_at_null
    ON public.payment_items (payment_id)
    WHERE deleted_at IS NULL;

-- -------------------------
-- activation table
-- -------------------------

-- activation.customer_id  →  JOIN users/customer ON a.customer_id
CREATE INDEX IF NOT EXISTS idx_activation_customer_id
    ON public.activation (customer_id);

-- activation.package_id  →  JOIN package ON a.package_id
CREATE INDEX IF NOT EXISTS idx_activation_package_id
    ON public.activation (package_id);

-- activation.staff_id  →  JOIN users ON a.staff_id
CREATE INDEX IF NOT EXISTS idx_activation_staff_id
    ON public.activation (staff_id);

-- -------------------------
-- branch_package table
-- -------------------------

-- branch_package.branch_id  →  JOIN: branch_package bp ON b.id = bp.branch_id
CREATE INDEX IF NOT EXISTS idx_branch_package_branch_id
    ON public.branch_package (branch_id);

-- branch_package.package_id  →  JOIN: customer c ON c.package = bp.package_id
CREATE INDEX IF NOT EXISTS idx_branch_package_package_id
    ON public.branch_package (package_id);

-- -------------------------
-- notification table
-- -------------------------

-- notification.user_id  →  WHERE / JOIN: notification WHERE user_id = $1
CREATE INDEX IF NOT EXISTS idx_notification_user_id
    ON public.notification (user_id);

-- notification unread fast lookup
CREATE INDEX IF NOT EXISTS idx_notification_user_unread
    ON public.notification (user_id, read)
    WHERE read = false;

-- cursor pagination: notifications per user
CREATE INDEX IF NOT EXISTS idx_notification_cursor
    ON public.notification (user_id, id DESC);

-- ========================
-- users (extended)
-- ========================

CREATE INDEX IF NOT EXISTS idx_users_username
    ON public.users (username);

CREATE INDEX IF NOT EXISTS idx_users_acc_status
    ON public.users (acc_status);

-- cursor pagination: list users
CREATE INDEX IF NOT EXISTS idx_users_cursor
    ON public.users (created_at DESC, id DESC);

-- ========================
-- staff
-- ========================

CREATE INDEX IF NOT EXISTS idx_staff_user_id
    ON public.staff (user_id);

CREATE INDEX IF NOT EXISTS idx_staff_status
    ON public.staff (status);

-- cursor pagination
CREATE INDEX IF NOT EXISTS idx_staff_cursor
    ON public.staff (id DESC);

-- ========================
-- customer (extended)
-- ========================

CREATE INDEX IF NOT EXISTS idx_customer_status
    ON public.customer (status);

-- cursor pagination
CREATE INDEX IF NOT EXISTS idx_customer_cursor
    ON public.customer (id DESC);

-- ========================
-- customer_groups
-- ========================

CREATE INDEX IF NOT EXISTS idx_customer_groups_code
    ON public.customer_groups (code);

CREATE INDEX IF NOT EXISTS idx_customer_groups_cursor
    ON public.customer_groups (created_at DESC, id DESC);

-- ========================
-- activation (extended)
-- ========================

CREATE INDEX IF NOT EXISTS idx_activation_status
    ON public.activation (status);

CREATE INDEX IF NOT EXISTS idx_activation_display_status
    ON public.activation (display_status);

-- cursor pagination: list activations sorted by install_date DESC, id DESC
CREATE INDEX IF NOT EXISTS idx_activation_cursor
    ON public.activation (install_date DESC, id DESC);

-- cursor by customer (report / filter per customer)
CREATE INDEX IF NOT EXISTS idx_activation_customer_cursor
    ON public.activation (customer_id, install_date DESC, id DESC);

-- ========================
-- payment_pending (extended)
-- ========================

CREATE INDEX IF NOT EXISTS idx_payment_pending_customer_code
    ON public.payment_pending (customer_code);

-- status-filtered list (pending only), partial
CREATE INDEX IF NOT EXISTS idx_payment_pending_status
    ON public.payment_pending (status)
    WHERE deleted_at IS NULL;

-- cursor pagination: all payments list
CREATE INDEX IF NOT EXISTS idx_payment_pending_cursor
    ON public.payment_pending (created_at DESC, id DESC)
    WHERE deleted_at IS NULL;

-- cursor by customer
CREATE INDEX IF NOT EXISTS idx_payment_pending_customer_cursor
    ON public.payment_pending (customer_code, created_at DESC, id DESC)
    WHERE deleted_at IS NULL;

-- cursor filtered by status (pending list)
CREATE INDEX IF NOT EXISTS idx_payment_pending_status_cursor
    ON public.payment_pending (status, created_at DESC, id DESC)
    WHERE deleted_at IS NULL;

-- ========================
-- payment_items (extended)
-- ========================

CREATE INDEX IF NOT EXISTS idx_payment_items_invoice_docno
    ON public.payment_items (invoice_docno)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_payment_items_invoice_dockey
    ON public.payment_items (invoice_dockey)
    WHERE deleted_at IS NULL;

-- ========================
-- content
-- ========================

CREATE INDEX IF NOT EXISTS idx_content_display_status
    ON public.content (display_status);

CREATE INDEX IF NOT EXISTS idx_content_dates
    ON public.content (start_date, end_date);

-- cursor pagination
CREATE INDEX IF NOT EXISTS idx_content_cursor
    ON public.content (id DESC);

-- ========================
-- branch
-- ========================

CREATE INDEX IF NOT EXISTS idx_branch_status
    ON public.branch (status);

CREATE INDEX IF NOT EXISTS idx_branch_code
    ON public.branch (branch_code);

-- ========================
-- package
-- ========================

CREATE INDEX IF NOT EXISTS idx_package_code
    ON public.package (package_code);

-- ========================
-- devices
-- ========================

CREATE INDEX IF NOT EXISTS idx_devices_status
    ON public.devices (status);

CREATE INDEX IF NOT EXISTS idx_devices_code
    ON public.devices (device_code);

-- ========================
-- audit_log
-- ========================

-- cursor pagination: sorted by event_time DESC, id DESC
CREATE INDEX IF NOT EXISTS idx_audit_log_cursor
    ON public.audit_log (event_time DESC, id DESC);

-- filter by actor
CREATE INDEX IF NOT EXISTS idx_audit_log_actor
    ON public.audit_log (actor_user_id, event_time DESC);

-- filter by entity table (e.g. "customer", "payment_pending")
CREATE INDEX IF NOT EXISTS idx_audit_log_entity
    ON public.audit_log (entity_table, event_time DESC);

-- filter by module
CREATE INDEX IF NOT EXISTS idx_audit_log_module
    ON public.audit_log (module, event_time DESC);

-- ========================
-- role_module_access
-- ========================

CREATE INDEX IF NOT EXISTS idx_role_module_access_role_id
    ON public.role_module_access (role_id);

CREATE INDEX IF NOT EXISTS idx_role_module_access_module_id
    ON public.role_module_access (module_id);

-- ========================
-- user_module_access
-- ========================

CREATE INDEX IF NOT EXISTS idx_user_module_access_user_id
    ON public.user_module_access (user_id);

CREATE INDEX IF NOT EXISTS idx_user_module_access_group_id
    ON public.user_module_access (group_id);

-- ========================
-- user_submodule_access
-- ========================

CREATE INDEX IF NOT EXISTS idx_user_submodule_access_user_id
    ON public.user_submodule_access (user_id);

CREATE INDEX IF NOT EXISTS idx_user_submodule_access_submodule_id
    ON public.user_submodule_access (submodule_id);

-- ========================
-- password_resets
-- ========================

CREATE INDEX IF NOT EXISTS idx_password_resets_user_id
    ON public.password_resets (user_id)
    WHERE used = false;

CREATE INDEX IF NOT EXISTS idx_password_resets_token
    ON public.password_resets (token)
    WHERE used = false;


-- =============================================================================
-- SCHEMA: billing_fb
-- All tables sorted by: docdate DESC, dockey DESC  (cursor pattern)
-- =============================================================================

-- ========================
-- ar_iv (invoices)
-- ========================

-- full list cursor
CREATE INDEX IF NOT EXISTS idx_ar_iv_cursor
    ON billing_fb.ar_iv (docdate DESC, dockey DESC);

-- list active only
CREATE INDEX IF NOT EXISTS idx_ar_iv_active_cursor
    ON billing_fb.ar_iv (docdate DESC, dockey DESC)
    WHERE cancelled IS NOT TRUE;

-- open invoices per customer
CREATE INDEX IF NOT EXISTS idx_ar_iv_code_cursor
    ON billing_fb.ar_iv (code, docdate DESC, dockey DESC);

-- active invoices per customer
CREATE INDEX IF NOT EXISTS idx_ar_iv_code_active_cursor
    ON billing_fb.ar_iv (code, docdate DESC, dockey DESC)
    WHERE cancelled IS NOT TRUE;

-- ========================
-- ar_ivdtl (invoice lines)
-- ========================

CREATE INDEX IF NOT EXISTS idx_ar_ivdtl_dockey
    ON billing_fb.ar_ivdtl (dockey);

-- ========================
-- ar_cn (credit notes)
-- ========================

CREATE INDEX IF NOT EXISTS idx_ar_cn_active_cursor
    ON billing_fb.ar_cn (docdate DESC, dockey DESC)
    WHERE cancelled IS NOT TRUE;

CREATE INDEX IF NOT EXISTS idx_ar_cn_code_active_cursor
    ON billing_fb.ar_cn (code, docdate DESC, dockey DESC)
    WHERE cancelled IS NOT TRUE;

-- ========================
-- ar_dn (debit notes)
-- ========================

CREATE INDEX IF NOT EXISTS idx_ar_dn_active_cursor
    ON billing_fb.ar_dn (docdate DESC, dockey DESC)
    WHERE cancelled IS NOT TRUE;

CREATE INDEX IF NOT EXISTS idx_ar_dn_code_active_cursor
    ON billing_fb.ar_dn (code, docdate DESC, dockey DESC)
    WHERE cancelled IS NOT TRUE;

-- ========================
-- ar_pm (payments/receipts)
-- ========================

CREATE INDEX IF NOT EXISTS idx_ar_pm_active_cursor
    ON billing_fb.ar_pm (docdate DESC, dockey DESC)
    WHERE cancelled IS NOT TRUE;

CREATE INDEX IF NOT EXISTS idx_ar_pm_code_active_cursor
    ON billing_fb.ar_pm (code, docdate DESC, dockey DESC)
    WHERE cancelled IS NOT TRUE;

-- ========================
-- ar_knockoff
-- Used heavily in both directions for invoice ↔ payment linkage
-- ========================

-- lookup: which payments knocked off an invoice (todockey)
CREATE INDEX IF NOT EXISTS idx_ar_knockoff_todockey
    ON billing_fb.ar_knockoff (todockey, todoctype, fromdoctype);

-- lookup: which invoices a payment knocked off (fromdockey)
CREATE INDEX IF NOT EXISTS idx_ar_knockoff_fromdockey
    ON billing_fb.ar_knockoff (fromdockey, fromdoctype, todoctype);

-- ========================
-- ar_customer
-- Always joined by code — make it unique index (acts as fast PK lookup)
-- ========================

CREATE UNIQUE INDEX IF NOT EXISTS idx_ar_customer_code
    ON billing_fb.ar_customer (code);

-- ========================
-- ar_customerbranch
-- DISTINCT ON (code) ORDER BY code, dtlkey pattern
-- ========================

CREATE INDEX IF NOT EXISTS idx_ar_customerbranch_code_dtlkey
    ON billing_fb.ar_customerbranch (code, dtlkey);

-- ========================
-- gl_acc
-- Lookup by code for payment method description
-- ========================

CREATE UNIQUE INDEX IF NOT EXISTS idx_gl_acc_code
    ON billing_fb.gl_acc (code);

-- gl_trans already indexed in billing_fb.sql (code, docdate, dockey)
-- sy_profile is a single-row config table — no index needed


-- =============================================================================
-- SCHEMA: reach10_mysql
-- =============================================================================

-- ========================
-- site_setting
-- ========================

CREATE INDEX IF NOT EXISTS idx_site_setting_site_code
    ON reach10_mysql.site_setting (site_code);

CREATE INDEX IF NOT EXISTS idx_site_setting_site_status
    ON reach10_mysql.site_setting (site_status);

-- ========================
-- site_detail
-- ========================

CREATE INDEX IF NOT EXISTS idx_site_detail_debtorid
    ON reach10_mysql.site_detail (debtorid);

CREATE INDEX IF NOT EXISTS idx_site_detail_customer_code
    ON reach10_mysql.site_detail (customer_code);

CREATE INDEX IF NOT EXISTS idx_site_detail_status
    ON reach10_mysql.site_detail (status);

-- ========================
-- customer_phoneline
-- ========================

CREATE INDEX IF NOT EXISTS idx_cpl_debtorcode
    ON reach10_mysql.customer_phoneline (cpl_debtorcode);

CREATE INDEX IF NOT EXISTS idx_cpl_debtorid
    ON reach10_mysql.customer_phoneline (cpl_debtorid);

CREATE INDEX IF NOT EXISTS idx_cpl_status
    ON reach10_mysql.customer_phoneline (cpl_status);

-- cursor pagination
CREATE INDEX IF NOT EXISTS idx_cpl_cursor
    ON reach10_mysql.customer_phoneline (cpl_id DESC);

-- ========================
-- customer_phoneline_detail
-- ========================

CREATE INDEX IF NOT EXISTS idx_cpld_debtorid
    ON reach10_mysql.customer_phoneline_detail (debtorid);

CREATE INDEX IF NOT EXISTS idx_cpld_debtorcode
    ON reach10_mysql.customer_phoneline_detail (debtorcode);

CREATE INDEX IF NOT EXISTS idx_cpld_status
    ON reach10_mysql.customer_phoneline_detail (status);

-- cursor pagination
CREATE INDEX IF NOT EXISTS idx_cpld_cursor
    ON reach10_mysql.customer_phoneline_detail (id DESC);

-- ========================
-- contract
-- ========================

CREATE INDEX IF NOT EXISTS idx_contract_c_id
    ON reach10_mysql.contract (c_id);

CREATE INDEX IF NOT EXISTS idx_contract_c_code
    ON reach10_mysql.contract (c_code);

CREATE INDEX IF NOT EXISTS idx_contract_status
    ON reach10_mysql.contract (status);

-- cursor pagination
CREATE INDEX IF NOT EXISTS idx_contract_cursor
    ON reach10_mysql.contract (id DESC);

-- ========================
-- deposit
-- ========================

CREATE INDEX IF NOT EXISTS idx_deposit_c_id
    ON reach10_mysql.deposit (c_id);

CREATE INDEX IF NOT EXISTS idx_deposit_c_code
    ON reach10_mysql.deposit (c_code);

CREATE INDEX IF NOT EXISTS idx_deposit_status
    ON reach10_mysql.deposit (status);

-- cursor pagination
CREATE INDEX IF NOT EXISTS idx_deposit_cursor
    ON reach10_mysql.deposit (id DESC);

-- ========================
-- e_invoice
-- ========================

CREATE INDEX IF NOT EXISTS idx_e_invoice_invoice_no
    ON reach10_mysql.e_invoice (invoice_no);

CREATE INDEX IF NOT EXISTS idx_e_invoice_status
    ON reach10_mysql.e_invoice (status);

-- cursor pagination
CREATE INDEX IF NOT EXISTS idx_e_invoice_cursor
    ON reach10_mysql.e_invoice (submit_datetime DESC, id DESC);

-- ========================
-- idd_rates
-- ========================

CREATE INDEX IF NOT EXISTS idx_idd_rates_pack_id
    ON reach10_mysql.idd_rates (pack_id);

CREATE INDEX IF NOT EXISTS idx_idd_rates_status
    ON reach10_mysql.idd_rates (idd_status);

CREATE INDEX IF NOT EXISTS idx_idd_rates_code
    ON reach10_mysql.idd_rates (idd_code);

-- ========================
-- std_rates
-- ========================

CREATE INDEX IF NOT EXISTS idx_std_rates_pack_id
    ON reach10_mysql.std_rates (pack_id);

CREATE INDEX IF NOT EXISTS idx_std_rates_line_id
    ON reach10_mysql.std_rates (line_id);

CREATE INDEX IF NOT EXISTS idx_std_rates_status
    ON reach10_mysql.std_rates (std_status);

-- ========================
-- inv_searchrecord
-- ========================

CREATE INDEX IF NOT EXISTS idx_inv_searchrecord_debtor_id
    ON reach10_mysql.inv_searchrecord (debtor_id);

CREATE INDEX IF NOT EXISTS idx_inv_searchrecord_invoice_code
    ON reach10_mysql.inv_searchrecord (invoice_code);

-- cursor pagination
CREATE INDEX IF NOT EXISTS idx_inv_searchrecord_cursor
    ON reach10_mysql.inv_searchrecord (id DESC);
