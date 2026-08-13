import { z } from 'zod';
import { IndustryTemplate } from '@prisma/client';

export const OnboardOrganizationSchema = z.object({
  body: z.object({
    orgName: z.string().min(2, 'Organization name must be at least 2 characters'),
    domain: z.string().optional(),
    industry: z.nativeEnum(IndustryTemplate).optional().default(IndustryTemplate.CORPORATE),
    superAdmin: z.object({
      email: z.string().email('Invalid work email address'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      firstName: z.string().min(1, 'First name is required'),
      lastName: z.string().min(1, 'Last name is required'),
    }),
    customDepartments: z.array(z.string()).optional().default([]),
    customRoles: z.array(z.string()).optional().default([]),
    initialMembers: z.array(
      z.object({
        email: z.string().email(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        roleName: z.string().optional(),
        departmentName: z.string().optional(),
        password: z.string().optional(),
      })
    ).optional().default([]),
  }),
});

export type OnboardOrganizationInput = z.infer<typeof OnboardOrganizationSchema>['body'];
