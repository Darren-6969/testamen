import React, { useState, useEffect, useMemo } from 'react';
import { useDynamicFields } from '@/components/generic/useDynamicFields';
import Autocomplete from '@/components/input/Autocomplete';
import { Payment } from '@/app/data/payments';
import { customerInfoFields, paymentInfoFields, totalFields } from './completed/paymentFormFields';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Props {
	initialData?: Payment;
	onSubmit?: (data: Partial<Payment>) => void;
	mode?: 'view' | 'edit';
	source?: 'POSTGRES' | 'JSON';
}

interface Customer {
	id: number;
	customer_name: string;
	customer_code: string;
	contact_no: string;
}

interface Invoice {
	dockey: number;
	docno: string;
	docdate: string;
	amount: number;
}

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/* ---------------- helpers ---------------- */

const formatDate = (raw?: any) => {
	if (raw === null || raw === undefined || raw === '') return '';
	const s = String(raw);
	const d = new Date(s);
	if (isNaN(d.getTime())) return s;
	const dd = String(d.getDate()).padStart(2, '0');
	const mm = String(d.getMonth() + 1).padStart(2, '0');
	const yyyy = d.getFullYear();
	return `${dd}/${mm}/${yyyy}`;
};

const formatDateForInput = (raw?: any) => {
	if (!raw) return '';
	// handle YYYY-MM-DD safely
	if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
		return raw;
	}

	const d = new Date(raw);
	if (isNaN(d.getTime())) return '';

	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, '0');
	const dd = String(d.getDate()).padStart(2, '0');

	return `${yyyy}-${mm}-${dd}`;
};

const normalizeInvoice = (inv: any) => ({
	dockey: inv.inv_dockey ?? inv.InvoiceDocKey ?? inv.dockey ?? inv.DOCKEY,
	docno: inv.inv_docno ?? inv.InvoiceDocNo ?? inv.docno ?? inv.DOCNO,
	docdate: inv.inv_docdate ?? inv.InvoiceDocDate ?? inv.docdate ?? inv.DOCDATE,
	amount:
		typeof inv.AvailableAmount === 'number'
			? inv.AvailableAmount
			: Number(inv.amount ?? 0),
});

/* ---------------- component ---------------- */

export default function PaymentForm({ initialData, onSubmit, mode = 'edit', source = 'POSTGRES' }: Props) {
	const isView = mode === 'view';
	const isEdit = mode === 'edit';
	const isCreate = !mode;
	const isReadonly = isView || source === 'JSON';
	const lockCustomer = isEdit && !!initialData;

	const [customerSelected, setCustomerSelected] = useState(false);
	const [invoices, setInvoices] = useState<any[]>([]);
	const [selectedInvoices, setSelectedInvoices] = useState<Invoice[]>([]);
	const [loadingInvoices, setLoadingInvoices] = useState(false);
	

	/* ---------------- fields ---------------- */
	const initialFields = [
		...customerInfoFields,
		...paymentInfoFields,
		...totalFields,
	].map(f => ({
		...f,
		value: initialData ? initialData[f.key] ?? '' : f.value ?? '',
	}));

	const { fields, handleFieldChange } = useDynamicFields<Payment>(initialFields);

	/* ---------------- invoice source ---------------- */
	const invoiceList: Invoice[] = useMemo(() => {
		const map = new Map<string, Invoice>();

		// unpaid / available invoices
		invoices.map(normalizeInvoice).forEach(inv => {
			map.set(inv.docno, inv);
		});

		// invoices already selected in payment (for edit mode)
		selectedInvoices.forEach(inv => {
			map.set(inv.docno, inv);
		});

		return Array.from(map.values());
	}, [invoices, selectedInvoices]);

	/* ---------------- effects ---------------- */

	useEffect(() => {
		const initializeForm = async () => {
			if (isView && initialData) {
				// view mode, load invoices from initial data
				setCustomerSelected(true);
				if (initialData.invoices) {
					setSelectedInvoices(initialData.invoices.map(normalizeInvoice));
				}
			} else if (isEdit && initialData?.customer_code) {
				// edit mode, load both saved and unpaid invoices simultaneously
				setCustomerSelected(true);
				setLoadingInvoices(true);

				try {
					// Load saved invoices immediately
					if (initialData.invoices) {
						setSelectedInvoices(initialData.invoices.map(normalizeInvoice));
					}

					// Load unpaid invoices
					await loadInvoicesByCustomer(initialData.customer_code);
				} finally {
					setLoadingInvoices(false);
				}
			}
		};

		initializeForm();
	}, [isView, isEdit, initialData]);

	/* ---------------- actions ---------------- */

	const loadInvoicesByCustomer = async (customerCode: string) => {
		setLoadingInvoices(true);
		try {
			const res = await fetch(`/api/invoices/customer/${customerCode}`);
			const data = await res.json();
			setInvoices(Array.isArray(data) ? data : data.data ?? data.invoices ?? []);
		} catch (err) {
			console.error("Failed to load invoices", err);
			toast.error("Failed to load invoices");
			setInvoices([]);
		} finally {
			setLoadingInvoices(false);
		}
	};

	const applyCustomer = (c: Customer) => {
		if (isReadonly || lockCustomer) return;

		setCustomerSelected(true);

		handleFieldChange("customer_name", c.customer_name);
		handleFieldChange("customer_code", c.customer_code);
		handleFieldChange("contact_no", c.contact_no);

		setInvoices([]); // reset old data
		setSelectedInvoices([]);
		loadInvoicesByCustomer(c.customer_code);
	};

	const toggleInvoice = (inv: Invoice) => {
		setSelectedInvoices(prev =>
			prev.some(i => i.docno === inv.docno)
				? prev.filter(i => i.docno !== inv.docno)
				: [...prev, inv]
		);
	};

	const handleSubmit = () => {
		if (isReadonly) return;

		if (!customerSelected) {
			toast.error("Please select a customer.");
			return;
		}
		if (selectedInvoices.length === 0) {
			toast.error("Please select at least one invoice.");
			return;
		}

		const payload: any = {};
		fields.forEach(f => (payload[f.key] = f.value));

		console.log("SUBMIT PAYLOAD:", payload);
		console.log("SELECTED INVOICES:", selectedInvoices);

		payload.invoices = selectedInvoices.map(inv => ({
			InvoiceDocKey: inv.dockey,
			InvoiceDocNo: inv.docno,
			InvoiceDocDate: inv.docdate,
			ApplyAmount: inv.amount,
		}));

		payload.status = "PENDING POSTING";
		payload.payment_source = "Manual Entry";

		onSubmit?.(payload);
	};

	/* ---------------- render ---------------- */

	return (
		<div className="space-y-8 p-6 rounded-2xl shadow-md">

			{/* CUSTOMER INFO */}
			<h4 className="font-semibold">CUSTOMER INFO</h4>

			<div className="grid grid-cols-3 gap-6">
				<Autocomplete<Customer>
					label="Customer Name"
					name="customer_name"
					readOnly={isReadonly || lockCustomer}
					apiUrl={`/api/customers/name`}
					method="POST"
					bodyKey="name"
					value={fields.find(f => f.key === "customer_name")?.value || ""}
					getInputValue={i => i.customer_name}
					renderSuggestion={i => (
						<>
							<div className="font-medium">{i.customer_name}</div>
							<div className="text-sm text-gray-500">{i.customer_code}</div>
						</>
					)}
					onSelect={applyCustomer}
					onInputChange={() => {
						if (isReadonly || lockCustomer) return;
						setCustomerSelected(false);
						handleFieldChange("customer_code", "");
						handleFieldChange("contact_no", "");
					}}
				/>

				<Autocomplete<Customer>
					label="Account No."
					name="customer_code"
					readOnly={isReadonly || lockCustomer}
					apiUrl={`/api/customers/code`}
					method="POST"
					bodyKey="code"
					value={fields.find(f => f.key === "customer_code")?.value || ""}
					getInputValue={i => i.customer_code}
					renderSuggestion={i => (
						<>
							<div className="font-medium">{i.customer_code}</div>
							<div className="text-sm text-gray-500">{i.customer_name}</div>
						</>
					)}
					onSelect={applyCustomer}
					onInputChange={() => {
						if (isReadonly || lockCustomer) return;
						setCustomerSelected(false);
						handleFieldChange("customer_name", "");
						handleFieldChange("contact_no", "");
					}}
				/>

				{/* Contact Number */}
				<div>
					<label className="text-xs text-gray-500 uppercase">Contact Number</label>
					<input
						value={fields.find(f => f.key === "contact_no")?.value || ""}
						onChange={(e) => handleFieldChange("contact_no", e.target.value)}
						readOnly={mode === "view"}
						className="w-full border rounded p-2"
					/>
				</div>
			</div>

			{/* PAYMENT INFO */}
			<h4 className="font-semibold text-lg">PAYMENT INFO</h4>

			<div className="grid grid-cols-3 gap-6">
				{paymentInfoFields.map(f => (
					<div key={f.key}>
						<label className="text-xs text-gray-500">{f.label}</label>
						<input
							value={
								f.type == "date"
									? formatDateForInput(fields.find(x => x.key === f.key)?.value)
									: fields.find(x => x.key === f.key)?.value || ""
							}
							readOnly={isReadonly}
							onChange={(e) => {
								if (isReadonly) return;
								handleFieldChange(f.key, e.target.value);
							}}
							type={f.type || "text"}
							className="w-full border rounded p-2"
						/>
					</div>
				))}
			</div>

			{/* INVOICES TABLE */}
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<h4 className="font-semibold text-lg">INVOICES</h4>
					{loadingInvoices && (
						<div className="flex items-center gap-2 text-sm text-gray-500">
							<Loader2 className="w-4 h-4 animate-spin" />
							<span>Loading invoices...</span>
						</div>
					)}
				</div>

				<div className="relative">
					{loadingInvoices && (
						<div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded">
							<div className="flex flex-col items-center gap-2">
								<Loader2 className="w-8 h-8 animate-spin text-blue-600" />
								<span className="text-sm text-gray-600">Loading invoices...</span>
							</div>
						</div>
					)}

					<table className="w-full text-sm">
						<thead className="bg-gray-100">
							<tr>
								<th className="p-2 border-b text-left">No.</th>
								<th className="p-2 border-b text-left">Date</th>
								<th className="p-2 border-b text-left">Invoice No.</th>
								<th className="p-2 border-b text-right">Amount (RM)</th>
								{!isReadonly && <th className="p-2 border-b text-center">Select</th>}
							</tr>
						</thead>

						<tbody>
							{invoiceList.length > 0 ? invoiceList.map((inv, i) => {
								const rowKey =
									inv.docno ||
									(inv.dockey != null ? `dockey-${inv.dockey}` : `invoice-row-${i}`);
								return (
								<tr key={rowKey} className="hover:bg-gray-50">
									<td className="p-2 border-b text-left">{i + 1}</td>
									<td className="p-2 border-b text-left">{formatDate(inv.docdate)}</td>
									<td className="p-2 border-b text-left">{inv.docno}</td>
									<td className="p-2 border-b text-right">{inv.amount.toFixed(2)}</td>
									{!isReadonly && (
										<td className="p-2 border-b text-center">
											<label className="inline-flex items-center justify-center cursor-pointer">
												<input
													type="checkbox"
													checked={selectedInvoices.some(i => i.docno === inv.docno)}
													onChange={() => toggleInvoice(inv)}
													disabled={inv.amount <= 0}
													className="sr-only peer"
												/>
												<span className="relative w-6 h-6 rounded-full border-2 border-red-600 peer-checked:bg-red-600 peer-disabled:border-gray-300 peer-disabled:cursor-not-allowed peer-disabled:bg-gray-100 transition-colors duration-200 flex items-center justify-center">
													<svg 
														className={`w-3.5 h-3.5 text-white transition-opacity duration-200 ${
															selectedInvoices.some(i => i.docno === inv.docno) ? 'opacity-100' : 'opacity-0'
														}`} 
														fill="none" 
														stroke="currentColor" 
														viewBox="0 0 24 24"
													>
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
													</svg>
												</span>
											</label>
										</td>
									)}
								</tr>
							)}) : (
								<tr>
									<td colSpan={5} className="p-8 text-center text-gray-500 border-b">
										{loadingInvoices ? (
											<div className="flex items-center justify-center gap-2">
												<Loader2 className="w-5 h-5 animate-spin" />
												<span>Loading invoices...</span>
											</div>
										) : isView ? (
											'No invoices'
										) : (
											'Select customer to load invoices'
										)}
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* TOTAL AMOUNT */}
			<div className="grid grid-cols-3 gap-6">
				{totalFields.map(f => (
					<div key={f.key}>
						<label className="text-xs text-gray-500">{f.label}</label>
						<input
							value={fields.find(x => x.key === f.key)?.value || ""}
							readOnly={isReadonly}
							onChange={(e) => {
								if (isReadonly) return;
								handleFieldChange(f.key, e.target.value);
							}}
							type={f.type || "text"}
							className="w-full border rounded p-2"
						/>
					</div>
				))}
			</div>

			{!isReadonly && (
				<button
					onClick={handleSubmit}
					disabled={loadingInvoices}
					className="px-4 py-2 bg-red-600 text-white rounded shadow hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
				>
					Save Payment
				</button>
			)}
		</div>
	);
};
