'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Heart,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from 'lucide-react';

import PublicHeader from '../../components/public/PublicHeader';

type Gender = '' | 'M' | 'F' | 'O';
type ReferralChoice = '' | 'yes' | 'no';
type Step = 1 | 2 | 3;

type FormState = {
  deceasedFullName: string;
  deceasedGender: Gender;
  deceasedProfession: string;
  deceasedDob: string;
  deceasedBirthLocation: string;
  deceasedPassAwayDate: string;
  deceasedPassAwayLocation: string;
  relationship: string;
  webUrl: string;
  profilePictureName: string;
  musicName: string;
  themeName: string;
  adminFullName: string;
  adminEmail: string;
  confirmEmail: string;
  countryCode: string;
  adminContact: string;
  hasReferral: ReferralChoice;
  referrerCode: string;
  adminPassword: string;
  confirmPassword: string;
  agree: boolean;
};

const initialForm: FormState = {
  deceasedFullName: '',
  deceasedGender: '',
  deceasedProfession: '',
  deceasedDob: '',
  deceasedBirthLocation: '',
  deceasedPassAwayDate: '',
  deceasedPassAwayLocation: '',
  relationship: '',
  webUrl: '',
  profilePictureName: '',
  musicName: '',
  themeName: 'theme_1',
  adminFullName: '',
  adminEmail: '',
  confirmEmail: '',
  countryCode: '',
  adminContact: '',
  hasReferral: '',
  referrerCode: '',
  adminPassword: '',
  confirmPassword: '',
  agree: false,
};

const relationshipOptions = [
  'Mother',
  'Father',
  'Daughter',
  'Son',
  'Sister',
  'Brother',
  'Aunt',
  'Uncle',
  'Niece',
  'Nephew',
  'Cousin (Female)',
  'Cousin (Male)',
  'Grandmother',
  'Granddaughter',
  'Grandfather',
  'Grandson',
  'Stepsister',
  'Stepbrother',
  'Stepmother',
  'Stepfather',
  'Stepdaughter',
  'Stepson',
  'Sister-in-law',
  'Brother-in-law',
  'Mother-in-law',
  'Father-in-law',
  'Daughter-in-law',
  'Son-in-law',
  'Sibling (gender neutral)',
  'Parent (gender neutral)',
  'Child (gender neutral)',
  'Sibling of Parent (gender neutral)',
  'Child of Sibling (gender neutral)',
  'Cousin (gender neutral)',
  'Grandparent (gender neutral)',
  'Grandchild (gender neutral)',
  'Step Sibling (gender neutral)',
  'Step Parent (gender neutral)',
  'Step Child (gender neutral)',
  'Sibling-in-law (gender neutral)',
  'Parent-in-law (gender neutral)',
  'Child-in-law (gender neutral)',
  'Pet (gender neutral)',
  'Husband',
  'Wife',
  'Friend',
  'Best Friend',
];

const countryCodes = [
  { code: '+60', label: '+60 (Malaysia)' },
  { code: '+65', label: '+65 (Singapore)' },
  { code: '+673', label: '+673 (Brunei)' },
  { code: '+62', label: '+62 (Indonesia)' },
  { code: '+63', label: '+63 (Philippines)' },
];

const steps: Array<{ id: Step; label: string }> = [
  { id: 1, label: 'Create a memorial' },
  { id: 2, label: 'Select a template' },
  { id: 3, label: "Admin's account details" },
];

const inputClass =
  'h-9 w-full rounded-none border border-[#bdbdbd] bg-[#e9e9e9] px-3 text-sm text-black outline-none transition placeholder:text-gray-500 focus:border-[#c3195d] focus:ring-0';

const radioCardClass =
  'flex items-center gap-3 border border-white/15 bg-black px-4 py-3 text-sm leading-6 text-white/70';

const getWebUrlFromName = (name: string) =>
  name
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '');

export default function RegisterPage() {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const updateField =
    <K extends keyof FormState>(field: K) =>
    (value: FormState[K]) => {
      setForm((current) => ({ ...current, [field]: value }));
      if (status !== 'idle') {
        setStatus('idle');
        setStatusMessage('');
      }
    };

  const updateDeceasedName = (value: string) => {
    setForm((current) => ({
      ...current,
      deceasedFullName: value,
      webUrl: current.webUrl ? current.webUrl : getWebUrlFromName(value),
    }));

    if (status !== 'idle') {
      setStatus('idle');
      setStatusMessage('');
    }
  };

  const goBack = () => {
    setStatus('idle');
    setStatusMessage('');
    setStep((current) => (current > 1 ? ((current - 1) as Step) : current));
  };

  const validateFinalStep = () => {
    if (form.adminEmail !== form.confirmEmail) {
      return 'Email and confirm email must be the same.';
    }

    if (form.adminPassword !== form.confirmPassword) {
      return 'Password and confirm password must be the same.';
    }

    if (form.hasReferral === 'yes' && !form.referrerCode.trim()) {
      return 'Please enter the referral code.';
    }

    if (!form.agree) {
      return 'Please confirm that the information is accurate before submitting.';
    }

    return '';
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (step < 3) {
      setStep((current) => (current + 1) as Step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const finalValidationMessage = validateFinalStep();
    if (finalValidationMessage) {
      setStatus('error');
      setStatusMessage(finalValidationMessage);
      return;
    }

    setStatus('submitting');
    setStatusMessage('');

    try {
      const payload = {
        // Step 1: memorial details. PHP equivalent: action1.php
        memorialName: form.deceasedFullName,
        deceasedFullName: form.deceasedFullName,
        deceasedGender: form.deceasedGender,
        deceasedProfession: form.deceasedProfession,
        deceasedDob: form.deceasedDob,
        deceasedBirthLocation: form.deceasedBirthLocation,
        deceasedPassAwayDate: form.deceasedPassAwayDate,
        deceasedPassAwayLocation: form.deceasedPassAwayLocation,
        relationship: form.relationship,
        webUrl: form.webUrl,

        // Step 2: template/media. PHP equivalent: action2.php
        profilePictureName: form.profilePictureName,
        musicName: form.musicName,
        themeName: form.themeName,

        // Step 3: administrator details. PHP equivalent: action3.php
        name: form.adminFullName,
        email: form.adminEmail,
        contactNumber: `${form.countryCode}${form.adminContact}`,
        countryCode: form.countryCode,
        adminContact: form.adminContact,
        hasReferral: form.hasReferral,
        referrerCode: form.hasReferral === 'yes' ? form.referrerCode : '',
        username: form.adminEmail,
        password: form.adminPassword,
        servicePlan: 'essential',
        featureId: 1,
      };

      const response = await fetch('/api/registration/public/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let message = 'Unable to submit registration.';
        try {
          const data = await response.json();
          message = data?.message || message;
        } catch (_) {
          // Keep the fallback message for non-JSON responses.
        }
        throw new Error(message);
      }

      setStatus('success');
      setStatusMessage('Registration submitted. Our team will review it and contact you shortly.');
      setForm(initialForm);
      setStep(1);
    } catch (error) {
      setStatus('error');
      setStatusMessage(error instanceof Error ? error.message : 'Unable to submit registration.');
    }
  };

  const renderStepTitle = () => {
    if (step === 1) {
      return 'Step 1 : Create a memorial for loved one';
    }

    if (step === 2) {
      return 'Step 2 : Select a template';
    }

    return "Step 3 : Admin's account details";
  };

  return (
    <div className="mem-public-page">
      <PublicHeader />

      <main className="min-h-[calc(100vh-80px)] bg-black px-6 py-10 text-white md:py-14">
        <div className="mx-auto w-full max-w-5xl">
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-2 text-xs font-light tracking-[0.18em] text-white/60 uppercase transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back Home
          </Link>

          <div className="mb-10 flex flex-col items-center text-center">
              <p className="mb-4 text-xs tracking-[0.28em] text-gray-400 uppercase">Registration - Administrator</p>
              <h1 className="text-3xl font-light tracking-[0.4em] text-white uppercase md:text-4xl">
                MEMODISE.com
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-400">
                Follow the same registration flow as the PHP activation pages: create a memorial, select a template, then enter the administrator account details.
              </p>

              <div className="mt-8 grid w-full gap-4 sm:grid-cols-3">
                <div className="border border-white/10 bg-black p-5 text-left">
                  <Sparkles className="mb-4 h-6 w-6 text-[#c3195d]" />
                  <h2 className="text-sm font-medium text-white">Create a memorial</h2>
                  <p className="mt-2 text-sm leading-6 text-white/55">
                    Add the loved one&apos;s personal details and unique memorial URL.
                  </p>
                </div>

                <div className="border border-white/10 bg-black p-5 text-left">
                  <ShieldCheck className="mb-4 h-6 w-6 text-[#c3195d]" />
                  <h2 className="text-sm font-medium text-white">Select a template</h2>
                  <p className="mt-2 text-sm leading-6 text-white/55">
                    Upload a profile picture, choose music, and select a theme.
                  </p>
                </div>

                <div className="border border-white/10 bg-black p-5 text-left">
                  <Heart className="mb-4 h-6 w-6 text-[#c3195d]" />
                  <h2 className="text-sm font-medium text-white">Admin account details</h2>
                  <p className="mt-2 text-sm leading-6 text-white/55">
                    Create the administrator login used to manage the memorial.
                  </p>
                </div>
              </div>
            </div>

            <section className="border border-white/15 bg-black p-6 md:p-8">
              <div className="mb-8 flex items-start justify-between gap-6">
                <div>
                  <p className="mb-2 text-xs tracking-[0.28em] text-gray-400 uppercase">Registration</p>
                  <h2 className="text-2xl font-light text-white">{renderStepTitle()}</h2>
                </div>
                <div className="hidden h-12 w-12 items-center justify-center border border-white/15 text-[#c3195d] sm:flex">
                  <UserPlus className="h-6 w-6" />
                </div>
              </div>

              <div className="mb-8 grid gap-3 md:grid-cols-3">
                {steps.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStep(item.id)}
                    className={[
                      'border px-4 py-4 text-left transition',
                      step === item.id
                        ? 'border-[#c3195d] bg-[#c3195d]/15 text-white'
                        : 'border-white/10 bg-black text-white/45 hover:text-white',
                    ].join(' ')}
                  >
                    <span className="block text-xs tracking-[0.18em] uppercase">Step {item.id}</span>
                    <span className="mt-1 block text-sm">{item.label}</span>
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {step === 1 && (
                  <div className="space-y-6">
                    <p className="text-sm font-light leading-7 text-white/65">
                      This memorial is dedicated to
                    </p>

                    <div className="grid gap-4 md:grid-cols-2">
                      <input
                        required
                        className={inputClass}
                        placeholder="Enter Full Name"
                        value={form.deceasedFullName}
                        onChange={(event) => updateDeceasedName(event.target.value)}
                      />

                      <div className="grid gap-3 border border-white/10 bg-black p-4 md:grid-cols-3">
                        {[
                          { value: 'M', label: 'Male' },
                          { value: 'F', label: 'Female' },
                          { value: 'O', label: 'Other' },
                        ].map((gender) => (
                          <label key={gender.value} className="flex items-center gap-2 text-sm text-white/70">
                            <input
                              required
                              type="radio"
                              name="deceasedGender"
                              value={gender.value}
                              checked={form.deceasedGender === gender.value}
                              onChange={(event) => updateField('deceasedGender')(event.target.value as Gender)}
                              className="accent-[#c3195d]"
                            />
                            {gender.label}
                          </label>
                        ))}
                      </div>

                      <input
                        className={inputClass}
                        placeholder="Enter career"
                        value={form.deceasedProfession}
                        onChange={(event) => updateField('deceasedProfession')(event.target.value)}
                      />

                      <input
                        required
                        type="date"
                        className={inputClass}
                        value={form.deceasedDob}
                        onChange={(event) => updateField('deceasedDob')(event.target.value)}
                      />

                      <input
                        required
                        className={inputClass}
                        placeholder="Enter Location of birth"
                        value={form.deceasedBirthLocation}
                        onChange={(event) => updateField('deceasedBirthLocation')(event.target.value)}
                      />

                      <input
                        required
                        type="date"
                        className={inputClass}
                        value={form.deceasedPassAwayDate}
                        onChange={(event) => updateField('deceasedPassAwayDate')(event.target.value)}
                      />

                      <input
                        required
                        className={inputClass}
                        placeholder="Enter location"
                        value={form.deceasedPassAwayLocation}
                        onChange={(event) => updateField('deceasedPassAwayLocation')(event.target.value)}
                      />

                      <div>
                        <input
                          list="relationship_list"
                          className={inputClass}
                          placeholder="Choose Relationship"
                          value={form.relationship}
                          onChange={(event) => updateField('relationship')(event.target.value)}
                        />
                        <datalist id="relationship_list">
                          {relationshipOptions.map((relationship) => (
                            <option key={relationship} value={relationship} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    <div className="border border-white/10 bg-black p-5">
                      <label className="mb-3 block text-sm font-medium tracking-[0.16em] text-white/75 uppercase">
                        Unique website URL
                      </label>
                      <div className="grid gap-3 md:grid-cols-[auto_1fr] md:items-center">
                        <span className="text-sm text-white/55">www.memodise.com/</span>
                        <input
                          required
                          className={inputClass}
                          placeholder="we recommend first"
                          value={form.webUrl}
                          onChange={(event) => updateField('webUrl')(getWebUrlFromName(event.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <p className="text-sm leading-7 text-white/60">
                      This selection can be changed later in memorial settings.
                    </p>

                    <div className="border border-white/10 bg-black p-5">
                      <label className="mb-3 block text-sm font-medium text-white">1. Profile picture</label>
                      <input
                        required={!form.profilePictureName}
                        type="file"
                        accept="image/png, image/jpeg, image/gif"
                        className="block w-full cursor-pointer border border-white/15 bg-black p-4 text-sm text-white/70 file:mr-4 file:border-0 file:bg-[#c3195d] file:px-4 file:py-2 file:text-sm file:text-white"
                        onChange={(event) =>
                          updateField('profilePictureName')(event.target.files?.[0]?.name || '')
                        }
                      />
                      {form.profilePictureName && (
                        <p className="mt-3 text-sm text-white/50">Selected: {form.profilePictureName}</p>
                      )}
                    </div>

                    <div className="border border-white/10 bg-black p-5">
                      <label className="mb-3 block text-sm font-medium text-white">2. Music / Song</label>
                      <select
                        className={inputClass}
                        value={form.musicName}
                        onChange={(event) => updateField('musicName')(event.target.value)}
                      >
                        <option value="">Choose music:</option>
                        <option value="setting/music/music1.mp3">music1</option>
                        <option value="setting/music/music2.mp3">music2</option>
                        <option value="setting/music/music3.mp3">music3</option>
                      </select>
                    </div>

                    <div className="border border-white/10 bg-black p-5">
                      <label className="mb-4 block text-sm font-medium text-white">3. Theme selection</label>
                      <label className="block cursor-pointer overflow-hidden border border-[#c3195d]/50 bg-black">
                        <div className="aspect-[16/9] bg-white/[0.08]">
                          <img
                            src="/include/img/theme1.jpg"
                            alt="Theme 1 preview"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-4 p-4">
                          <span className="text-sm text-white">1. Theme 1</span>
                          <input
                            required
                            type="radio"
                            name="themeName"
                            value="theme_1"
                            checked={form.themeName === 'theme_1'}
                            onChange={(event) => updateField('themeName')(event.target.value)}
                            className="accent-[#c3195d]"
                          />
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <div className="border border-white/10 bg-black p-5">
                      <label className="mb-3 block text-sm font-medium text-white">Register with</label>
                      <div className="flex flex-wrap gap-3">
                        <button type="button" className="rounded-full border border-white/15 px-5 py-3 text-sm text-white/60">
                          Facebook
                        </button>
                        <button type="button" className="rounded-full border border-white/15 px-5 py-3 text-sm text-white/60">
                          Google Sign in
                        </button>
                        <span className="self-center text-sm text-white/40">OR</span>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <input
                        required
                        className={inputClass}
                        placeholder="Enter full name"
                        value={form.adminFullName}
                        onChange={(event) => updateField('adminFullName')(event.target.value)}
                      />

                      <input
                        required
                        type="email"
                        className={inputClass}
                        placeholder="Enter email"
                        value={form.adminEmail}
                        onChange={(event) => updateField('adminEmail')(event.target.value)}
                      />

                      <input
                        required
                        type="email"
                        className={inputClass}
                        placeholder="Confirm email"
                        value={form.confirmEmail}
                        onChange={(event) => updateField('confirmEmail')(event.target.value)}
                      />

                      <div className="grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
                        <select
                          required
                          className={inputClass}
                          value={form.countryCode}
                          onChange={(event) => updateField('countryCode')(event.target.value)}
                        >
                          <option value="">Code</option>
                          {countryCodes.map((country) => (
                            <option key={country.code} value={country.code}>
                              {country.label}
                            </option>
                          ))}
                        </select>

                        <input
                          required
                          inputMode="numeric"
                          className={inputClass}
                          placeholder="Enter contact number"
                          value={form.adminContact}
                          onChange={(event) =>
                            updateField('adminContact')(event.target.value.replace(/[^0-9]/g, ''))
                          }
                        />
                      </div>

                      <input
                        required
                        type="password"
                        className={inputClass}
                        placeholder="Password"
                        pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                        title="Must contain at least one number, one uppercase letter, one lowercase letter, and at least 8 characters."
                        value={form.adminPassword}
                        onChange={(event) => updateField('adminPassword')(event.target.value)}
                      />

                      <input
                        required
                        type="password"
                        className={inputClass}
                        placeholder="Enter password"
                        value={form.confirmPassword}
                        onChange={(event) => updateField('confirmPassword')(event.target.value)}
                      />
                    </div>

                    <div className="border border-white/10 bg-black p-5">
                      <label className="mb-3 block text-sm font-medium text-white">Referral</label>
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className={radioCardClass}>
                          <input
                            required
                            type="radio"
                            name="hasReferral"
                            value="yes"
                            checked={form.hasReferral === 'yes'}
                            onChange={(event) => updateField('hasReferral')(event.target.value as ReferralChoice)}
                            className="accent-[#c3195d]"
                          />
                          I have a referral code
                        </label>

                        <label className={radioCardClass}>
                          <input
                            type="radio"
                            name="hasReferral"
                            value="no"
                            checked={form.hasReferral === 'no'}
                            onChange={(event) => updateField('hasReferral')(event.target.value as ReferralChoice)}
                            className="accent-[#c3195d]"
                          />
                          I don&apos;t have a referral code
                        </label>
                      </div>

                      {form.hasReferral === 'yes' && (
                        <input
                          required
                          maxLength={20}
                          className={`${inputClass} mt-4`}
                          placeholder="Enter referral code"
                          value={form.referrerCode}
                          onChange={(event) => updateField('referrerCode')(event.target.value)}
                        />
                      )}
                    </div>

                    <label className="flex items-start gap-3 border border-white/10 bg-black p-4 text-sm leading-6 text-white/62">
                      <input
                        type="checkbox"
                        checked={form.agree}
                        onChange={(event) => updateField('agree')(event.target.checked)}
                        className="mt-1 h-4 w-4 accent-[#c3195d]"
                      />
                      I confirm that the information provided is accurate and that I am authorized to create this memorial registration.
                    </label>
                  </div>
                )}

                {statusMessage && (
                  <div
                    className={[
                      'flex items-start gap-3 border p-4 text-sm leading-6',
                      status === 'success'
                        ? 'border-[#c3195d]/40 bg-[#c3195d]/10 text-white'
                        : 'border-red-400/30 bg-red-500/10 text-red-100',
                    ].join(' ')}
                  >
                    {status === 'success' && <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />}
                    <span>{statusMessage}</span>
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    {step > 1 && (
                      <button
                        type="button"
                        onClick={goBack}
                        className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-xs font-light tracking-[0.14em] text-white/55 uppercase transition hover:text-white"
                      >
                        Back
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Link
                      href={process.env.NEXT_PUBLIC_CUSTOMER_LOGIN_URL || 'http://localhost:3002/login'}
                      className="inline-flex items-center justify-center rounded-full px-6 py-3 text-xs font-light tracking-[0.14em] text-white/55 uppercase transition hover:text-white"
                    >
                      Already registered? Login
                    </Link>

                    <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className="h-9 border border-white bg-black px-8 text-sm font-light tracking-[0.2em] text-white uppercase transition hover:border-[#c3195d] hover:text-[#c3195d] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {status === 'submitting' ? 'Submitting...' : step === 3 ? 'Confirm' : 'Next'}
                    </button>
                  </div>
                </div>
              </form>
            </section>
        </div>
      </main>
    </div>
  );
}
