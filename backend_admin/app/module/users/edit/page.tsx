'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/input/Input';
import Select from '@/components/input/SelectInput';
import FormField from '@/components/input/FormField';
import { toast } from 'sonner';
import ValidatedButton from '@/components/button/ValidatedButton';
// import { useDynamicFields } from '../../../utils/useDynamicFields';
import { useDynamicFields } from '@/components/generic/useDynamicFields';
import { FieldDef, User } from '../../../types/index';

export default function EditUserPage() {
  const router = useRouter();
  const fieldRefs = useRef<Array<HTMLInputElement | HTMLSelectElement | null>>([]);

  const userFields: FieldDef<User>[] = [
    { key: 'name', label: 'Full Name', value: '', validationRules: { required: true, minLength: 3 } },
    { key: 'email', label: 'Email Address', value: '', validationRules: { required: true, email: true } },
    { key: 'status', label: 'Status', value: '', validationRules: { required: true },
      options: [{label:'Active',value:'Active'},{label:'Inactive',value:'Inactive'}] },
    { key: 'role', label: 'Role', value: '', validationRules: { required: true },
      options: [{label:'Admin',value:'Admin'},{label:'User',value:'User'},{label:'Manager',value:'Manager'}],
      dependsOn: { keys: ['status'], condition: v => v['status'] === 'Inactive' } },
    { key: 'department', label: 'Department', value: '', options: ['Dept A','Dept B','Dept C'].map(d=>({label:d,value:d})) },
    { key: 'block', label: 'Block', value: '', options: [], dependsOn: { keys: ['department'], condition: v => !v['department'] } },
    { key: 'unit', label: 'Unit', value: '', options: [], dependsOn: { keys: ['block'], condition: v => !v['block'] } },
    { key: 'field1', label: 'Field 1', value: 0 },
    { key: 'field2', label: 'Field 2', value: 0 },
    { key: 'field3', label: 'Field 3 (Field1 + Field2)', value: 0, disabled: true,
      dependsOn: { keys: ['field1','field2'], calculate: v => Number(v['field1']||0) * Number(v['field2']||0) } },
  ];

  const { fields, handleFieldChange, setDynamicOptionsUpdater } = useDynamicFields(userFields);

  // Cascading options
  setDynamicOptionsUpdater((fields, valuesMap) => {
    const department = valuesMap['department'];
    const block = valuesMap['block'];

    const blockField = fields.find(f => f.key === 'block');
    const unitField = fields.find(f => f.key === 'unit');

    if (blockField) {
      blockField.options = department ? ['Block 1','Block 2'].map(b=>({label:b,value:b})) : [];
      if (!department) blockField.value = '';
    }
    if (unitField) {
      unitField.options = block ? ['Unit A','Unit B'].map(u=>({label:u,value:u})) : [];
      if (!block) unitField.value = '';
    }
  });

  const validatedFields = fields.map((f, idx) => ({
    name: f.label,
    value: f.value,
    validationRules: f.validationRules,
    hidden: f.hidden,
    disabled: f.disabled,
    ref: { current: fieldRefs.current[idx] } as any,
  }));

  return (
    <div
      className="
        max-w-3xl mx-auto rounded-2xl p-8 space-y-8 shadow-sm
        border
        bg-[var(--card-bg)]
        text-[var(--card-text)]
        border-[var(--border-color)]
      "
    >
      <h1 className="text-2xl font-bold text-[var(--text)]">Edit User</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map((f, idx) =>
          f.hidden ? null : (
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
                />
              ) : (
                <Input
                  id={f.key}
                  value={f.value}
                  placeholder={`Enter ${f.label.toLowerCase()}`}
                  onChange={e => handleFieldChange(f.key, e.target.value)}
                  disabled={f.disabled}
                />
              )}
            </FormField>
          )
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
        <ValidatedButton
          fields={validatedFields}
          onValidSubmit={async () => {
            const userData: Partial<User> = Object.fromEntries(fields.map(f => [f.key, f.value]));
            toast.success('User updated successfully!', {
              description: `${userData.name} (${userData.email})`,
            });
            router.push('/module/users');
          }}
        >
          Save Changes
        </ValidatedButton>

        <ValidatedButton
          variant="outline"
          fields={[]}
          onValidSubmit={() => router.push('/module/users')}
        >
          Cancel
        </ValidatedButton>
      </div>
    </div>
  );
}