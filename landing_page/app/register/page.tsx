'use client';

import { DragEvent, FormEvent, ReactNode, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Heart,
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  UserPlus,
} from 'lucide-react';

import PublicHeader from '../../components/public/PublicHeader';

type Gender = '' | 'M' | 'F' | 'O';
type ReferralChoice = '' | 'yes' | 'no';
type Step = 1 | 2 | 3;

type UrlCheckStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

type UrlCheck = {
  status: UrlCheckStatus;
  suggestion: string;
  message: string;
};

type BgmTrack = {
  title: string;
  filename: string;
  artist: string;
  url: string;
};

type FieldCheckStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error';

type FieldCheck = {
  status: FieldCheckStatus;
  message: string;
};

type PhotoStatus = 'idle' | 'uploading' | 'ready' | 'error';

type PhotoState = {
  status: PhotoStatus;
  /** Stored filename returned by the API; this is what mt_profile.profile_pic gets. */
  filename: string;
  /** Preview path under /api/uploads/memorial/profile/. */
  url: string;
  /** Original name, shown to the user - the stored name is timestamped. */
  displayName: string;
  sizeLabel: string;
  message: string;
};

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
  username: string;
  adminFirstName: string;
  adminLastName: string;
  adminGender: Gender;
  adminEmail: string;
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
  username: '',
  adminFirstName: '',
  adminLastName: '',
  adminGender: '',
  adminEmail: '',
  countryCode: '',
  adminContact: '',
  hasReferral: '',
  referrerCode: '',
  adminPassword: '',
  confirmPassword: '',
  agree: false,
};

const initialUrlCheck: UrlCheck = {
  status: 'idle',
  suggestion: '',
  message: '',
};

// Carried over verbatim from the legacy active_step_1.php datalist.
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

// Carried over verbatim from the legacy active_step_1.php `nameArray`.
// Suggestions only - the field stays free text, as it was in PHP.
const professionOptions = [
  'Accountant',
  'Actor',
  'Actuary',
  'Architect',
  'Artist',
  'Aviator',
  'Broker',
  'Butcher',
  'Chef',
  'Cleaner',
  'Consultant',
  'Dental Hygienist',
  'Dentist',
  'Designer',
  'Dietitian',
  'Electrician',
  'Engineer',
  'Firefighter',
  'Hairdresser',
  'Health Professional',
  'Journalist',
  'Judge',
  'Labourer',
  'Lawyer',
  'Librarian',
  'Mechanic',
  'Medical Laboratory Scientist',
  'Midwife',
  'Musician',
  'No Profession',
  'Operator',
  'Optician',
  'Pharmacist',
  'Physician',
  'Physiotherapist',
  'Plumber',
  'Police Officer',
  'Politician',
  'Psychologist',
  'Radiographer',
  'Scholar',
  'Scientist',
  'Secretary',
  'Software Developer',
  'Statistician',
  'Sultan',
  'Surgeon',
  'Surveyor',
  'Tailor',
  'Teacher',
  'Technician',
  'Technologist',
  'Tradesman',
  'Veterinarian',
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

const labelClass =
  'block text-xs font-light tracking-[0.16em] text-white/55 uppercase';

// mt_deceased.url_name is varchar(100).
const URL_NAME_MAX = 100;

// Mirrors IMAGE_MIMES and the profilePicUpload size cap in
// api/src/utils/memorialUpload.js. The server is the real gate - these values
// only drive the accept attribute and the friendly pre-flight message, so that a
// wrong file is rejected before it is uploaded rather than after.
const PROFILE_PIC_MIMES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];
const PROFILE_PIC_MAX_BYTES = 8 * 1024 * 1024;
const PROFILE_PIC_FORMAT_HINT = 'JPG, PNG, WEBP and GIF formats, up to 8MB';

const initialFieldCheck: FieldCheck = { status: 'idle', message: '' };

const CUSTOMER_LOGIN_URL =
  process.env.NEXT_PUBLIC_CUSTOMER_LOGIN_URL || 'http://localhost:3002/login';

const initialPhoto: PhotoState = {
  status: 'idle',
  filename: '',
  url: '',
  displayName: '',
  sizeLabel: '',
  message: '',
};

const formatBytes = (bytes: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** Seconds -> m:ss. Returns a dash placeholder until the metadata has loaded. */
const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '--:--';
  const whole = Math.floor(seconds);
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

/**
 * Mirror of api/src/utils/memorialSlug.js -> slugifyName.
 * Kept identical on both sides so the preview shown here always matches what
 * the server will store. If one changes, change the other.
 *
 *   "Mohamad Adam"            -> "mohamad-adam"
 *   "R. Manickam a/l Suppiah" -> "r-manickam-a-l-suppiah"
 */
const slugifyName = (value: string) => {
  const slug = (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug.length <= URL_NAME_MAX
    ? slug
    : slug.slice(0, URL_NAME_MAX).replace(/-+$/, '');
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <span className={labelClass}>{label}</span>
      {children}
      {hint ? <p className="text-xs leading-5 text-white/35">{hint}</p> : null}
    </div>
  );
}

export default function RegisterPage() {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  // Set once the commit succeeds; drives the completion panel.
  const [completed, setCompleted] = useState<{ memorialUrl: string; username: string } | null>(null);

  // The memorial URL is always derived from the full name and is not editable.
  const [urlCheck, setUrlCheck] = useState<UrlCheck>(initialUrlCheck);

  // Step 3 - inline availability checks (legacy equivalent: checkemail.php).
  const [emailCheck, setEmailCheck] = useState<FieldCheck>(initialFieldCheck);
  const [usernameCheck, setUsernameCheck] = useState<FieldCheck>(initialFieldCheck);

  // Step 2 - profile picture and background music.
  const [photo, setPhoto] = useState<PhotoState>(initialPhoto);
  const [isDragging, setIsDragging] = useState(false);
  const [bgmTracks, setBgmTracks] = useState<BgmTrack[]>([]);
  const [bgmError, setBgmError] = useState('');
  // Which track is loaded in the shared player, kept separate from whether it is
  // currently playing - so pausing leaves the progress bar and position intact.
  const [activeTrack, setActiveTrack] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioTime, setAudioTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Seek requested on a track that was not loaded yet; applied once its metadata
  // arrives and the real duration is known.
  const pendingSeekRef = useRef<number | null>(null);

  const clearStatus = () => {
    if (status !== 'idle') {
      setStatus('idle');
      setStatusMessage('');
    }
  };

  const updateField =
    <K extends keyof FormState>(field: K) =>
    (value: FormState[K]) => {
      setForm((current) => ({ ...current, [field]: value }));
      clearStatus();
    };

  const updateDeceasedName = (value: string) => {
    setForm((current) => ({
      ...current,
      deceasedFullName: value,
      webUrl: slugifyName(value),
    }));
    clearStatus();
  };

  // Debounced availability check against the API (legacy equivalent: checkurl.php).
  // Advisory only - the binding check happens server-side at final submit.
  useEffect(() => {
    const slug = form.webUrl.trim();

    if (!slug) {
      setUrlCheck(initialUrlCheck);
      return;
    }

    let cancelled = false;
    setUrlCheck((current) => ({ ...current, status: 'checking', message: 'Checking availability...' }));

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/registration/url-available?value=${encodeURIComponent(slug)}`,
        );
        const data = await response.json();
        if (cancelled) return;

        if (!response.ok) {
          setUrlCheck({
            status: 'error',
            suggestion: '',
            message: data?.message || 'Could not check that URL.',
          });
          return;
        }

        setUrlCheck({
          status: data.available ? 'available' : 'taken',
          suggestion: data.suggestion || '',
          message: data.message || '',
        });
      } catch {
        if (!cancelled) {
          setUrlCheck({
            status: 'error',
            suggestion: '',
            message: 'Could not check that URL. Please try again.',
          });
        }
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.webUrl]);

  // Background music catalogue (mt_bgm, active rows only). Loaded once - it is a
  // small global list, not per-memorial, so there is nothing to re-fetch.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch('/api/registration/bgm');
        if (!response.ok) throw new Error('Failed to load music');
        const data = await response.json();
        if (cancelled) return;
        setBgmTracks(Array.isArray(data) ? data : []);
        setBgmError('');
      } catch {
        if (!cancelled) setBgmError('Background music could not be loaded right now.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Stop any preview playback when leaving Step 2. The loaded track and its
  // position are kept, so coming back resumes where it left off.
  useEffect(() => {
    if (step !== 2 && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [step]);

  const uploadProfilePicture = async (file: File) => {
    // Pre-flight only. The server re-checks both of these and is the real gate;
    // this just avoids a pointless round trip and gives a clearer message.
    if (!PROFILE_PIC_MIMES.includes(file.type)) {
      setPhoto({
        ...initialPhoto,
        status: 'error',
        message: `That file type is not supported. Accepted: ${PROFILE_PIC_FORMAT_HINT}.`,
      });
      return;
    }

    if (file.size > PROFILE_PIC_MAX_BYTES) {
      setPhoto({
        ...initialPhoto,
        status: 'error',
        message: `That image is ${formatBytes(file.size)}. The limit is 8MB.`,
      });
      return;
    }

    setPhoto({
      ...initialPhoto,
      status: 'uploading',
      displayName: file.name,
      sizeLabel: formatBytes(file.size),
      message: 'Uploading...',
    });
    clearStatus();

    try {
      const body = new FormData();
      // Field name must be "files" - that is what profilePicUpload listens for.
      body.append('files', file);

      const response = await fetch('/api/registration/profile-photo', {
        method: 'POST',
        body,
      });
      const data = await response.json();

      if (!response.ok || data?.status === 'error') {
        setPhoto({
          ...initialPhoto,
          status: 'error',
          message: data?.message || 'Upload failed. Please try again.',
        });
        return;
      }

      setPhoto({
        status: 'ready',
        filename: data.filename,
        url: data.url,
        displayName: file.name,
        sizeLabel: formatBytes(data.size ?? file.size),
        message: '',
      });
      setForm((current) => ({ ...current, profilePictureName: data.filename }));
    } catch {
      setPhoto({
        ...initialPhoto,
        status: 'error',
        message: 'Upload failed. Please check your connection and try again.',
      });
    }
  };

  const handleFileSelected = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (file) void uploadProfilePicture(file);
  };

  const removeProfilePicture = () => {
    // Clears the reference only. The uploaded file stays on disk until the
    // orphan sweep collects it - see registerMediaController.
    setPhoto(initialPhoto);
    setForm((current) => ({ ...current, profilePictureName: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    clearStatus();
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFileSelected(event.dataTransfer.files);
  };

  /** Load a track into the shared player and start it, optionally at a position. */
  const startTrack = (track: BgmTrack, ratio?: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    pendingSeekRef.current = typeof ratio === 'number' ? ratio : null;
    audio.src = track.url;
    setActiveTrack(track.filename);
    setAudioTime(0);
    setAudioDuration(0);

    void audio.play().then(
      () => setIsPlaying(true),
      () => {
        setIsPlaying(false);
        setBgmError('That track could not be played.');
      }
    );
  };

  const toggleTrackPreview = (track: BgmTrack) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (activeTrack !== track.filename) {
      startTrack(track);
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    void audio.play().then(
      () => setIsPlaying(true),
      () => setIsPlaying(false)
    );
  };

  /** Click anywhere on a track's bar to jump to that point. */
  const seekTrack = (track: BgmTrack, ratio: number) => {
    const clamped = Math.min(1, Math.max(0, ratio));
    const audio = audioRef.current;
    if (!audio) return;

    // Seeking a track that is not loaded yet: start it and apply the position
    // once loadedmetadata gives us a real duration.
    if (activeTrack !== track.filename) {
      startTrack(track, clamped);
      return;
    }

    if (!audioDuration) return;
    audio.currentTime = clamped * audioDuration;
    setAudioTime(audio.currentTime);
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    setAudioDuration(duration);

    if (pendingSeekRef.current !== null && duration) {
      audio.currentTime = pendingSeekRef.current * duration;
      setAudioTime(audio.currentTime);
    }
    pendingSeekRef.current = null;
  };

  const selectedTrack = bgmTracks.find((track) => track.filename === form.musicName) || null;

  // What the memorial will actually be published at. When the generated slug is
  // already in use, the server's suggested alternative is adopted automatically -
  // there is no editable field for the user to resolve the clash themselves.
  const effectiveSlug =
    urlCheck.status === 'taken' && urlCheck.suggestion ? urlCheck.suggestion : form.webUrl;

  // Debounced inline checks for username and email (legacy: checkemail.php).
  // Advisory only - publicRegister re-checks both inside its transaction.
  useEffect(() => {
    const value = form.username.trim();
    if (!value) {
      setUsernameCheck(initialFieldCheck);
      return;
    }

    let cancelled = false;
    setUsernameCheck({ status: 'checking', message: 'Checking availability...' });

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/registration/username-available?value=${encodeURIComponent(value)}`,
        );
        const data = await response.json();
        if (cancelled) return;

        if (!response.ok) {
          setUsernameCheck({ status: 'error', message: data?.message || 'Could not check that username.' });
          return;
        }

        setUsernameCheck({
          status: data.available ? 'available' : 'taken',
          message: data.message || '',
        });
      } catch {
        if (!cancelled) {
          setUsernameCheck({ status: 'error', message: 'Could not check that username.' });
        }
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.username]);

  useEffect(() => {
    const value = form.adminEmail.trim();
    if (!value) {
      setEmailCheck(initialFieldCheck);
      return;
    }

    let cancelled = false;
    setEmailCheck({ status: 'checking', message: 'Checking availability...' });

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/registration/email-available?value=${encodeURIComponent(value)}`,
        );
        const data = await response.json();
        if (cancelled) return;

        if (!response.ok) {
          setEmailCheck({ status: 'error', message: data?.message || 'Could not check that email.' });
          return;
        }

        if (!data.valid) {
          setEmailCheck({ status: 'invalid', message: data.message || 'Please enter a valid email address.' });
          return;
        }

        setEmailCheck({
          status: data.available ? 'available' : 'taken',
          message: data.message || '',
        });
      } catch {
        if (!cancelled) {
          setEmailCheck({ status: 'error', message: 'Could not check that email.' });
        }
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.adminEmail]);

  const goBack = () => {
    setStatus('idle');
    setStatusMessage('');
    setStep((current) => (current > 1 ? ((current - 1) as Step) : current));
  };

  const validateStepOne = () => {
    if (!form.deceasedFullName.trim()) {
      return 'Please enter the full name of the person this memorial is for.';
    }

    if (!form.deceasedGender) {
      return 'Please select a gender.';
    }

    if (!form.webUrl.trim()) {
      return 'The full name needs at least one letter or number so a memorial URL can be generated.';
    }

    if (urlCheck.status === 'checking') {
      return 'Still checking the memorial URL. Please wait a moment.';
    }

    // 'taken' is deliberately not blocking: the suggested alternative is adopted
    // automatically and shown in the preview, so there is nothing to correct.

    if (urlCheck.status === 'error') {
      return 'The memorial URL could not be verified. Please try again.';
    }

    return '';
  };

  const validateStepTwo = () => {
    if (photo.status === 'uploading') {
      return 'The profile picture is still uploading. Please wait a moment.';
    }

    if (!form.profilePictureName) {
      return 'Please add a profile picture for the memorial.';
    }

    // Music is required to match the legacy activation flow, which blocked on an
    // empty selection. Delete these three lines to make it optional - mt_profile
    // .music is nullable and most existing rows are null.
    if (!form.musicName) {
      return 'Please choose the background music for the memorial.';
    }

    return '';
  };

  const validateFinalStep = () => {
    if (!form.username.trim()) {
      return 'Please enter a username.';
    }

    if (usernameCheck.status === 'checking' || emailCheck.status === 'checking') {
      return 'Still checking your details. Please wait a moment.';
    }

    if (usernameCheck.status === 'taken') {
      return 'That username is already taken. Please choose another.';
    }

    if (emailCheck.status === 'invalid') {
      return 'Please enter a valid email address.';
    }

    if (emailCheck.status === 'taken') {
      return 'That email is already registered. Please log in instead.';
    }

    if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/.test(form.adminPassword)) {
      return 'Password must be at least 8 characters and include an uppercase letter, a lowercase letter and a number.';
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
      const stepMessage = step === 1 ? validateStepOne() : validateStepTwo();
      if (stepMessage) {
        setStatus('error');
        setStatusMessage(stepMessage);
        return;
      }

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
        // `webUrl` is the slug only (mt_deceased.url_name). The server builds the
        // full www.memodise.com/<slug> value for mt_user_account.link and
        // re-resolves collisions authoritatively before inserting.
        memorialName: form.deceasedFullName,
        deceasedFullName: form.deceasedFullName,
        deceasedGender: form.deceasedGender,
        deceasedProfession: form.deceasedProfession,
        deceasedDob: form.deceasedDob,
        deceasedBirthLocation: form.deceasedBirthLocation,
        deceasedPassAwayDate: form.deceasedPassAwayDate,
        deceasedPassAwayLocation: form.deceasedPassAwayLocation,
        relationship: form.relationship,
        webUrl: effectiveSlug,

        // Step 2: template/media. PHP equivalent: action2.php
        profilePictureName: form.profilePictureName,
        musicName: form.musicName,
        themeName: form.themeName,

        // Step 3: administrator details. PHP equivalent: action3.php
        username: form.username,
        firstName: form.adminFirstName,
        lastName: form.adminLastName,
        adminGender: form.adminGender,
        email: form.adminEmail,
        contactNumber: `${form.countryCode}${form.adminContact}`,
        countryCode: form.countryCode,
        adminContact: form.adminContact,
        hasReferral: form.hasReferral,
        referrerCode: form.hasReferral === 'yes' ? form.referrerCode : '',
        password: form.adminPassword,
      };

      const response = await fetch('/api/registration/public/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch (_) {
        // Non-JSON response; fall through to the generic message below.
      }

      if (!response.ok) {
        throw new Error(data?.message || 'Unable to submit registration.');
      }

      setStatus('success');
      setStatusMessage('');
      setCompleted({
        memorialUrl: data?.memorialUrl || '',
        username: data?.username || form.username,
      });
      setForm(initialForm);
      setUrlCheck(initialUrlCheck);
      setPhoto(initialPhoto);
      setEmailCheck(initialFieldCheck);
      setUsernameCheck(initialFieldCheck);
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

  const fieldStatusClass = (status: FieldCheckStatus) =>
    ({
      idle: 'text-white/40',
      checking: 'text-white/50',
      available: 'text-emerald-300',
      taken: 'text-amber-300',
      invalid: 'text-amber-300',
      error: 'text-red-300',
    })[status];

  const urlStatusClass = {
    idle: 'text-white/40',
    checking: 'text-white/50',
    available: 'text-emerald-300',
    taken: 'text-amber-300',
    error: 'text-red-300',
  }[urlCheck.status];

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
                Create a memorial for your loved one in three steps: add their details, choose how the
                page looks, then set up the account that will manage it.
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

              {completed ? (
                <div className="space-y-6">
                  <div className="flex items-start gap-3 border border-[#c3195d]/40 bg-[#c3195d]/10 p-5">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#c3195d]" />
                    <div>
                      <p className="text-sm text-white">Registration complete.</p>
                      <p className="mt-2 text-sm leading-6 text-white/60">
                        The memorial has been created and the administrator account is ready. Sign in
                        with <span className="text-white">{completed.username}</span> to manage it.
                      </p>
                    </div>
                  </div>

                  {completed.memorialUrl && (
                    <div className="border border-white/10 bg-black p-5">
                      <p className="text-xs tracking-[0.16em] text-white/45 uppercase">Memorial URL</p>
                      <p className="mt-2 text-sm break-all text-white">{completed.memorialUrl}</p>
                    </div>
                  )}

                  <Link
                    href={CUSTOMER_LOGIN_URL}
                    className="inline-flex h-9 items-center justify-center border border-white bg-black px-8 text-sm font-light tracking-[0.2em] text-white uppercase transition hover:border-[#c3195d] hover:text-[#c3195d]"
                  >
                    Go to login
                  </Link>
                </div>
              ) : (
              <>
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

                    <div className="grid gap-5 md:grid-cols-2">
                      <Field label="Full Name">
                        <input
                          required
                          className={inputClass}
                          placeholder="Enter full name"
                          value={form.deceasedFullName}
                          onChange={(event) => updateDeceasedName(event.target.value)}
                        />
                      </Field>

                      <Field label="Gender">
                        <div className="flex h-9 items-center gap-6 border border-white/10 bg-black px-4">
                          {[
                            { value: 'M', label: 'Male' },
                            { value: 'F', label: 'Female' },
                            { value: 'O', label: 'Other' },
                          ].map((gender) => (
                            <label
                              key={gender.value}
                              className="flex items-center gap-2 text-sm text-white/70"
                            >
                              <input
                                required
                                type="radio"
                                name="deceasedGender"
                                value={gender.value}
                                checked={form.deceasedGender === gender.value}
                                onChange={(event) =>
                                  updateField('deceasedGender')(event.target.value as Gender)
                                }
                                className="accent-[#c3195d]"
                              />
                              {gender.label}
                            </label>
                          ))}
                        </div>
                      </Field>

                      <Field label="Last Profession">
                        <input
                          list="profession_list"
                          className={inputClass}
                          placeholder="Enter or choose a profession"
                          value={form.deceasedProfession}
                          onChange={(event) => updateField('deceasedProfession')(event.target.value)}
                        />
                        <datalist id="profession_list">
                          {professionOptions.map((profession) => (
                            <option key={profession} value={profession} />
                          ))}
                        </datalist>
                      </Field>

                      <Field label="This person is my">
                        <input
                          list="relationship_list"
                          className={inputClass}
                          placeholder="Choose or type a relationship"
                          value={form.relationship}
                          onChange={(event) => updateField('relationship')(event.target.value)}
                        />
                        <datalist id="relationship_list">
                          {relationshipOptions.map((relationship) => (
                            <option key={relationship} value={relationship} />
                          ))}
                        </datalist>
                      </Field>

                      <Field label="Date of Birth">
                        <input
                          required
                          type="date"
                          className={inputClass}
                          value={form.deceasedDob}
                          onChange={(event) => updateField('deceasedDob')(event.target.value)}
                        />
                      </Field>

                      <Field label="Location of Birth">
                        <input
                          required
                          className={inputClass}
                          placeholder="Enter location of birth"
                          value={form.deceasedBirthLocation}
                          onChange={(event) =>
                            updateField('deceasedBirthLocation')(event.target.value)
                          }
                        />
                      </Field>

                      <Field label="Passed Away Date">
                        <input
                          required
                          type="date"
                          className={inputClass}
                          value={form.deceasedPassAwayDate}
                          onChange={(event) =>
                            updateField('deceasedPassAwayDate')(event.target.value)
                          }
                        />
                      </Field>

                      <Field label="Passed Away Location">
                        <input
                          required
                          className={inputClass}
                          placeholder="Enter location"
                          value={form.deceasedPassAwayLocation}
                          onChange={(event) =>
                            updateField('deceasedPassAwayLocation')(event.target.value)
                          }
                        />
                      </Field>

                    </div>

                    <div className="border border-white/10 bg-black p-5">
                      <p className="mb-1 text-sm font-medium tracking-[0.16em] text-white/75 uppercase">
                        Unique website URL
                      </p>
                      <p className="mb-4 text-xs leading-5 text-white/35">
                        Generated automatically from the full name. If that URL is already in use, a
                        number is added to keep it unique.
                      </p>

                      <div className="flex min-h-9 flex-wrap items-center gap-x-1 gap-y-1 border border-white/15 bg-white/[0.04] px-3 py-2">
                        <span className="text-sm text-white/45">www.memodise.com/</span>
                        {effectiveSlug ? (
                          <span className="text-sm break-all text-white">{effectiveSlug}</span>
                        ) : (
                          <span className="text-sm text-white/25">your-loved-one</span>
                        )}
                      </div>

                      {urlCheck.message && (
                        <p className={`mt-3 text-xs leading-5 ${urlStatusClass}`}>
                          {urlCheck.status === 'taken' && urlCheck.suggestion
                            ? `That URL is already in use, so this memorial will use "${urlCheck.suggestion}".`
                            : urlCheck.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <p className="text-sm leading-7 text-white/60">
                      This selection can be changed later in memorial settings.
                    </p>

                    <div className="border border-white/10 bg-black p-5">
                      <label className="mb-4 block text-sm font-medium text-white">1. Profile picture</label>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={PROFILE_PIC_MIMES.join(',')}
                        className="hidden"
                        onChange={(event) => handleFileSelected(event.target.files)}
                      />

                      {photo.status === 'ready' ? (
                        <div className="flex flex-col gap-5 border border-white/15 bg-white/[0.03] p-5 sm:flex-row sm:items-center">
                          <img
                            src={photo.url}
                            alt="Profile picture preview"
                            className="h-28 w-28 flex-shrink-0 border border-white/15 object-cover"
                          />

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-white">{photo.displayName}</p>
                            <p className="mt-1 text-xs text-white/40">{photo.sizeLabel} · Uploaded</p>

                            <div className="mt-4 flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="border border-white/20 px-4 py-2 text-xs tracking-[0.12em] text-white/70 uppercase transition hover:border-[#c3195d] hover:text-[#c3195d]"
                              >
                                Replace
                              </button>
                              <button
                                type="button"
                                onClick={removeProfilePicture}
                                className="border border-white/20 px-4 py-2 text-xs tracking-[0.12em] text-white/50 uppercase transition hover:border-red-400/50 hover:text-red-300"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          onDragOver={(event) => {
                            event.preventDefault();
                            setIsDragging(true);
                          }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={handleDrop}
                          className={[
                            'flex flex-col items-center justify-center border border-dashed px-6 py-12 text-center transition',
                            isDragging
                              ? 'border-[#c3195d] bg-[#c3195d]/10'
                              : 'border-white/25 bg-white/[0.02]',
                          ].join(' ')}
                        >
                          <UploadCloud
                            className={[
                              'mb-4 h-8 w-8 transition',
                              isDragging ? 'text-[#c3195d]' : 'text-white/45',
                            ].join(' ')}
                          />

                          <p className="text-sm font-medium text-white">
                            {photo.status === 'uploading'
                              ? 'Uploading your picture...'
                              : 'Choose a file or drag & drop it here'}
                          </p>
                          <p className="mt-2 text-xs leading-5 text-white/35">
                            {PROFILE_PIC_FORMAT_HINT}
                          </p>

                          <button
                            type="button"
                            disabled={photo.status === 'uploading'}
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-6 border border-white/25 px-6 py-2 text-xs tracking-[0.14em] text-white/80 uppercase transition hover:border-[#c3195d] hover:text-[#c3195d] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {photo.status === 'uploading' ? 'Uploading...' : 'Browse File'}
                          </button>
                        </div>
                      )}

                      {photo.status === 'error' && photo.message && (
                        <p className="mt-3 text-xs leading-5 text-red-300">{photo.message}</p>
                      )}
                    </div>

                    <div className="border border-white/10 bg-black p-5">
                      <label className="mb-4 block text-sm font-medium text-white">2. Background music</label>

                      {/* One shared player: selecting a new track swaps the source. */}
                      <audio
                        ref={audioRef}
                        preload="none"
                        onLoadedMetadata={handleLoadedMetadata}
                        onTimeUpdate={(event) => setAudioTime(event.currentTarget.currentTime)}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => {
                          setIsPlaying(false);
                          setAudioTime(0);
                        }}
                        className="hidden"
                      />

                      {bgmError && <p className="mb-3 text-xs leading-5 text-red-300">{bgmError}</p>}

                      {bgmTracks.length === 0 && !bgmError ? (
                        <p className="text-sm text-white/40">Loading music...</p>
                      ) : (
                        <div className="space-y-2">
                          {bgmTracks.map((track) => {
                            const isSelected = form.musicName === track.filename;
                            const isActive = activeTrack === track.filename;
                            const isTrackPlaying = isActive && isPlaying;
                            const progress =
                              isActive && audioDuration > 0
                                ? Math.min(100, (audioTime / audioDuration) * 100)
                                : 0;

                            return (
                              <label
                                key={track.filename}
                                className={[
                                  'block cursor-pointer border px-4 py-3 transition',
                                  isSelected
                                    ? 'border-[#c3195d] bg-[#c3195d]/10'
                                    : 'border-white/10 bg-black hover:border-white/25',
                                ].join(' ')}
                              >
                                <span className="flex items-center gap-4">
                                  <input
                                    type="radio"
                                    name="musicName"
                                    value={track.filename}
                                    checked={isSelected}
                                    onChange={() => updateField('musicName')(track.filename)}
                                    className="accent-[#c3195d]"
                                  />

                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm text-white">{track.title}</span>
                                    {track.artist && (
                                      <span className="block truncate text-xs text-white/40">
                                        {track.artist}
                                      </span>
                                    )}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.preventDefault();
                                      toggleTrackPreview(track);
                                    }}
                                    className="flex-shrink-0 border border-white/20 p-2 text-white/60 transition hover:border-[#c3195d] hover:text-[#c3195d]"
                                    aria-label={
                                      isTrackPlaying ? `Pause ${track.title}` : `Play ${track.title}`
                                    }
                                  >
                                    {isTrackPlaying ? (
                                      <Pause className="h-4 w-4" />
                                    ) : (
                                      <Play className="h-4 w-4" />
                                    )}
                                  </button>
                                </span>

                                <span className="mt-3 flex items-center gap-3">
                                  <span className="w-9 text-right text-[11px] tabular-nums text-white/35">
                                    {isActive ? formatTime(audioTime) : '0:00'}
                                  </span>

                                  {/* Click anywhere to seek. preventDefault stops the
                                      surrounding label from also toggling the radio. */}
                                  <span
                                    role="progressbar"
                                    aria-label={`${track.title} progress`}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-valuenow={Math.round(progress)}
                                    onClick={(event) => {
                                      event.preventDefault();
                                      const bounds = event.currentTarget.getBoundingClientRect();
                                      if (!bounds.width) return;
                                      seekTrack(track, (event.clientX - bounds.left) / bounds.width);
                                    }}
                                    className="group relative h-1.5 flex-1 cursor-pointer bg-white/10"
                                  >
                                    <span
                                      className="absolute inset-y-0 left-0 bg-[#c3195d] transition-[width] duration-150"
                                      style={{ width: `${progress}%` }}
                                    />
                                    <span className="absolute inset-x-0 -inset-y-2 group-hover:bg-white/[0.03]" />
                                  </span>

                                  <span className="w-9 text-[11px] tabular-nums text-white/35">
                                    {isActive && audioDuration ? formatTime(audioDuration) : '--:--'}
                                  </span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {selectedTrack && (
                        <p className="mt-3 text-xs leading-5 text-white/40">
                          Selected: {selectedTrack.title}
                        </p>
                      )}
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

                    <div className="grid gap-5 md:grid-cols-2">
                      <Field label="Username" hint="Used to sign in. Must be unique.">
                        <input
                          required
                          className={inputClass}
                          placeholder="Choose a username"
                          value={form.username}
                          onChange={(event) => updateField('username')(event.target.value)}
                        />
                        {usernameCheck.message && (
                          <p className={`text-xs leading-5 ${fieldStatusClass(usernameCheck.status)}`}>
                            {usernameCheck.message}
                          </p>
                        )}
                      </Field>

                      <Field label="Email">
                        <input
                          required
                          type="email"
                          className={inputClass}
                          placeholder="Enter email"
                          value={form.adminEmail}
                          onChange={(event) => updateField('adminEmail')(event.target.value)}
                        />
                        {emailCheck.message && (
                          <p className={`text-xs leading-5 ${fieldStatusClass(emailCheck.status)}`}>
                            {emailCheck.message}
                          </p>
                        )}
                      </Field>

                      <Field label="First Name">
                        <input
                          required
                          className={inputClass}
                          placeholder="Enter first name"
                          value={form.adminFirstName}
                          onChange={(event) => updateField('adminFirstName')(event.target.value)}
                        />
                      </Field>

                      <Field label="Last Name">
                        <input
                          required
                          className={inputClass}
                          placeholder="Enter last name"
                          value={form.adminLastName}
                          onChange={(event) => updateField('adminLastName')(event.target.value)}
                        />
                      </Field>

                      <Field label="Gender">
                        <div className="flex h-9 items-center gap-6 border border-white/10 bg-black px-4">
                          {[
                            { value: 'M', label: 'Male' },
                            { value: 'F', label: 'Female' },
                            { value: 'O', label: 'Other' },
                          ].map((gender) => (
                            <label
                              key={gender.value}
                              className="flex items-center gap-2 text-sm text-white/70"
                            >
                              <input
                                required
                                type="radio"
                                name="adminGender"
                                value={gender.value}
                                checked={form.adminGender === gender.value}
                                onChange={(event) =>
                                  updateField('adminGender')(event.target.value as Gender)
                                }
                                className="accent-[#c3195d]"
                              />
                              {gender.label}
                            </label>
                          ))}
                        </div>
                      </Field>

                      <Field label="Contact Number">
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
                      </Field>

                      <Field
                        label="Password"
                        hint="At least 8 characters, with an uppercase letter, a lowercase letter and a number."
                      >
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
                      </Field>

                      <Field label="Confirm Password">
                        <input
                          required
                          type="password"
                          className={inputClass}
                          placeholder="Re-enter password"
                          value={form.confirmPassword}
                          onChange={(event) => updateField('confirmPassword')(event.target.value)}
                        />
                        {form.confirmPassword && (
                          <p
                            className={`text-xs leading-5 ${
                              form.adminPassword === form.confirmPassword
                                ? 'text-emerald-300'
                                : 'text-amber-300'
                            }`}
                          >
                            {form.adminPassword === form.confirmPassword
                              ? 'Passwords match.'
                              : 'Passwords do not match.'}
                          </p>
                        )}
                      </Field>
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
                      href={CUSTOMER_LOGIN_URL}
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
              </>
              )}
            </section>
        </div>
      </main>
    </div>
  );
}