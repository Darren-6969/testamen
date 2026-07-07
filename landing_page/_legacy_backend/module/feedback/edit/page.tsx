'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import Input from '@/components/input/Input';
import Select from '@/components/input/SelectInput';
import FormField from '@/components/input/FormField';
import ValidatedButton from '@/components/button/ValidatedButton';
import { useDynamicFields } from '@/components/generic/useDynamicFields';
import { FieldDef } from '../../../types/index';
import { fetchActivationById, updateActivation } from '@/app/data/activation';
import { fetchCustomers } from '@/app/data/customers';
import { fetchPackages } from '@/app/data/packages';
import { fetchStaffOptions } from '@/app/data/staffs';
import PageHeader from '@/components/header/PageHeader';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function EditActivationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activationId = searchParams.get('id');
  const fieldRefs = useRef<Array<HTMLInputElement | HTMLSelectElement | null>>([]);
  const [loading, setLoading] = useState(true);

  // Customers (for datalist)
  const [customers, setCustomers] = useState<{ label: string; value: number }[]>([]);
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  // Packages (for datalist + display)
  const [packages, setPackages] = useState<{ label: string; value: number }[]>([]);
  const [selectedPackageName, setSelectedPackageName] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);

  // Technicians (for datalist)
  const [technicians, setTechnicians] = useState<{ label: string; value: number }[]>([]);
  const [selectedTechnicianName, setSelectedTechnicianName] = useState('');
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<number | null>(null);

  // Images
  const imageFields = ['image_1', 'image_2', 'image_3'] as const;
  const [existingImages, setExistingImages] = useState<Record<string, string | null>>(
    () =>
      imageFields.reduce(
        (a, f) => ({ ...a, [f]: null }),
        {} as Record<string, string | null>
      )
  );
  const [newImages, setNewImages] = useState<Record<string, File | null>>(
    () =>
      imageFields.reduce(
        (a, f) => ({ ...a, [f]: null }),
        {} as Record<string, File | null>
      )
  );

  // Editable fields

  const activationFields = useMemo<FieldDef<any>[]>(() => [
    { key: 'customer_name', label: 'Customer Name', value: '', validationRules: { required: true } },
    { key: 'package_name', label: 'Package Name', value: '', validationRules: { required: true } },
    { key: 'install_date', label: 'Installation Date', value: '', validationRules: { required: true } },
    { key: 'install_time', label: 'Installation Time', value: '', validationRules: { required: true } },
    { key: 'technician_name', label: 'Technician Name', value: '', validationRules: { required: true } },
    { key: 'device_id', label: 'Device Name', value: '', validationRules: { required: true } },
    { key: 'device_model', label: 'Device Model', value: '' },
    { key: 'device_serial', label: 'Device Serial Number', value: '' },
    { key: 'remarks', label: 'Remarks', value: '' },
    {
      key: 'status',
      label: 'Status',
      value: '',
      validationRules: { required: true },
      options: [
        { label: 'Pending', value: 'Pending' },
        { label: 'Completed', value: 'Completed' },
      ],
    },
  ], []);

  // const activationFields: FieldDef<any>[] = [
  //   { key: 'customer_name', label: 'Customer Name', value: '', validationRules: { required: true } },
  //   { key: 'package_name', label: 'Package Name', value: '', validationRules: { required: true } },
  //   { key: 'install_date', label: 'Installation Date', value: '', validationRules: { required: true } },
  //   { key: 'install_time', label: 'Installation Time', value: '', validationRules: { required: true } },
  //   { key: 'technician_name', label: 'Technician Name', value: '', validationRules: { required: true } },
  //   { key: 'device_id', label: 'Device Name', value: '', validationRules: { required: true } },
  //   { key: 'device_model', label: 'Device Model', value: '' },
  //   { key: 'device_serial', label: 'Device Serial Number', value: '' },
  //   { key: 'remarks', label: 'Remarks', value: '' },
  //   {
  //     key: 'status',
  //     label: 'Status',
  //     value: '',
  //     validationRules: { required: true },
  //     options: [
  //       { label: 'Pending', value: 'Pending' },
  //       { label: 'Completed', value: 'Completed' },
  //     ],
  //   },
  // ];

  const { fields, setFields, handleFieldChange } = useDynamicFields(activationFields);

  // ==========================
  //   LOAD DATA
  // ==========================
  useEffect(() => {
    const fetchData = async () => {
      if (!activationId) {
        toast.error('Invalid activation ID.');
        setLoading(false);
        return;
      }

      try {
        const [activation, customerList, packageList, staffList] = await Promise.all([
          fetchActivationById(Number(activationId)),
          fetchCustomers(),
          fetchPackages(),
          fetchStaffOptions(),
        ]);

        if (!activation) {
          toast.error('Activation not found.');
          setLoading(false);
          return;
        }

        console.log('🔎 activation from API:', activation);

        // ===== Customers for datalist =====
        const mappedCustomers = customerList.map((c: any) => ({
          label: c.name,
          value: Number(c.id ?? c.user_id ?? c['users.id']),
        }));
        setCustomers(mappedCustomers);

        const customerIdFromActivation = Number((activation as any).customer_id ?? 0);

        let matchedCustomer = mappedCustomers.find(c => c.value === customerIdFromActivation);

        const customerNameFromApi =
          (activation as any).customer ||
          (activation as any).customer_name ||
          '';

        const finalCustomerName = matchedCustomer
          ? matchedCustomer.label
          : customerNameFromApi;

        setSelectedCustomerName(finalCustomerName);
        setSelectedCustomerId(
          matchedCustomer
            ? matchedCustomer.value
            : customerIdFromActivation || null
        );

        // ===== Packages =====
        const mappedPackages = packageList.map((p: any) => ({
          label: p.package_name,
          value: Number(p.id),
        }));
        setPackages(mappedPackages);

        const matchedPackageRow = packageList.find(
          (p: any) => p.package_name === activation.package
        );
        if (matchedPackageRow) {
          setSelectedPackageName(matchedPackageRow.package_name);
          setSelectedPackageId(Number(matchedPackageRow.id));
        } else {
          setSelectedPackageName(activation.package ?? '');
          setSelectedPackageId(null);
        }

        // ===== Technicians (datalist) =====
        setTechnicians(staffList);

        const matchedTech = staffList.find(
          (t: any) => t.label === (activation.staff || (activation as any).technician_name)
        );

        if (matchedTech) {
          setSelectedTechnicianName(matchedTech.label);
          setSelectedTechnicianId(Number(matchedTech.value));
        } else {
          setSelectedTechnicianName(activation.staff ?? '');
          setSelectedTechnicianId(null);
        }

        // // ===== Date / Time formatting =====
        // const rawInstallDate = activation.install_date;
        // const rawInstallTime = activation.install_time;

        // const formattedDate =
        //   rawInstallDate && typeof rawInstallDate === 'string'
        //     ? rawInstallDate.slice(0, 10)
        //     : '';

        // const formattedTime =
        //   rawInstallTime && typeof rawInstallTime === 'string'
        //     ? rawInstallTime.slice(0, 5)
        //     : '';

        // ===== Date / Time formatting =====
        const rawInstallDate = activation.install_date;
        const rawInstallTime = activation.install_time;

        let formattedDate = '';
        if (rawInstallDate) {
          if (typeof rawInstallDate === 'string' && rawInstallDate.includes('T')) {
            // e.g. "2025-12-03T16:00:00.000Z" → convert to local date
            const d = new Date(rawInstallDate);
            if (!isNaN(d.getTime())) {
              const yyyy = d.getFullYear();
              const mm = String(d.getMonth() + 1).padStart(2, '0');
              const dd = String(d.getDate()).padStart(2, '0');
              formattedDate = `${yyyy}-${mm}-${dd}`; // for <input type="date">
            }
          } else if (typeof rawInstallDate === 'string') {
            // Already "YYYY-MM-DD"
            formattedDate = rawInstallDate.slice(0, 10);
          }
        }

        let formattedTime = '';
        if (rawInstallTime) {
          if (typeof rawInstallTime === 'string' && rawInstallTime.includes('T')) {
            const d = new Date(rawInstallTime);
            if (!isNaN(d.getTime())) {
              const hh = String(d.getHours()).padStart(2, '0');
              const mm = String(d.getMinutes()).padStart(2, '0');
              formattedTime = `${hh}:${mm}`;
            }
          } else if (typeof rawInstallTime === 'string') {
            formattedTime = rawInstallTime.slice(0, 5); // "HH:MM"
          }
        }


        // ===== Populate form fields =====
        setFields(prev =>
          prev.map(f => {
            let value = f.value;

            switch (f.key) {
              case 'customer_name':
                value = finalCustomerName;
                break;
              case 'package_name':
                value = matchedPackageRow?.package_name ?? activation.package ?? '';
                break;
              case 'technician_name':
                value = matchedTech?.label ?? (activation.staff ?? '');
                break;
              case 'install_date':
                value = formattedDate;
                break;
              case 'install_time':
                value = formattedTime;
                break;
              case 'device_id':
                value = activation.device_id ?? '';
                break;
              case 'device_model':
                value = activation.device_model ?? '';
                break;
              case 'device_serial':
                value = activation.device_serial ?? '';
                break;
              case 'remarks':
                value = activation.remark ?? '';
                break;
              case 'status':
                value = activation.status ?? f.value;
                break;
              default:
                break;
            }

            return { ...f, value };
          })
        );

        // ===== Images =====
        const imagesMap: Record<string, string | null> = {};
        imageFields.forEach(key => {
          imagesMap[key] = (activation as any)[key] ?? null;
        });
        setExistingImages(imagesMap);
      } catch (err) {
        console.error('Error fetching activation data:', err);
        toast.error('Failed to load activation data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activationId, setFields]);

  const validatedFields = fields.map((f, idx) => ({
    key: f.key,
    name: f.label,
    value: f.value,
    validationRules: f.validationRules,
    ref: { current: fieldRefs.current[idx] } as any,
  }));

  if (loading) {
    return <div className="text-center text-lg py-20">Loading activation data...</div>;
  }

  // ==========================
  //   IMAGE HANDLERS
  // ==========================
  const handleImageChange = (fieldName: string, file: File | null) => {
    setNewImages(prev => ({ ...prev, [fieldName]: file }));
  };

  const handleDeleteImage = async (fieldName: string) => {
    if (!confirm(`Delete ${fieldName.replaceAll('_', ' ')}?`)) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/activations/${activationId}/image/${fieldName}`,
        { method: 'DELETE', credentials: 'include' }
      );
      if (!res.ok) throw new Error('Delete failed');

      toast.success(`${fieldName.replaceAll('_', ' ')} deleted.`);
      setExistingImages(prev => ({ ...prev, [fieldName]: null }));
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete image.');
    }
  };

  // ==========================
  //   RENDER
  // ==========================
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text)]">Edit Activation</h1>
    <div className="bg-white shadow-sm rounded-2xl p-8 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map(f => (
          <FormField
            key={f.key}
            label={f.label}
            htmlFor={f.key}
            required={f.validationRules?.required}
          >
            {/* CUSTOMER NAME (datalist) */}
            {f.key === 'customer_name' ? (
              <>
                <Input
                  id="customer_name"
                  list="customerList"
                  value={selectedCustomerName}
                  placeholder="Select or type customer name"
                  onChange={e => {
                    const val = e.target.value;
                    setSelectedCustomerName(val);

                    const matched = customers.find(c => c.label === val);
                    setSelectedCustomerId(matched ? matched.value : null);

                    handleFieldChange(f.key, val);
                  }}
                />
                <datalist id="customerList">
                  {customers.map((c, idx) => (
                    <option key={idx} value={c.label} />
                  ))}
                </datalist>
              </>
            ) : f.key === 'package_name' ? (
              // PACKAGE NAME (datalist)
              <>
                <Input
                  id="package_name"
                  list="packageList"
                  value={selectedPackageName}
                  placeholder="Select or type package name"
                  onChange={e => {
                    const val = e.target.value;
                    setSelectedPackageName(val);
                    const matched = packages.find(p => p.label === val);
                    setSelectedPackageId(matched ? matched.value : null);
                    handleFieldChange(f.key, val);
                  }}
                />
                <datalist id="packageList">
                  {packages.map((p, idx) => (
                    <option key={idx} value={p.label} />
                  ))}
                </datalist>
              </>
            ) : f.key === 'technician_name' ? (
              // TECHNICIAN NAME (datalist)
              <>
                <Input
                  id="technician_name"
                  list="techList"
                  value={selectedTechnicianName}
                  placeholder="Select technician"
                  onChange={e => {
                    const val = e.target.value;
                    setSelectedTechnicianName(val);

                    const matched = technicians.find(t => t.label === val);
                    setSelectedTechnicianId(matched ? matched.value : null);

                    handleFieldChange(f.key, val);
                  }}
                />
                <datalist id="techList">
                  {technicians.map((t, idx) => (
                    <option key={idx} value={t.label} />
                  ))}
                </datalist>
              </>
            ) : f.options ? (
              // STATUS select
              <Select
                id={f.key}
                label={f.label}
                value={f.value}
                options={f.options}
                onChange={e => handleFieldChange(f.key, e.target.value)}
              />
            ) : (
              // DEFAULT INPUT (date/time/text)
              <Input
                id={f.key}
                type={
                  f.key.includes('date')
                    ? 'date'
                    : f.key.includes('time')
                    ? 'time'
                    : 'text'
                }
                value={f.value}
                placeholder={`Enter ${f.label.toLowerCase()}`}
                onChange={e => handleFieldChange(f.key, e.target.value)}
              />
            )}
          </FormField>
        ))}
      </div>

      {/* Images */}
      <h2 className="text-lg font-semibold mt-10 mb-2 text-[var(--text)]">Images</h2>
      <div className="grid grid-cols-1 gap-4">
        {imageFields.map(field => (
          <div key={field} className="border p-4 rounded-lg">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">
                  {field.replaceAll('_', ' ').toUpperCase()}
                </p>

                {existingImages[field] ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <a
                        href={`/api${existingImages[field]}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--accent)] underline inline-block"
                      >
                        <div className="mt-1 w-38 h-38 rounded border overflow-hidden bg-white flex items-center justify-center">
                          <img
                            src={`/api${existingImages[field]}`}
                            alt={field}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleDeleteImage(field)}
                        className="text-red-500 text-sm hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-light)]">No file uploaded.</p>
                )}
              </div>

              <div className="w-64">
                <input
                  type="file"
                  id={field}
                  onChange={e =>
                    handleImageChange(field, e.target.files ? e.target.files[0] : null)
                  }
                  className="block w-full text-sm"
                />
                {newImages[field] && (
                  <p className="text-sm mt-1">
                    Selected:{' '}
                    <span className="font-medium">
                      {newImages[field]?.name}
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
            // 1) Build FormData
            const formData = new FormData();

            // Text fields
            fields.forEach(f => {
              switch (f.key) {
                case 'install_date':
                  formData.append('install_date', f.value ?? '');
                  break;
                case 'install_time':
                  formData.append('install_time', f.value ?? '');
                  break;
                case 'technician_name':
                  formData.append(
                    'staff_id',
                    selectedTechnicianId ? String(selectedTechnicianId) : ''
                  );
                  break;
                case 'remarks':
                  formData.append('remark', f.value ?? '');
                  break;
                case 'status':
                  formData.append('status', f.value ?? '');
                  break;
                case 'device_id':
                  formData.append('device_id', f.value ?? '');
                  break;
                case 'device_model':
                  formData.append('device_model', f.value ?? '');
                  break;
                case 'device_serial':
                  formData.append('device_serial', f.value ?? '');
                  break;
                case 'customer_name':
                  if (selectedCustomerId) {
                    formData.append('customer_id', String(selectedCustomerId));
                  }
                  break;
                case 'package_name':
                  if (selectedPackageId) {
                    formData.append('package_id', String(selectedPackageId));
                  }
                  break;
                default:
                  break;
              }
            });

            // 2) Images – only append if new file chosen
            imageFields.forEach(field => {
              if (newImages[field]) {
                formData.append(field, newImages[field] as File);
              }
            });

            // 3) Call API with isFormData = true
            const success = await updateActivation(
              Number(activationId),
              formData,
              true
            );

            if (success) {
              toast.success('Activation updated successfully!');
              router.push('/module/activation');
            } else {
              toast.error('Failed to update activation.');
            }
          }}
        >
          Save Changes
        </ValidatedButton>

        <ValidatedButton
          variant="outline"
          fields={[]}
          onValidSubmit={() => router.push('/module/activation')}
        >
          Cancel
        </ValidatedButton>
      </div>
    </div>
    </div>
  );

  // return (
  //   <div className="p-6 space-y-6">
  //     {/* ✅ Header OUTSIDE the card */}
  //     <PageHeader>
  //       Edit Activation
  //     </PageHeader>

  //     {/* ✅ Card ONLY for the form */}
  //     <div className="rounded-2xl p-8 space-y-8 shadow-sm border bg-[var(--card-bg)] text-[var(--card-text)] border-[var(--border-color)]">
  //       {/* ❌ removed the <h1> inside the box */}

  //       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  //         {fields.map(f => (
  //           <FormField
  //             key={f.key}
  //             label={f.label}
  //             htmlFor={f.key}
  //             required={f.validationRules?.required}
  //           >
  //             {/* CUSTOMER NAME (datalist) */}
  //             {f.key === 'customer_name' ? (
  //               <>
  //                 <Input
  //                   id="customer_name"
  //                   list="customerList"
  //                   value={selectedCustomerName}
  //                   placeholder="Select or type customer name"
  //                   onChange={e => {
  //                     const val = e.target.value;
  //                     setSelectedCustomerName(val);

  //                     const matched = customers.find(c => c.label === val);
  //                     setSelectedCustomerId(matched ? matched.value : null);

  //                     handleFieldChange(f.key, val);
  //                   }}
  //                 />
  //                 <datalist id="customerList">
  //                   {customers.map((c, idx) => (
  //                     <option key={idx} value={c.label} />
  //                   ))}
  //                 </datalist>
  //               </>
  //             ) : f.key === 'package_name' ? (
  //               <>
  //                 <Input
  //                   id="package_name"
  //                   list="packageList"
  //                   value={selectedPackageName}
  //                   placeholder="Select or type package name"
  //                   onChange={e => {
  //                     const val = e.target.value;
  //                     setSelectedPackageName(val);
  //                     const matched = packages.find(p => p.label === val);
  //                     setSelectedPackageId(matched ? matched.value : null);
  //                     handleFieldChange(f.key, val);
  //                   }}
  //                 />
  //                 <datalist id="packageList">
  //                   {packages.map((p, idx) => (
  //                     <option key={idx} value={p.label} />
  //                   ))}
  //                 </datalist>
  //               </>
  //             ) : f.key === 'technician_name' ? (
  //               <>
  //                 <Input
  //                   id="technician_name"
  //                   list="techList"
  //                   value={selectedTechnicianName}
  //                   placeholder="Select technician"
  //                   onChange={e => {
  //                     const val = e.target.value;
  //                     setSelectedTechnicianName(val);

  //                     const matched = technicians.find(t => t.label === val);
  //                     setSelectedTechnicianId(matched ? matched.value : null);

  //                     handleFieldChange(f.key, val);
  //                   }}
  //                 />
  //                 <datalist id="techList">
  //                   {technicians.map((t, idx) => (
  //                     <option key={idx} value={t.label} />
  //                   ))}
  //                 </datalist>
  //               </>
  //             ) : f.options ? (
  //               <Select
  //                 id={f.key}
  //                 label={f.label}
  //                 value={f.value}
  //                 options={f.options}
  //                 onChange={e => handleFieldChange(f.key, e.target.value)}
  //               />
  //             ) : (
  //               <Input
  //                 id={f.key}
  //                 type={
  //                   f.key.includes('date')
  //                     ? 'date'
  //                     : f.key.includes('time')
  //                     ? 'time'
  //                     : 'text'
  //                 }
  //                 value={f.value}
  //                 placeholder={`Enter ${f.label.toLowerCase()}`}
  //                 onChange={e => handleFieldChange(f.key, e.target.value)}
  //               />
  //             )}
  //           </FormField>
  //         ))}
  //       </div>

  //       {/* Images */}
  //       <h2 className="text-lg font-semibold mt-10 mb-2 text-[var(--text)]">
  //         Images
  //       </h2>
  //       <div className="grid grid-cols-1 gap-4">
  //         {imageFields.map(field => (
  //           <div key={field} className="border p-4 rounded-lg">
  //             <div className="flex items-center justify-between gap-4">
  //               <div>
  //                 <p className="font-medium">
  //                   {field.replaceAll('_', ' ').toUpperCase()}
  //                 </p>

  //                 {existingImages[field] ? (
  //                   <div className="space-y-2">
  //                     <div className="flex items-center gap-3">
  //                       <a
  //                         href={`/api${existingImages[field]}`}
  //                         target="_blank"
  //                         rel="noreferrer"
  //                         className="text-[var(--accent)] underline inline-block"
  //                       >
  //                         <div className="mt-1 w-38 h-38 rounded border overflow-hidden bg-white flex items-center justify-center">
  //                           <img
  //                             src={`/api${existingImages[field]}`}
  //                             alt={field}
  //                             className="w-full h-full object-cover"
  //                           />
  //                         </div>
  //                       </a>

  //                       <button
  //                         type="button"
  //                         onClick={() => handleDeleteImage(field)}
  //                         className="text-red-500 text-sm hover:underline"
  //                       >
  //                         Delete
  //                       </button>
  //                     </div>
  //                   </div>
  //                 ) : (
  //                   <p className="text-sm text-[var(--text-light)]">
  //                     No file uploaded.
  //                   </p>
  //                 )}
  //               </div>

  //               <div className="w-64">
  //                 <input
  //                   type="file"
  //                   id={field}
  //                   onChange={e =>
  //                     handleImageChange(
  //                       field,
  //                       e.target.files ? e.target.files[0] : null
  //                     )
  //                   }
  //                   className="block w-full text-sm"
  //                 />
  //                 {newImages[field] && (
  //                   <p className="text-sm mt-1">
  //                     Selected:{' '}
  //                     <span className="font-medium">{newImages[field]?.name}</span>
  //                   </p>
  //                 )}
  //               </div>
  //             </div>
  //           </div>
  //         ))}
  //       </div>

  //       {/* Buttons */}
  //       <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
  //         <ValidatedButton
  //           variant="danger"
  //           fields={validatedFields}
  //           onValidSubmit={async () => {
  //             const formData = new FormData();

  //             fields.forEach(f => {
  //               switch (f.key) {
  //                 case 'install_date':
  //                   formData.append('install_date', f.value ?? '');
  //                   break;
  //                 case 'install_time':
  //                   formData.append('install_time', f.value ?? '');
  //                   break;
  //                 case 'technician_name':
  //                   formData.append('staff_id', selectedTechnicianId ? String(selectedTechnicianId) : '');
  //                   break;
  //                 case 'remarks':
  //                   formData.append('remark', f.value ?? '');
  //                   break;
  //                 case 'status':
  //                   formData.append('status', f.value ?? '');
  //                   break;
  //                 case 'device_id':
  //                   formData.append('device_id', f.value ?? '');
  //                   break;
  //                 case 'device_model':
  //                   formData.append('device_model', f.value ?? '');
  //                   break;
  //                 case 'device_serial':
  //                   formData.append('device_serial', f.value ?? '');
  //                   break;
  //                 case 'customer_name':
  //                   if (selectedCustomerId) formData.append('customer_id', String(selectedCustomerId));
  //                   break;
  //                 case 'package_name':
  //                   if (selectedPackageId) formData.append('package_id', String(selectedPackageId));
  //                   break;
  //                 default:
  //                   break;
  //               }
  //             });

  //             imageFields.forEach(field => {
  //               if (newImages[field]) formData.append(field, newImages[field] as File);
  //             });

  //             const success = await updateActivation(Number(activationId), formData, true);

  //             if (success) {
  //               toast.success('Activation updated successfully!');
  //               router.push('/module/activation');
  //             } else {
  //               toast.error('Failed to update activation.');
  //             }
  //           }}
  //         >
  //           Save Changes
  //         </ValidatedButton>

  //         <ValidatedButton
  //           variant="outline"
  //           fields={[]}
  //           onValidSubmit={() => router.push('/module/activation')}
  //         >
  //           Cancel
  //         </ValidatedButton>
  //       </div>
  //     </div>
  //   </div>
  // );


}
