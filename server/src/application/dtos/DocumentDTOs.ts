import { z } from 'zod';
import { DocumentClassification, DocumentVisibility, DocumentScope } from '@prisma/client';

const policyLists = {
  allowedRoles: z.array(z.string()).optional(),
  deniedRoles: z.array(z.string()).optional(),
  allowedUsers: z.array(z.string()).optional(),
  deniedUsers: z.array(z.string()).optional(),
  allowedDepartments: z.array(z.string()).optional(),
  deniedDepartments: z.array(z.string()).optional(),
};

export const CreateDocumentSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255),
    classification: z.nativeEnum(DocumentClassification).optional(),
    visibility: z.nativeEnum(DocumentVisibility).optional(),
    scope: z.nativeEnum(DocumentScope).optional(),
    departmentId: z.string().nullable().optional(),
    mimeType: z.string().min(1),
    sizeBytes: z.number().int().positive(),
    ...policyLists,
  }),
});

export const UpdateDocumentSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    classification: z.nativeEnum(DocumentClassification).optional(),
    visibility: z.nativeEnum(DocumentVisibility).optional(),
    scope: z.nativeEnum(DocumentScope).optional(),
    departmentId: z.string().nullable().optional(),
    isFavorited: z.boolean().optional(),
    ...policyLists,
  }),
});

export const DocumentIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const DocumentVersionFileParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    versionId: z.string().uuid(),
  }),
});

export type CreateDocumentDTO = z.infer<typeof CreateDocumentSchema>['body'];
export type UpdateDocumentDTO = z.infer<typeof UpdateDocumentSchema>['body'];
