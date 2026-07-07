'use client';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
import SignatureCanvas from "react-signature-canvas";
import { useState, useEffect, useMemo, useRef } from 'react';
import Button from '../../../../components/button/Button';
import Input from '../../../../components/input/Input';
import FormField from '../../../../components/input/FormField';
import { fetchPackages } from '@/app/data/packages';
import type React from "react";
import { fetchBranches } from "@/app/data/branches";
import { fetchPackagesByBranch } from "@/app/data/branchPackages";

const MAX_VISIBLE_PLANS = 4;

export default function RegistrationForm() {
// ===== FORM STATE =====
const [startIndex, setStartIndex] = useState(0);

const canScrollLeft = startIndex > 0;
const [form, setForm] = useState({
	// Type of application
	applicationType: '',

	// Business info
	businessName: '',
	registeredAddress: '',
	cityState: '',
	postcode: '',
	businessRegNo: '',
	contactNumber: '',
	faxNumber: '',

	// Admin & billing
	title: '',
	otherTitle: '',
	billingContactName: '',
	billingAddress: '',
	billingCityState: '',
	billingPostcode: '',
	billingEmail: '',
	billingContactNumber: '',
	billingFax: '',

	// Service
	servicePlanId: '',
	minContractMonths: "24",

	// Declaration
	declarationAgreed: false,
	signatoryName: '',
	designation: '',
	nricPassport: '',

	branchId: '',
	username: "",
});

const [usernameStatus, setUsernameStatus] = useState<
  "idle" | "checking" | "available" | "taken" | "error"
>("idle");
const [usernameMsg, setUsernameMsg] = useState("");

const [attachmentNames, setAttachmentNames] = useState<Record<string, string>>({});
const [attachments, setAttachments] = useState<Record<string, File | null>>({});

const sigRef = useRef<SignatureCanvas | null>(null);
const [signatureFile, setSignatureFile] = useState<File | null>(null);

// ===== Attachment master list =====
const ATTACHMENTS = [
  { id: "form_d_a", label: "Forms D & A (Sole Proprietorship / Partnership)" },
  { id: "form_d_b", label: "Forms D & B (Sole Proprietorship / Partnership)" },

  { id: "form_9_49", label: "Forms 9 & 49 (Company)" },
  { id: "form_13_49", label: "Forms 13 & 49 (Company)" },

  { id: "form_79_80_83", label: "Forms 79, 80, 80A, 83 & 83A (Non Malaysian Company)" },

  { id: "file_latestbill", label: "Photocopy of 2 months latest phone bill" },
  { id: "file_other", label: "Other" },
] as const;

type AttachmentId = (typeof ATTACHMENTS)[number]["id"];

useEffect(() => {
  const username = form.username.trim();

  // reset if empty
  if (!username) {
    setUsernameStatus("idle");
    setUsernameMsg("");
    return;
  }

  // basic frontend validation (optional)
  if (username.length < 4) {
    setUsernameStatus("idle");
    setUsernameMsg("Username must be at least 4 characters.");
    return;
  }

  // ✅ INVALID CHARACTERS — PUT HERE 👈
  if (!/^[a-z0-9._@-]+$/.test(username)) {
    setUsernameStatus("idle");
    setUsernameMsg(
      "Only letters, numbers, dot (.), dash (-), and underscore (_) are allowed."
    );
    return;
  }

  setUsernameStatus("checking");
  setUsernameMsg("Checking username...");

  type CheckUsernameResponse = { available: boolean };

	const t = setTimeout(async () => {
	try {
		const res = await axios.get<CheckUsernameResponse>(
		`/api/users/check-username`,
		{ params: { username } }
		);

		if (res.data.available) {
		setUsernameStatus("available");
		setUsernameMsg("✅ Username is available");
		} else {
		setUsernameStatus("taken");
		setUsernameMsg("❌ Username already exists");
		}
	} catch (e) {
		setUsernameStatus("error");
		setUsernameMsg("⚠️ Unable to verify username. Try again.");
	}
	}, 500);


  return () => clearTimeout(t);
}, [form.username]);


const getVisibleAttachmentIds = (applicationType: string): AttachmentId[] => {
  const always: AttachmentId[] = ["file_latestbill", "file_other"];

  if (applicationType === "Sole-Proprietorship / Partnership") {
    return ["form_d_a", "form_d_b", ...always];
  }

  if (applicationType === "Company") {
    return ["form_9_49", "form_13_49", ...always];
  }

  if (applicationType === "Non Malaysian Company") {
    return ["form_79_80_83", ...always];
  }

  // Government / Residential / Others
  return always;
};

const visibleAttachmentIds = useMemo(
  () => getVisibleAttachmentIds(form.applicationType),
  [form.applicationType]
);


useEffect(() => {
  const allowed = new Set(visibleAttachmentIds);

  setAttachments((prev) => {
    const next: Record<string, File | null> = {};
    Object.entries(prev).forEach(([k, v]) => {
      if (allowed.has(k as AttachmentId)) next[k] = v;
    });
    return next;
  });

  setAttachmentNames((prev) => {
    const next: Record<string, string> = {};
    Object.entries(prev).forEach(([k, v]) => {
      if (allowed.has(k as AttachmentId)) next[k] = v;
    });
    return next;
  });
}, [visibleAttachmentIds]);


// helper for text inputs
const handleChange =
	(field: keyof typeof form) =>
	(e: any) => {
	setForm((prev) => ({ ...prev, [field]: e.target.value }));
	};

const handleAttachmentChange =
  (id: string) =>
  (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachments(prev => ({
        ...prev,
        [id]: file,
      }));
      setAttachmentNames(prev => ({
        ...prev,
        [id]: file.name,
      }));
    }
  };


// ===== SERVICE PLANS FROM DB (package table) =====
type DbPackage = {
  id: number;
  package_name: string;
  monthly_fee: number | string;
};

  // 4️⃣ useEffect – RESET PACKAGE WHEN BRANCH CHANGES  👈 PUT IT HERE
// useEffect(() => {
// 	setForm((prev) => ({ ...prev, servicePlanId: "" }));
// 	setStartIndex(0);
// }, [form.branchId]);

// useEffect(() => {
//   const loadMasterData = async () => {
//     try {
//       const [b, bp, p] = await Promise.all([
//         fetchBranches(),
//         fetchBranchPackages(),
//         fetchPackages(),
//       ]);

// 	setBranches(Array.isArray(b) ? b.filter((x) => x.status === "Active") : []);
// 	setBranchPackages(Array.isArray(bp) ? bp : []);      // ✅ FIX HERE
// 	setServicePlans(Array.isArray(p) ? p : []);
//     } catch (err) {
//       console.error("Failed to load master data:", err);
//     }
//   };

//   loadMasterData();
// }, []);

useEffect(() => {
  const loadBranches = async () => {
    try {
      // ✅ NO TOKEN (public page)
      const b = await fetchBranches();
      setBranches(Array.isArray(b) ? b.filter((x) => x.status === "Active") : []);
    } catch (err) {
      console.error("Failed to load branches:", err);
      setBranches([]);
    }
  };
  loadBranches();
}, []);

useEffect(() => {
  const loadPackagesForBranch = async () => {
    // reset selection & scroll every time branch changes
    setForm((prev) => ({ ...prev, servicePlanId: "" }));
    setStartIndex(0);

    if (!form.branchId) {
      setServicePlans([]);
      return;
    }

    try {
      // ✅ NO TOKEN (public page)
      const p = await fetchPackagesByBranch(form.branchId);

      console.log("✅ packages response:", p); // debug
      setServicePlans(Array.isArray(p) ? p : []);
    } catch (err) {
      console.error("Failed to load packages by branch:", err);
      setServicePlans([]);
    }
  };

  loadPackagesForBranch();
}, [form.branchId]);



const [branches, setBranches] = useState<DbBranch[]>([]);
// const [branchPackages, setBranchPackages] = useState<DbBranchPackage[]>([]);

const [servicePlans, setServicePlans] = useState<DbPackage[]>([]);

type DbBranch = {
  id: number;
  branch_code: string;
  branch_name: string;
  status: "Active" | "Inactive" | string;
};

type DbBranchPackage = {
  branch_id: number;
  package_id: number;
};

// const canScrollRight =
//   startIndex + MAX_VISIBLE_PLANS < servicePlans.length;

// const visiblePlans = servicePlans.slice(
//   startIndex,
//   startIndex + MAX_VISIBLE_PLANS
// );
// const filteredPlans = useMemo(() => {
//   if (!form.branchId) return [];

//   const branchIdNum = Number(form.branchId);

//   // package ids allowed for this branch
//   const allowedPackageIds = new Set(
//     branchPackages
//       .filter((x) => x.branch_id === branchIdNum)
//       .map((x) => x.package_id)
//   );

//   // keep only those packages
//   return servicePlans.filter((p) => allowedPackageIds.has(p.id));
// }, [form.branchId, branchPackages, servicePlans]);
// You already loaded servicePlans = packages for this branch
const filteredPlans = servicePlans;

const canScrollRight = startIndex + MAX_VISIBLE_PLANS < filteredPlans.length;
const visiblePlans = filteredPlans.slice(startIndex, startIndex + MAX_VISIBLE_PLANS);

const handleScrollLeft = () => {
	if (!canScrollLeft) return;
	setStartIndex((prev) => Math.max(prev - 1, 0));
};

const handleScrollRight = () => {
  if (!canScrollRight) return;
  setStartIndex((prev) =>
    Math.min(prev + 1, servicePlans.length - MAX_VISIBLE_PLANS)
  );
};

const handleBack = () => {
  window.location.href = "/login";
};

const handleSubmit = async () => {
  try {
	const uname = form.username.trim();

	if (!uname) {
		alert("Please enter a username.");
		return;
	}

	if (usernameStatus === "idle") {
		alert("Please wait until username is checked.");
		return;
	}

	if (usernameStatus === "checking") {
		alert("Checking username... please wait.");
		return;
	}

	if (usernameStatus === "error") {
		alert("Unable to verify username. Please try again.");
		return;
	}

	if (usernameStatus === "taken") {
		alert("Username already exists. Please choose another.");
		return;
	}

    const formData = new FormData();

	// if (!signatureFile) {
	// 	alert("Please provide your signature.");
	// 	return;
	// }

	// formData.append("signature", signatureFile);

	// ✅ Signature from canvas (no save button needed)
	const pad = sigRef.current;
	if (!pad || pad.isEmpty()) {
	alert("Please provide your signature.");
	return;
	}

	const dataUrl = pad.getTrimmedCanvas().toDataURL("image/png");
	const resSig = await fetch(dataUrl);
	const blobSig = await resSig.blob();

	// IMPORTANT: include ".png" so multer fileFilter passes
	const sigFile = new File([blobSig], "signature.png", { type: "image/png" });

	formData.append("signature", sigFile);


    // 🔹 Must match publicRegisterCustomer destructuring
    formData.append('applicationType', form.applicationType);

    formData.append('businessName', form.businessName);
    formData.append('registeredAddress', form.registeredAddress);
    formData.append('cityState', form.cityState);
    formData.append('postcode', form.postcode);
    formData.append('businessRegNo', form.businessRegNo);
    formData.append('contactNumber', form.contactNumber);
    formData.append('faxNumber', form.faxNumber);

    // admin_title (title in controller)
    formData.append(
      'title',
      form.title === 'Other' ? form.otherTitle : form.title
    );

    formData.append('billingContactName', form.billingContactName);
    formData.append('billingAddress', form.billingAddress);
    formData.append('billingCityState', form.billingCityState);
    formData.append('billingPostcode', form.billingPostcode);
    formData.append('billingEmail', form.billingEmail);
    formData.append('billingContactNumber', form.billingContactNumber);
    formData.append('billingFax', form.billingFax);

    // Must match: servicePlanId in controller
    formData.append('servicePlanId', form.servicePlanId);
    // formData.append('minContractMonths', form.minContractMonths);
	formData.append("minContractMonths", "24");

    formData.append('declarationAgreed', String(form.declarationAgreed));

    formData.append('signatoryName', form.signatoryName);
    formData.append('designation', form.designation);
    formData.append('nricPassport', form.nricPassport);
	formData.append('branchId', form.branchId);

	formData.append("username", form.username.trim());

    // 🔹 Attach files (field names must match multer in customers.js)
    Object.entries(attachments).forEach(([field, file]) => {
      if (file) {
        formData.append(field, file);
        // field will be one of:
        // 'form_d_a', 'form_d_b', 'form_9_49', 'form_13_49',
        // 'form_79_80_83', 'file_latestbill', 'file_other'
      }
    });

    const res = await axios.post(
      `/api/customers/public/register`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );

    console.log('✅ Registration success:', res.data);
    alert('Registration submitted successfully!');
	window.location.reload();
  } catch (err: any) {
    console.error(
      '❌ Registration failed:',
      err?.response?.data || err?.message || err
    );
    alert('Failed to submit registration.');
  }
};




return (
	<div className="min-h-screen bg-white p-6 md:p-12 bg-[url('/regbg.png')] bg-no-repeat bg-left-top bg-contain">
	{/* Header */}
	<div className="flex justify-between items-center mb-2">
		<div>
		<img src="/logo.png" alt="ReachTen Logo" className="w-40" />
		</div>

		<h1 className="text-center text-3xl font-semibold text-black">
		REGISTRATION FORM
		</h1>
		<Button
		type="button"
		fullWidth={false}
		variant="outline"
		color="black"
		hoverColor="black"
		className="border-2 border-zinc-600 px-8 py-1 text-zinc-600"
		onClick={handleBack}
		>
		BACK
		</Button>
	</div>

	{/* Form Container */}
	<div className="border rounded-2xl bg-white p-8 md:p-12 shadow-sm space-y-10">
		{/* TYPE OF APPLICATION */}
		<div>
		<h2 className="font-semibold text-gray-900 mb-3 text-lg">
			TYPE OF APPLICATION
		</h2>

		<div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-black">
			<label className="flex items-center gap-2">
			<input
				type="radio"
				name="applicationType"
				value="Company"
				checked={form.applicationType === 'Company'}
				onChange={() =>
				setForm((prev) => ({
					...prev,
					applicationType: 'Company',
				}))
				}
			/>{' '}
			Company
			</label>

			<label className="flex items-center gap-2">
			<input
				type="radio"
				name="applicationType"
				value="Government"
				checked={form.applicationType === 'Government'}
				onChange={() =>
				setForm((prev) => ({
					...prev,
					applicationType: 'Government',
				}))
				}
			/>{' '}
			Government
			</label>

			<label className="flex items-center gap-2">
			<input
				type="radio"
				name="applicationType"
				value="Sole-Proprietorship / Partnership"
				checked={form.applicationType === 'Sole-Proprietorship / Partnership'}
				onChange={() =>
				setForm((prev) => ({
					...prev,
					applicationType: 'Sole-Proprietorship / Partnership',
				}))
				}
			/>{' '}
			Sole-Proprietorship / Partnership
			</label>

			<label className="flex items-center gap-2">
			<input
				type="radio"
				name="applicationType"
				value="Others (NGO, Society, Club, Association)"
				checked={form.applicationType === 'Others (NGO, Society, Club, Association)'}
				onChange={() =>
				setForm((prev) => ({
					...prev,
					applicationType: 'Others (NGO, Society, Club, Association)',
				}))
				}
			/>{' '}
			Others (NGO, Society, Club, Association)
			</label>

			<label className="flex items-center gap-2">
			<input
				type="radio"
				name="applicationType"
				value="Residential"
				checked={form.applicationType === 'Residential'}
				onChange={() =>
				setForm((prev) => ({
					...prev,
					applicationType: 'Residential',
				}))
				}
			/>{' '}
			Residential
			</label>

		</div>
		</div>

		{/* BUSINESS INFORMATION */}
		<div>
		<h2 className="font-semibold text-gray-900 mb-3 text-lg">
			BUSINESS INFORMATION
		</h2>

		<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
			<FormField label="Username">
			<Input
				placeholder="Choose a username"
				value={form.username}
				onChange={handleChange("username")}
				className={
				usernameStatus === "taken"
					? "border-red-500"
					: usernameStatus === "available"
					? "border-green-500"
					: ""
				}
			/>
			{usernameMsg && (
				<p
				className={`mt-1 text-xs ${
					usernameStatus === "taken"
					? "text-red-600"
					: usernameStatus === "available"
					? "text-green-600"
					: "text-gray-600"
				}`}
				>
				{usernameMsg}
				</p>
			)}
			</FormField>


			<FormField label="Name">
			<Input
				placeholder="Enter business name"
				value={form.businessName}
				onChange={handleChange('businessName')}
			/>
			</FormField>

			<FormField label="Registered Address">
			<Input
				placeholder="Enter address"
				value={form.registeredAddress}
				onChange={handleChange('registeredAddress')}
			/>
			</FormField>

			<FormField label="City / State">
			<Input
				placeholder="Enter city/state"
				value={form.cityState}
				onChange={handleChange('cityState')}
			/>
			</FormField>

			<FormField label="Postcode">
			<Input
				placeholder="Postcode"
				value={form.postcode}
				onChange={handleChange('postcode')}
			/>
			</FormField>

			<FormField label="Business Registration Number">
			<Input
				placeholder="Enter registration number"
				value={form.businessRegNo}
				onChange={handleChange('businessRegNo')}
			/>
			</FormField>

			<FormField label="Contact Number">
			<Input
				placeholder="Phone number"
				value={form.contactNumber}
				onChange={handleChange('contactNumber')}
			/>
			</FormField>

			<FormField label="Fax Number">
			<Input
				placeholder="Fax number"
				value={form.faxNumber}
				onChange={handleChange('faxNumber')}
			/>
			</FormField>
		</div>
		</div>

		{/* ADMIN & BILLING */}
		<div>
		<h2 className="font-semibold text-gray-900 mb-3 text-lg">
			ADMINISTRATION AND BILLING
		</h2>

		{/* Titles */}
		<div className="flex flex-wrap items-center gap-x-8 gap-y-2 mb-5 text-sm text-black">
			<label className="flex items-center gap-1">
			<input
				type="radio"
				name="title"
				value="Mr."
				checked={form.title === 'Mr.'}
				onChange={() =>
				setForm((prev) => ({ ...prev, title: 'Mr.' }))
				}
			/>{' '}
			Mr.
			</label>

			<label className="flex items-center gap-1">
			<input
				type="radio"
				name="title"
				value="Mrs."
				checked={form.title === 'Mrs.'}
				onChange={() =>
				setForm((prev) => ({ ...prev, title: 'Mrs.' }))
				}
			/>{' '}
			Mrs.
			</label>

			<label className="flex items-center gap-1">
			<input
				type="radio"
				name="title"
				value="Ms."
				checked={form.title === 'Ms.'}
				onChange={() =>
				setForm((prev) => ({ ...prev, title: 'Ms.' }))
				}
			/>{' '}
			Ms.
			</label>

			<label className="flex items-center gap-1">
			<input
				type="radio"
				name="title"
				value="Dr."
				checked={form.title === 'Dr.'}
				onChange={() =>
				setForm((prev) => ({ ...prev, title: 'Dr.' }))
				}
			/>{' '}
			Dr.
			</label>

			{/* Other + specify input grouped together */}
			<div className="flex items-center gap-2">
			<label className="flex items-center gap-1 whitespace-nowrap">
				<input
				type="radio"
				name="title"
				value="Other"
				checked={form.title === 'Other'}
				onChange={() =>
					setForm((prev) => ({ ...prev, title: 'Other' }))
				}
				/>{' '}
				Other (Please specify)
			</label>
			<div className="w-48">
				<Input
				className="w-full"
				placeholder="Specify title"
				value={form.otherTitle}
				onChange={handleChange('otherTitle')}
				/>
			</div>
			</div>
		</div>

		<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
			<FormField label="Billing Contact Name">
			<Input
				placeholder="Full name"
				value={form.billingContactName}
				onChange={handleChange('billingContactName')}
			/>
			</FormField>

			<FormField label="Billing Address">
			<Input
				placeholder="Address"
				value={form.billingAddress}
				onChange={handleChange('billingAddress')}
			/>
			</FormField>

			<FormField label="City / State">
			<Input
				placeholder="City / State"
				value={form.billingCityState}
				onChange={handleChange('billingCityState')}
			/>
			</FormField>

			<FormField label="Postcode">
			<Input
				placeholder="Postcode"
				value={form.billingPostcode}
				onChange={handleChange('billingPostcode')}
			/>
			</FormField>

			<FormField label="Billing Email Address">
			<Input
				type="email"
				placeholder="Email"
				value={form.billingEmail}
				onChange={handleChange('billingEmail')}
			/>
			</FormField>

			<FormField label="Contact Number">
			<Input
				placeholder="Phone number"
				value={form.billingContactNumber}
				onChange={handleChange('billingContactNumber')}
			/>
			</FormField>

			<FormField label="Fax Number">
			<Input
				placeholder="Fax number"
				value={form.billingFax}
				onChange={handleChange('billingFax')}
			/>
			</FormField>
		</div>
		</div>

		{/* SERVICE REQUIREMENT */}
		<div>
		<h2 className="font-semibold text-gray-900 mb-3 text-lg">
			SERVICE REQUIREMENT
		</h2>

		{/* ✅ Branch selection first */}
		<div className="mb-5 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
			<FormField label="Location">
			<select
				className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
				value={form.branchId}
				onChange={(e) =>
				setForm((prev) => ({ ...prev, branchId: e.target.value }))
				}
			>
				<option value="">-- Select Location --</option>
				{branches.map((b) => (
				<option key={b.id} value={String(b.id)}>
					{b.branch_code} - {b.branch_name}
				</option>
				))}
			</select>
			</FormField>
		</div>

		{/* ✅ Show packages only after branch selected */}
		{!form.branchId ? (
		<p className="text-sm text-gray-600">
			Please select a <b>Location</b> to view available packages.
		</p>
		) : servicePlans.length === 0 ? (
		<p className="text-sm text-gray-600">
			No packages configured for this location.
		</p>
		) : (
		<div className="flex gap-4 items-stretch">
			{servicePlans.length > MAX_VISIBLE_PLANS && (
			<button
				type="button"
				onClick={handleScrollLeft}
				className={`hidden md:flex self-center items-center text-2xl font-bold text-black px-1
				${!canScrollLeft ? "opacity-40 cursor-not-allowed" : "hover:text-red-500"}`}
			>
				&lt;
			</button>
			)}

			<div className="flex-1 grid md:grid-cols-2 xl:grid-cols-4 gap-4">
			{visiblePlans.map((plan) => {
				const selected = String(plan.id) === form.servicePlanId;

				const price =
					plan.monthly_fee != null
					? `RM${Number(plan.monthly_fee).toLocaleString("en-MY", {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2,
						})}`
					: "N/A";

				return (
					<button
					key={plan.id}
					type="button"
					onClick={() => {
						console.log("clicked plan id:", plan.id);
						setForm((prev) => ({
						...prev,
						servicePlanId: String(plan.id),
						}));
					}}
					className={`text-left rounded-2xl border p-4 md:p-6 bg-white transition
						${selected ? "border-red-500 ring-2 ring-red-200 bg-red-50" : "border-gray-200 hover:border-red-300"}`}
					>
					<div className="font-semibold text-gray-900 mb-1">
						{plan.package_name}
					</div>
					<div className="text-sm text-black font-semibold mb-3">
						{price} / Month
					</div>
					</button>
				);
			})}

			</div>

			{servicePlans.length > MAX_VISIBLE_PLANS && (
			<button
				type="button"
				onClick={handleScrollRight}
				className={`hidden md:flex self-center items-center text-2xl font-bold text-black px-1
				${!canScrollRight ? "opacity-40 cursor-not-allowed" : "hover:text-red-500"}`}
			>
				&gt;
			</button>
			)}
		</div>
		)}

		</div>


		{/* LENGTH OF SERVICE */}
		<div>
		<h2 className="font-semibold text-gray-900 mb-3 text-lg">
			LENGTH OF SERVICE
		</h2>
		<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
			<FormField label="Minimum Contract Period (Months)">
			<Input
				placeholder="e.g. 12"
				value="24"
				readOnly
				className="bg-gray-100 cursor-not-allowed"
			/>
			</FormField>
		</div>
		</div>

		{/* ATTACHMENTS */}
		<div>
			<h2 className="font-semibold text-gray-900 mb-3 text-lg">ATTACHMENTS</h2>

			{form.applicationType === "" ? (
				<p className="text-sm text-gray-600">
				Please select <b>Type of Application</b> to view the required attachments.
				</p>
			) : (
				<>
				{form.applicationType === "Company" && (
					<p className="text-xs text-gray-600 mb-4">
					Upload <b>either</b> Forms 9 &amp; 49 <b>or</b> Forms 13 &amp; 49.
					</p>
				)}

				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
					{ATTACHMENTS.filter((item) =>
					visibleAttachmentIds.includes(item.id)
					).map((item) => (
					<div key={item.id}>
						<p className="mb-2 text-sm font-medium text-gray-800">{item.label}</p>

						<label className="flex items-center justify-center w-full rounded-xl border border-gray-300 py-2 text-sm text-gray-700 cursor-pointer hover:border-red-400">
						<span className="flex items-center gap-2">
							<span className="text-lg">⭳</span> Upload File
						</span>

						<input
							type="file"
							name={item.id}
							className="hidden"
							onChange={handleAttachmentChange(item.id)}
						/>
						</label>

						{attachmentNames[item.id] && (
						<p className="mt-1 text-xs text-gray-600 truncate">
							Selected: <span className="font-medium">{attachmentNames[item.id]}</span>
						</p>
						)}
					</div>
					))}
				</div>
				</>
			)}
		</div>



		{/* DECLARATION */}
		<div>
		<h2 className="font-semibold text-gray-900 mb-3 text-lg">
			DECLARATION
		</h2>

		{/* Checkbox + text */}
		<div className="flex items-start gap-3 text-sm text-gray-800 mb-6">
			<input
			type="checkbox"
			name="declaration"
			className="mt-1 h-4 w-4 border-gray-400"
			checked={form.declarationAgreed}
			onChange={(e) =>
				setForm((prev) => ({
				...prev,
				declarationAgreed: e.target.checked,
				}))
			}
			/>
			<p>
			I hereby declare that I am authorized to sign on behalf of the
			company listed above to subscribe to the service provided by Reach
			Ten Multimedia S/B and that the above information is true and
			valid. I agree to be bound by the terms and conditions as printed
			or any amendments made.
			</p>
		</div>

		{/* Signatory fields */}
		<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
			<FormField label="Signatory's Name">
			<Input
				placeholder="Enter signatory's name"
				value={form.signatoryName}
				onChange={handleChange('signatoryName')}
			/>
			</FormField>

			<FormField label="Designation">
			<Input
				placeholder="Enter designation"
				value={form.designation}
				onChange={handleChange('designation')}
			/>
			</FormField>

			<FormField label="NRIC / Passport Number">
			<Input
				placeholder="Enter NRIC / Passport number"
				value={form.nricPassport}
				onChange={handleChange('nricPassport')}
			/>
			</FormField>
			<FormField label="Signature">
			<div className="rounded-xl border border-gray-300 bg-white p-2">
				<SignatureCanvas
				ref={sigRef}
				penColor="black"
				canvasProps={{
					className: "w-full h-32",
				}}
				/>
			</div>

			<div className="flex gap-2 mt-2">
				<button
				type="button"
				className="text-sm px-3 py-1 rounded-lg border border-gray-300 text-black hover:border-gray-400 hover:bg-gray-100"
				onClick={() => {
					sigRef.current?.clear();
				}}
				>
				Clear
				</button>
			</div>
			</FormField>
		</div>

		</div>

		{/* SUBMIT */}
		<div className="grid md:grid-cols-2 lg">
		{/* <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"> */}
			<Button
				type="button"
				fullWidth={false}
				variant="outline"
				color="red"
				hoverColor="red"
				className="border-2 border-red-600 px-8 py-1 text-red-600 lg:col-start-4"
				onClick={handleSubmit}   // 🔗 this is where it sends
				>
				SUBMIT
			</Button>
		</div>
	</div>
	</div>
);
}
