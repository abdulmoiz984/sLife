import * as Yup from 'yup';
import { nameValidation } from './customValidations';

const BasicInfoSchema = Yup.object().shape({
  full_name: nameValidation(2, 255),
  phone_number: Yup.string().required('Phone number is required'),
  location: Yup.string().required('Location is required'),
});

const ProfessionalInfoSchema = Yup.object().shape({
  professional_title: Yup.string().required('Professional title is required'),
  industry: Yup.string().required('Industry is required'),
  years_of_experience: Yup.number()
    .required('Years of experience is required')
    .min(0, 'Must be 0 or more')
    .max(80, 'Must be 80 or less'),
  professional_role: Yup.string().required('Professional role is required'),
});

const OrganizationSchema = Yup.object().shape({
  company_name: Yup.string().nullable(),
  organization_size: Yup.string().nullable(),
  website: Yup.string().url('Enter a valid URL').nullable(),
});

const BioInterestsSchema = Yup.object().shape({
  bio: Yup.string()
    .required('Bio is required')
    .max(500, 'Bio must be at most 500 characters'),
  interests: Yup.array()
    .of(Yup.string())
    .min(2, 'Select at least 2 interests')
    .required('Interests are required'),
});

const NetworkingGoalsSchema = Yup.object().shape({
  networking_goals: Yup.array()
    .of(Yup.string())
    .min(1, 'Select at least 1 networking goal')
    .required('Networking goals are required'),
  submit_for_verification: Yup.boolean().nullable(),
});

const EducationSchema = Yup.object().shape({
  institution: Yup.string().required('Institution is required'),
  degree: Yup.string().nullable(),
  field_of_study: Yup.string().nullable(),
  start_date: Yup.string().nullable(),
  end_date: Yup.string().nullable(),
  is_current: Yup.boolean().nullable(),
  description: Yup.string().nullable(),
});

export default {
  BasicInfoSchema,
  ProfessionalInfoSchema,
  OrganizationSchema,
  BioInterestsSchema,
  NetworkingGoalsSchema,
  EducationSchema,
};
