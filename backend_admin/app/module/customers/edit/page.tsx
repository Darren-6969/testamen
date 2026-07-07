// customers/edit/page.tsx

'use client';
import { useRef, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Input from '@/components/input/Input';
import Select from '@/components/input/SelectInput';
import FormField from '@/components/input/FormField';
import { toast } from 'sonner';
import ValidatedButton from '@/components/button/ValidatedButton';
import { useDynamicFields } from '@/components/generic/useDynamicFields';
import { FieldDef } from '../../../types/index';
import { fetchCustomerById, updateCustomer } from '../../../data/customers';
import { fetchPackages, type Package } from '../../../data/packages';
import { useMemo } from 'react';

type CustomerEditForm = {
  username: string;
  email: string;
  name: string;
  contact_no: string; 

  status: "Active" | "Inactive" | "Pending" | "Barred";

  customer_code?: string;
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
  package_id?: string; 
  package_name?: string;
  service_length?: string;

  signatory_name?: string;
  signatory_designation?: string;
  signatory_icnum?: string;

  // attachments returned from backend (filenames)
  form_d_a?: string | null;
  form_d_b?: string | null;
  form_9_49?: string | null;
  form_13_49?: string | null;
  form_79_80_83?: string | null;
  file_latestbill?: string | null;
  file_other?: string | null;
};


export default function EditUserPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('id');
  const fieldRefs = useRef<Array<HTMLInputElement | HTMLSelectElement | null>>([]);
  const [loading, setLoading] = useState(true);

  const [packages, setPackages] = useState<Package[]>([]);

  useEffect(() => {
    (async () => {
      const rows = await fetchPackages();
      setPackages(rows || []);
    })();
  }, []);

  const packageOptions = useMemo(
    () =>
      packages.map((p) => ({
        label: `${p.package_name} (${p.package_code})`,
        value: String(p.id), // ✅ value is id
      })),
    [packages]
  );

  const attachmentFields = [
    'form_d_a',
    'form_d_b',
    'form_9_49',
    'form_13_49',
    'form_79_80_83',
    'file_latestbill',
    'file_other',
  ] as const;

  type AttachmentKey = typeof attachmentFields[number];

  const [existingFiles, setExistingFiles] = useState<Record<AttachmentKey, string | null>>(() =>
    attachmentFields.reduce((acc, k) => ({ ...acc, [k]: null }), {} as Record<AttachmentKey, string | null>)
  );

  const [newFiles, setNewFiles] = useState<Record<AttachmentKey, File | null>>(() =>
    attachmentFields.reduce((acc, k) => ({ ...acc, [k]: null }), {} as Record<AttachmentKey, File | null>)
  );

  // 🔹 Define editable fields (same as before)
  const userFields: FieldDef<CustomerEditForm>[] = [
    { key: 'username', label: 'Username', value: '', readOnly: true },
    { key: 'email', label: 'Email Address', value: '', readOnly: true },
    { key: 'name', label: 'Full Name', value: '', validationRules: { required: true, minLength: 3 } },
    { key: 'contact_no', label: 'Phone Number', value: '', validationRules: { required: true } },
    {
      key: 'status',
      label: 'Status',
      value: '',
      validationRules: { required: true },
      options: [
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' },
        { label: 'Pending', value: 'Pending' },
        { label: 'Barred', value: 'Barred' },
      ],
    },
    { key: 'customer_code', label: 'Customer Code', value: '' },
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
    {
      key: 'package_id',
      label: 'Package',
      value: '',
      validationRules: { required: true },
      options: packageOptions,
    },
    { key: 'service_length', label: 'Service Length (months)', value: '' },
    { key: 'signatory_name', label: 'Signatory Name', value: '' },
    { key: 'signatory_designation', label: 'Signatory Designation', value: '' },
    { key: 'signatory_icnum', label: 'Signatory IC Number', value: '' },
  ];

  const { fields, setFields, handleFieldChange } = useDynamicFields(userFields);

  // Fetch user data and existing file names
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        toast.error('Invalid user ID.');
        setLoading(false);
        return;
      }

      try {
        const data = await fetchCustomerById(Number(userId));
        if (!data) {
          toast.error('Customer not found.');
          setLoading(false);
          return;
        }

        // populate fields
        // setFields(prev =>
        //   prev.map(f => ({
        //     ...f,
        //     value: data[f.key] ?? f.value, 
        //   }))
        // );
        setFields(prev =>
          prev.map(f => ({
            ...f,
            value:
              f.key === 'package_id'
                ? String(data.package_id ?? '')
                : (data[f.key as keyof typeof data] ?? f.value),
          }))
        );


        const filesMap = attachmentFields.reduce((acc, key) => {
          acc[key] = data[key] ?? null;
          return acc;
        }, {} as Record<AttachmentKey, string | null>);

        setExistingFiles(filesMap);

      } catch (err) {
        console.error('Error fetching customer data:', err);
        toast.error('Failed to load user data.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, setFields]);

  // Validation mapping
  const validatedFields = fields.map((f, idx) => ({
    name: f.label,
    value: f.value,
    validationRules: f.validationRules,
    hidden: f.hidden,
    disabled: f.disabled,
    ref: { current: fieldRefs.current[idx] } as any,
  }));

  if (loading) return <div className="text-center text-lg py-20">Loading user data...</div>;

  const handleFileChange = (fieldName: AttachmentKey, file: File | null) => {
    setNewFiles(prev => ({ ...prev, [fieldName]: file }));
  };

  const handleDeleteFile = async (fieldName: AttachmentKey) => {
    if (!confirm(`Are you sure you want to delete ${fieldName.replaceAll('_', ' ')}?`)) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/customers/${userId}/file/${fieldName}`,
        {
          method: "DELETE",
          credentials: "include", // ✅ send cookies token/access_token
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Delete failed");

      toast.success(`${fieldName.replaceAll('_', ' ')} deleted successfully`);
      setExistingFiles(prev => ({ ...prev, [fieldName]: null }));
    } catch (err) {
      console.error(err);
      toast.error(`Failed to delete ${fieldName.replaceAll('_', ' ')}`);
    }
  };



  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text)]">Edit Customer</h1>

    <div className="bg-white shadow-sm rounded-2xl p-8 space-y-8">
      

      {/* Account Information */}
      <h2 className="text-lg font-semibold mt-2 mb-2 text-[var(--text)]">ACCOUNT INFORMATION</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.filter(f => ['username', 'email', 'name', 'contact_no', 'customer_code', 'status'].includes(f.key))
          .map(f => (
            <FormField key={f.key} label={f.label} htmlFor={f.key} required={f.validationRules?.required}>
              {f.options ? (
                <Select
                  id={f.key}
                  label={f.label}
                  value={f.value}
                  options={f.options?.map(o => ({ ...o, value: String(o.value) }))}
                  onChange={e => handleFieldChange(f.key, e.target.value)}
                  disabled={f.disabled}
                />
              ) : (
                <Input
                  id={f.key}
                  value={f.value}
                  placeholder={`Enter ${f.label.toLowerCase()}`}
                  onChange={e => handleFieldChange(f.key, e.target.value)}
                  disabled={f.disabled}
                  readOnly={f.readOnly}
                />
              )}
            </FormField>
          ))}
      </div>

      {/* Company, Admin, Package, Signatory Sections (same as before) */}
      <h2 className="text-lg font-semibold mt-10 mb-2 text-[var(--text)]">COMPANY INFORMATION</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields
          .filter(f => ['application_type', 'company_address', 'company_city', 'company_postcode', 'registration_num', 'company_fax'].includes(f.key))
          .map(f => (
            <FormField key={f.key} label={f.label} htmlFor={f.key}>
              <Input id={f.key} value={f.value} placeholder={`Enter ${f.label.toLowerCase()}`} onChange={e => handleFieldChange(f.key, e.target.value)} />
            </FormField>
          ))}
      </div>

      <h2 className="text-lg font-semibold mt-10 mb-2 text-[var(--text)]">ADMIN INFORMATION</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields
          .filter(f => ['admin_title', 'admin_name', 'admin_address', 'admin_city', 'admin_postcode', 'admin_email', 'admin_contact', 'admin_fax'].includes(f.key))
          .map(f => (
            <FormField key={f.key} label={f.label} htmlFor={f.key}>
              <Input id={f.key} value={f.value} placeholder={`Enter ${f.label.toLowerCase()}`} onChange={e => handleFieldChange(f.key, e.target.value)} />
            </FormField>
          ))}
      </div>

      <h2 className="text-lg font-semibold mt-10 mb-2 text-[var(--text)]">PACKAGE INFORMATION</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.filter(f => ['package_id', 'service_length'].includes(f.key)).map(f => (
          <FormField key={f.key} label={f.label} htmlFor={f.key} required={f.validationRules?.required}>
            {f.options ? (
              <Select id={f.key} label={f.label} value={f.value} options={f.options?.map(o => ({ ...o, value: String(o.value) }))} onChange={e => handleFieldChange(f.key, e.target.value)} />
            ) : (
              <Input id={f.key} value={f.value} placeholder={`Enter ${f.label.toLowerCase()}`} onChange={e => handleFieldChange(f.key, e.target.value)} />
            )}
          </FormField>
        ))}
      </div>

      <h2 className="text-lg font-semibold mt-10 mb-2 text-[var(--text)]">SIGNATORY INFORMATION</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.filter(f => ['signatory_name', 'signatory_designation', 'signatory_icnum'].includes(f.key)).map(f => (
          <FormField key={f.key} label={f.label} htmlFor={f.key}>
            <Input id={f.key} value={f.value} placeholder={`Enter ${f.label.toLowerCase()}`} onChange={e => handleFieldChange(f.key, e.target.value)} />
          </FormField>
        ))}
      </div>

      {/* Attachment Section — show existing file link and allow replace */}
      <h2 className="text-lg font-semibold mt-10 mb-2 text-[var(--text)]">ATTACHMENTS</h2>
      <div className="grid grid-cols-1 gap-4">
        {attachmentFields.map(field => (
          <div key={field} className="border p-4 rounded-lg">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{field.replaceAll('_', ' ').toUpperCase()}</p>
                {existingFiles[field] ? (
                  <div className="flex items-center gap-3">
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_URL}/uploads/customers/${existingFiles[field]}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--accent)] underline"
                    >
                      {existingFiles[field]}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteFile(field)}
                      className="text-red-500 text-sm hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-light)]">No file uploaded.</p>
                )}
                <p className="text-xs text-[var(--text-light)] mt-1">Uploading a new file will replace the existing one.</p>
              </div>

              <div className="w-64">
                <input
                  type="file"
                  id={field}
                  onChange={e => handleFileChange(field, e.target.files ? e.target.files[0] : null)}
                  className="block w-full text-sm"
                />
                {newFiles[field] && (
                  <p className="text-sm mt-1">Selected: <span className="font-medium">{newFiles[field]?.name}</span></p>
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
            // build normal object (Partial<Customer>)
            const userData = Object.fromEntries(
              fields.map((f) => [String(f.key), f.value ?? ""])
            ) as Partial<CustomerEditForm>;

            // build files map
            const files: Record<string, File | null> = {};
            attachmentFields.forEach((k) => {
              files[k] = newFiles[k] ?? null;
            });

            const success = await updateCustomer(Number(userId), userData, files);

            if (success) {
              toast.success("Customer updated successfully!", {
                description: `${fields.find(x => x.key === "name")?.value} (${fields.find(x => x.key === "email")?.value})`,
              });
              router.push("/module/people");
            } else {
              toast.error("Failed to update customer.");
            }
          }}

        >
          Save Changes
        </ValidatedButton>

        <ValidatedButton variant="outline" fields={[]} onValidSubmit={() => router.push('/module/people')}>
          Cancel
        </ValidatedButton>
      </div>
    </div>
    </div>
  );
}
