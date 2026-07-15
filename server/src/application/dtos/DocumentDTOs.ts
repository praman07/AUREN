import { z } from 'zod';
import { DocumentClassification } from '@prisma/client';

export const CreateDocumentSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255),
    classification: z.nativeEnum(DocumentClassification).optional(),
    mimeType: z.string().min(1),
    sizeBytes: z.number().int().positive(),
  }),
});

export const UpdateDocumentSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    classification: z.nativeEnum(DocumentClassification).optional(),
    isFavorited: z.boolean().optional(),
  }),
});

export const DocumentIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export type CreateDocumentDTO = z.infer<typeof CreateDocumentSchema>['body'];
export type UpdateDocumentDTO = z.infer<typeof UpdateDocumentSchema>['body'];
