import * as Yup from 'yup';

/** sLife API: password min 10 + letters, numbers, special char (aligned with ClayMaster style) */
export const passwordRegex =
  /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{10,}$/;

export const nameRegex = /^[a-zA-Z\s'.-]+$/;

/** Common personal email domains rejected by sLife business-email rule */
const PERSONAL_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'icloud.com',
  'aol.com',
  'mail.com',
  'protonmail.com',
  'proton.me',
  'gmx.com',
  'yandex.com',
];

export const isBusinessEmail = email => {
  if (!email || typeof email !== 'string') return false;
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return !PERSONAL_EMAIL_DOMAINS.includes(domain);
};

export const nameValidation = (min, max) =>
  Yup.string()
    .required('This field is required')
    .min(min, `Name must be at least ${min} characters long.`)
    .max(max, `Name must be at most ${max} characters long.`)
    .matches(
      nameRegex,
      'Name can only contain alphabetic characters and spaces.',
    );

export const businessEmailValidation = () =>
  Yup.string()
    .email('Invalid email')
    .required('Email is required')
    .test(
      'business-email',
      'Please use your business email address.',
      value => !value || isBusinessEmail(value),
    );

export const imageValidation = Yup.mixed()
  .required('Image is required')
  .test('fileType', 'Only JPEG, PNG, and JPG images are allowed', value => {
    if (!value || value.length === 0) return false;
    if (typeof value === 'string') return true;

    const supportedFormats = ['image/jpeg', 'image/png', 'image/jpg'];

    if (Array.isArray(value)) {
      return value.every(file => supportedFormats.includes(file.type));
    }

    return supportedFormats.includes(value?.type || value);
  });
