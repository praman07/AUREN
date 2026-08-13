import { z } from 'zod';

export const LoginSchema = z.object({
  body: z.object({
    email: z.string().email('A valid email is required').max(320),
    password: z.string().min(8, 'Password must be at least 8 characters').max(256),
  }),
});

export type LoginDTO = z.infer<typeof LoginSchema>['body'];

export const LogoutSchema = z.object({
  body: z.object({}).optional(),
});

/** Public, secret-free view of a user used in auth responses. */
export interface PublicUserView {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  organizationId: string;
  industry: string;
  departmentId: string | null;
  departments: string[];
  role: string;
  roles: string[];
  isSuperAdmin: boolean;
}