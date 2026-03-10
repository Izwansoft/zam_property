// Form components — field wrappers, form infrastructure, Zod schema patterns

// FormWrapper & layout helpers
export {
  FormWrapper,
  FormSection,
  FormGrid,
  FormActions,
  setServerErrors,
  type FormWrapperProps,
  type FormSectionProps,
  type FormGridProps,
  type FormActionsProps,
} from './form-wrapper';

// Field wrappers (RHF + shadcn/ui)
export {
  TextField,
  PasswordField,
  NumberField,
  TextAreaField,
  SelectField,
  CheckboxField,
  SwitchField,
  RadioGroupField,
  type SelectOption,
  type TextFieldProps,
  type PasswordFieldProps,
  type NumberFieldProps,
  type TextAreaFieldProps,
  type SelectFieldProps,
  type CheckboxFieldProps,
  type SwitchFieldProps,
  type RadioGroupFieldProps,
} from './form-fields';

// Error display components
export {
  FormRootError,
  FormErrorSummary,
  FieldError,
  type FormRootErrorProps,
  type FormErrorSummaryProps,
  type FieldErrorProps,
} from './form-errors';

// Reusable Zod schema patterns
export {
  emailSchema,
  phoneSchema,
  optionalPhoneSchema,
  passwordSchema,
  loginPasswordSchema,
  priceSchema,
  optionalPriceSchema,
  requiredStringSchema,
  optionalStringSchema,
  descriptionSchema,
  optionalDescriptionSchema,
  urlSchema,
  optionalUrlSchema,
  positiveIntSchema,
  nonNegativeIntSchema,
  dateSchema,
  optionalDateSchema,
  uuidSchema,
  enumSchema,
  confirmPasswordSchema,
  paginationSchema,
  sortSchema,
} from './schema-patterns';
