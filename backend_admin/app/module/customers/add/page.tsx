// customers/add/page.tsx
'use client';

import {  useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/input/Input';
import Select from '@/components/input/SelectInput';
import FormField from '@/components/input/FormField';
import { toast } from 'sonner';
import ValidatedButton from '@/components/button/ValidatedButton';
import { useDynamicFields } from '@/components/generic/useDynamicFields';
import { FieldDef } from '../../../types/index';
import { addCustomer } from '../../../data/customers';
import { fetchPackages, type Package } from "../../../data/packages";
type CustomerCreateForm = {
  username: string;
  email: string;
  password: string;
  name: string;
  customer_code: string;

  contact_no: string;       

  status: 'Active' | 'Inactive' | 'Pending' | 'Suspended';

  application_type?: string;
  company_address?: string;
  company_city?: string;
  company_postcode?: string;
  registration_num?: string;
  company_fax?: string;

  admin_title?: string;
  admin_name?: string;
  admin_address?: string;
  admin_city?: string;
  admin_postcode?: string;
  admin_email?: string;
  admin_contact?: string;
  admin_fax?: string;

  // package_name: string;
  package_id: string;
  service_length?: string;

  signatory_name?: string;
  signatory_designation?: string;
  signatory_icnum?: string;
};


export default function AddUserPage() {
  const router = useRouter();
  const fieldRefs = useRef<Array<HTMLInputElement | HTMLSelectElement | null>>([]);

  // attachment field names (same as edit page & backend)
  const attachmentFields = [
    'form_d_a',
    'form_d_b',
    'form_9_49',
    'form_13_49',
    'form_79_80_83',
    'file_latestbill',
    'file_other',
  ];

  // NEW files chosen in this form (no existing on add page)
  const [newFiles, setNewFiles] = useState<Record<string, File | null>>(() =>
    attachmentFields.reduce((acc, f) => ({ ...acc, [f]: null }), {})
  );

  const [packages, setPackages] = useState<Package[]>([]);
  useEffect(() => {
    (async () => {
      const rows = await fetchPackages();
      console.log("FETCH PACKAGES RESULT:", rows); // ✅ add this
      setPackages(rows || []);
    })();
  }, []);

  const packageOptions = useMemo(
    () =>
      packages.map((p) => ({
        label: `${p.package_name} (${p.package_code})`,
        value: String(p.id),
      })),
    [packages]
  );

  // ===== Fields definition (keys must match backend createCustomer) =====
  // Add password here because backend expects `password` in req.body
  const userFields: FieldDef<CustomerCreateForm>[] = [
    { key: 'username', label: 'Username', value: '', validationRules: { required: true } },
    { key: 'email', label: 'Email Address', value: '', validationRules: { required: true } },
    { key: 'password', label: 'Password', value: '', validationRules: { required: true, minLength: 6 } },
    { key: 'name', label: 'Full Name', value: '', validationRules: { required: true, minLength: 3 } },
    { key: 'contact_no', label: 'Phone Number', value: '', validationRules: { required: true } },
    { key: 'customer_code', label: 'Customer Code', value: '' },
    {
      key: 'status',
      label: 'Status',
      value: 'Active',
      validationRules: { required: true },
      options: [
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' },
        { label: 'Pending', value: 'Pending' },
        { label: 'Suspended', value: 'Suspended' },
      ],
    },
    { key: 'application_type', label: 'Application Type', value: '' },
    { key: 'company_address', label: 'Company Address', value: '' },
    { key: 'company_city', label: 'Company City', value: '' },
    { key: 'company_postcode', label: 'Company Postcode', value: '' },
    { key: 'registration_num', label: 'Registration Number', value: '' },
    { key: 'company_fax', label: 'Company Fax No.', value: '' },
    { key: 'admin_title', label: 'Admin Title', value: '' },
    { key: 'admin_name', label: 'Admin Name', value: '' },
    { key: 'admin_address', label: 'Admin Address', value: '' },
    { key: 'admin_city', label: 'Admin City', value: '' },
    { key: 'admin_postcode', label: 'Admin Postcode', value: '' },
    { key: 'admin_email', label: 'Admin Email', value: '' },
    { key: 'admin_contact', label: 'Admin Contact', value: '' },
    { key: 'admin_fax', label: 'Admin Fax', value: '' },
    // {
    //   key: 'package_name',
    //   label: 'Package',
    //   value: '',
    //   validationRules: { required: true },
    //   options: [
    //     { label: 'Connect+ Satellite Package (PCK0001)', value: 'Connect+ Satellite Package' },
    //     { label: 'FiberLink Enterprise Package (PCK0002)', value: 'FiberLink Enterprise Package' },
    //     { label: 'InfraBuild Managed Service Package (PCK0003)', value: 'InfraBuild Managed Service Package' },
    //     { label: 'RuralConnect Community Package (PCK0004)', value: 'RuralConnect Community Package' },
    //     { label: 'SecureNet Government Package (PCK0005)', value: 'SecureNet Government Package' },
    //   ],
    // },
    {
      key: "package_id",
      label: "Package",
      value: "",
      validationRules: { required: true },
      options: packageOptions,
    },
    { key: 'service_length', label: 'Service Length (months)', value: '' },
    { key: 'signatory_name', label: 'Signatory Name', value: '' },
    { key: 'signatory_designation', label: 'Signatory Designation', value: '' },
    { key: 'signatory_icnum', label: 'Signatory IC Number', value: '' },
  ];

  const { fields, handleFieldChange } = useDynamicFields(userFields);

  // Validation mapping for ValidatedButton
  const validatedFields = fields.map((f, idx) => ({
    name: f.label,
    value: f.value,
    validationRules: f.validationRules,
    hidden: f.hidden,
    disabled: f.disabled,
    ref: { current: fieldRefs.current[idx] } as any,
  }));

  // Helper: handle file input change
  const handleFileChange = (fieldName: string, file: File | null) => {
    setNewFiles(prev => ({ ...prev, [fieldName]: file }));
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text)]">Add Customer</h1>

    <div className="bg-white shadow-sm rounded-2xl p-8 space-y-8">
      

      {/* Account Information */}
      <h2 className="text-lg font-semibold mt-2 mb-2 text-[var(--text)]">ACCOUNT INFORMATION</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields
          .filter(f => ['username', 'email', 'password', 'name', 'contact_no', 'customer_code', 'status'].includes(f.key))
          .map((f, idx) => (
            <FormField
              key={f.key}
              label={f.label}
              htmlFor={f.key}
              required={f.validationRules?.required}
            >
              {f.options ? (
                <Select
                  id={f.key}
                  label={f.label}
                  value={f.value}
                  options={f.options?.map(o => ({ ...o, value: String(o.value) }))}
                  onChange={e => handleFieldChange(f.key, e.target.value)}
                  disabled={f.disabled}
                  ref={(el) => {  fieldRefs.current[idx] = el; }}
                />
              ) : (
                <Input
                  id={f.key}
                  type={f.key === 'password' ? 'password' : 'text'}
                  value={f.value}
                  placeholder={`Enter ${f.label.toLowerCase()}`}
                  onChange={e => handleFieldChange(f.key, e.target.value)}
                  disabled={f.disabled}
                  ref={(el) => {  fieldRefs.current[idx] = el; }}
                />
              )}
            </FormField>
          ))}
      </div>

      {/* Company Information */}
      <h2 className="text-lg font-semibold mt-10 mb-2 text-[var(--text)]">COMPANY INFORMATION</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields
          .filter(f =>
            ['application_type', 'company_address', 'company_city', 'company_postcode', 'registration_num', 'company_fax'].includes(f.key)
          )
          .map((f, idx) => (
            <FormField key={f.key} label={f.label} htmlFor={f.key}>
              <Input
                id={f.key}
                value={f.value}
                placeholder={`Enter ${f.label.toLowerCase()}`}
                onChange={e => handleFieldChange(f.key, e.target.value)}
                ref={(el) => {  fieldRefs.current[idx] = el; }}
              />
            </FormField>
          ))}
      </div>

      {/* Admin Information */}
      <h2 className="text-lg font-semibold mt-10 mb-2 text-[var(--text)]">ADMIN INFORMATION</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields
          .filter(f =>
            ['admin_title', 'admin_name', 'admin_address', 'admin_city', 'admin_postcode', 'admin_email', 'admin_contact', 'admin_fax'].includes(f.key)
          )
          .map((f, idx) => (
            <FormField key={f.key} label={f.label} htmlFor={f.key}>
              <Input
                id={f.key}
                value={f.value}
                placeholder={`Enter ${f.label.toLowerCase()}`}
                onChange={e => handleFieldChange(f.key, e.target.value)}
                ref={(el) => {  fieldRefs.current[idx] = el; }}
              />
            </FormField>
          ))}
      </div>

      {/* Package Information */}
      <h2 className="text-lg font-semibold mt-10 mb-2 text-[var(--text)]">PACKAGE INFORMATION</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields
          .filter(f => ['package_id', 'service_length'].includes(f.key))
          .map((f, idx) => (
            <FormField
              key={f.key}
              label={f.label}
              htmlFor={f.key}
              required={f.validationRules?.required}
            >
              {f.options ? (
                <Select
                  id={f.key}
                  label={f.label}
                  value={f.value}
                  options={f.options?.map(o => ({ ...o, value: String(o.value) }))}
                  onChange={e => handleFieldChange(f.key, e.target.value)}
                  ref={(el) => {  fieldRefs.current[idx] = el; }}
                />
              ) : (
                <Input
                  id={f.key}
                  value={f.value}
                  placeholder={`Enter ${f.label.toLowerCase()}`}
                  onChange={e => handleFieldChange(f.key, e.target.value)}
                  ref={(el) => {  fieldRefs.current[idx] = el; }}
                />
              )}
            </FormField>
          ))}
      </div>

      {/* Signatory Information */}
      <h2 className="text-lg font-semibold mt-10 mb-2 text-[var(--text)]">SIGNATORY INFORMATION</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields
          .filter(f => ['signatory_name', 'signatory_designation', 'signatory_icnum'].includes(f.key))
          .map((f, idx) => (
            <FormField key={f.key} label={f.label} htmlFor={f.key}>
              <Input
                id={f.key}
                value={f.value}
                placeholder={`Enter ${f.label.toLowerCase()}`}
                onChange={e => handleFieldChange(f.key, e.target.value)}
                ref={(el) => {  fieldRefs.current[idx] = el; }}
              />
            </FormField>
          ))}
      </div>

      {/* Attachment Section */}
      <h2 className="text-lg font-semibold mt-10 mb-2 text-[var(--text)]">ATTACHMENTS</h2>
      <div className="grid grid-cols-1 gap-4">
        {attachmentFields.map(field => (
          <div key={field} className="border p-4 rounded-lg">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">
                  {field.replaceAll('_', ' ').toUpperCase()}
                </p>
                <p className="text-sm text-[var(--text-light)]">
                  Upload supporting document for {field.replaceAll('_', ' ')}.
                </p>
                <p className="text-xs text-[var(--text-light)] mt-1">
                  You can leave this empty if not applicable.
                </p>
              </div>

              <div className="w-64">
                <input
                  type="file"
                  id={field}
                  onChange={e =>
                    handleFileChange(field, e.target.files ? e.target.files[0] : null)
                  }
                  className="block w-full text-sm"
                />
                {newFiles[field] && (
                  <p className="text-sm mt-1">
                    Selected:{' '}
                    <span className="font-medium">
                      {newFiles[field]?.name}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
        <ValidatedButton
          variant="danger"
          fields={validatedFields}
          onValidSubmit={async () => {
            // Build plain object; addCustomer() will create FormData
            const customerData: Record<string, any> = {};

            // text fields
            fields.forEach((f) => {
              customerData[f.key] = f.value ?? "";
            });

            // file fields
            attachmentFields.forEach((key) => {
              const f = newFiles[key];
              if (f) customerData[key] = f;
            });

            const result = await addCustomer(customerData); // ✅ now returns { success, message }

            if (result.success) {
              const name = fields.find((x) => x.key === "name")?.value;
              const email = fields.find((x) => x.key === "email")?.value;
              toast.success("Customer created successfully!", {
                description: name && email ? `${name} (${email})` : undefined,
              });
              router.push("/module/people");
            } else {
              toast.error(result.message || "Failed to create customer."); // ✅ show backend message (eg Username already exists)
            }
          }}
        >
          Create Customer
        </ValidatedButton>


        <ValidatedButton
          variant="outline"
          fields={[]}
          onValidSubmit={() => router.push('/module/people')}
        >
          Cancel
        </ValidatedButton>
      </div>
    </div>
  </div>
  );
}
