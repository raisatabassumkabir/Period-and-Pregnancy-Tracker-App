import { z } from 'zod';

/**
 * Validation shared by the login and register forms.
 *
 * Strength rules apply to a *new* password only. Login deliberately checks
 * nothing beyond "not empty": an account created before these rules existed
 * would otherwise fail client-side validation and could never sign in again.
 */

export const MIN_PASSWORD_LENGTH = 8;

export const emailField = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Enter a valid email');

/** The rules shown live under the password field on register — kept terse
 * because they sit on one line. */
export const PASSWORD_RULES = [
  {
    id: 'length',
    label: `${MIN_PASSWORD_LENGTH}+ chars`,
    isMet: (value: string) => value.length >= MIN_PASSWORD_LENGTH,
  },
  {
    id: 'letter',
    label: '1 letter',
    isMet: (value: string) => /[A-Za-z]/.test(value),
  },
  {
    id: 'number',
    label: '1 number',
    isMet: (value: string) => /[0-9]/.test(value),
  },
] as const;

export const newPasswordField = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters`)
  .regex(/[A-Za-z]/, 'Include at least one letter')
  .regex(/[0-9]/, 'Include at least one number');

export const existingPasswordField = z.string().min(1, 'Password is required');

export const loginSchema = z.object({
  email: emailField,
  password: existingPasswordField,
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .refine((value) => value === '' || value.trim().length >= 2, {
        message: 'Name must be at least 2 characters',
      })
      .optional(),
    email: emailField,
    password: newPasswordField,
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords must match',
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
