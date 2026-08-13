import * as Yup from 'yup';
import {
  businessEmailValidation,
  nameValidation,
  passwordRegex,
} from './customValidations';

const SignInSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

const SignUpSchema = Yup.object().shape({
  full_name: nameValidation(2, 255),
  email: businessEmailValidation(),
  password: Yup.string()
    .required('Password is required')
    .min(10, 'Password must be at least 10 characters')
    .matches(
      passwordRegex,
      'Password must contain at least one letter, one number, and one special character.',
    ),
  password_confirmation: Yup.string()
    .required('Please confirm your password')
    .oneOf([Yup.ref('password')], 'Passwords do not match'),
  terms_accepted: Yup.boolean()
    .oneOf([true], 'You must accept the terms')
    .required('You must accept the terms'),
});

const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
});

const VerifyResetOtpSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  otp: Yup.string()
    .required('OTP is required')
    .matches(/^\d{6}$/, 'Enter the 6-digit code from your email'),
});

const ResetPasswordSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  otp: Yup.string()
    .required('OTP is required')
    .matches(/^\d{6}$/, 'Enter the 6-digit code from your email'),
  password: Yup.string()
    .required('Password is required')
    .min(10, 'Password must be at least 10 characters')
    .matches(
      passwordRegex,
      'Password must contain at least one letter, one number, and one special character.',
    ),
  password_confirmation: Yup.string()
    .required('Please confirm your password')
    .oneOf([Yup.ref('password')], 'Passwords do not match'),
});

export default {
  SignUpSchema,
  SignInSchema,
  ForgotPasswordSchema,
  VerifyResetOtpSchema,
  ResetPasswordSchema,
};
