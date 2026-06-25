import { Document } from '../types';

export const mockDocuments: Document[] = [
  {
    id: 'doc-001', name: 'Q3 Financial Overview.pdf', owner: 'Sarah Jenkins', department: 'Finance', classification: 'SECRET',
    tags: ['Quarterly', 'Report', '2026'], version: 'v1.2', size: '4.2 MB', uploadedAt: '2026-10-01T09:00:00Z', modifiedAt: '2026-10-05T14:30:00Z',
    aiStatus: 'Ready', sharingStatus: 'Shared'
  },
  {
    id: 'doc-002', name: 'Employee Handbook 2026.docx', owner: 'Michael Scott', department: 'HR', classification: 'INTERNAL',
    tags: ['Policies', 'Onboarding'], version: 'v3.0', size: '1.8 MB', uploadedAt: '2026-01-15T08:00:00Z', modifiedAt: '2026-06-20T11:15:00Z',
    aiStatus: 'Ready', sharingStatus: 'Shared'
  },
  {
    id: 'doc-003', name: 'Project Alpha Blueprint.pdf', owner: 'Elena Rodriguez', department: 'Engineering', classification: 'CONFIDENTIAL',
    tags: ['Architecture', 'Alpha'], version: 'v0.9', size: '12.5 MB', uploadedAt: '2026-08-12T10:45:00Z', modifiedAt: '2026-08-14T16:20:00Z',
    aiStatus: 'Processing', sharingStatus: 'Private'
  },
  {
    id: 'doc-004', name: 'Marketing Campaign Deck.pptx', owner: 'David Kim', department: 'Marketing', classification: 'INTERNAL',
    tags: ['Q4', 'Deck', 'External'], version: 'v2.1', size: '8.4 MB', uploadedAt: '2026-09-25T13:20:00Z', modifiedAt: '2026-09-28T09:10:00Z',
    aiStatus: 'Ready', sharingStatus: 'Shared'
  },
  {
    id: 'doc-005', name: 'SOC2 Compliance Audit.pdf', owner: 'Amanda Chen', department: 'Security', classification: 'SECRET',
    tags: ['Audit', 'Compliance', 'SOC2'], version: 'v1.0', size: '5.1 MB', uploadedAt: '2026-07-10T08:30:00Z', modifiedAt: '2026-07-10T08:30:00Z',
    aiStatus: 'Ready', sharingStatus: 'Private'
  },
  {
    id: 'doc-006', name: 'Customer Onboarding SOP.md', owner: 'James Wilson', department: 'Customer Success', classification: 'INTERNAL',
    tags: ['SOP', 'Onboarding'], version: 'v4.5', size: '0.2 MB', uploadedAt: '2026-05-05T14:00:00Z', modifiedAt: '2026-08-01T10:00:00Z',
    aiStatus: 'Embedding', sharingStatus: 'Shared'
  },
  {
    id: 'doc-007', name: 'Q2 All-Hands Recording.mp4', owner: 'Sarah Jenkins', department: 'Executive', classification: 'INTERNAL',
    tags: ['Video', 'All-Hands'], version: 'v1.0', size: '450.0 MB', uploadedAt: '2026-07-02T16:00:00Z', modifiedAt: '2026-07-02T16:00:00Z',
    aiStatus: 'Failed', sharingStatus: 'Shared'
  },
  {
    id: 'doc-008', name: 'API Gateway Architecture.pdf', owner: 'Elena Rodriguez', department: 'Engineering', classification: 'CONFIDENTIAL',
    tags: ['Backend', 'Infrastructure'], version: 'v2.0', size: '3.3 MB', uploadedAt: '2026-03-20T11:00:00Z', modifiedAt: '2026-08-05T09:45:00Z',
    aiStatus: 'Ready', sharingStatus: 'Shared'
  },
  {
    id: 'doc-009', name: 'Vendor Contracts 2026.zip', owner: 'Robert Evans', department: 'Legal', classification: 'SECRET',
    tags: ['Contracts', 'Vendors'], version: 'v1.1', size: '15.6 MB', uploadedAt: '2026-02-28T09:30:00Z', modifiedAt: '2026-04-15T13:20:00Z',
    aiStatus: 'Failed', sharingStatus: 'Private'
  },
  {
    id: 'doc-010', name: 'Public Press Release.docx', owner: 'David Kim', department: 'Marketing', classification: 'PUBLIC',
    tags: ['Press', 'PR'], version: 'v5.0', size: '1.1 MB', uploadedAt: '2026-09-30T15:45:00Z', modifiedAt: '2026-10-02T10:10:00Z',
    aiStatus: 'Ready', sharingStatus: 'Shared'
  },
  {
    id: 'doc-011', name: 'Database Migration Plan.md', owner: 'Elena Rodriguez', department: 'Engineering', classification: 'CONFIDENTIAL',
    tags: ['Database', 'Migration'], version: 'v1.0', size: '0.5 MB', uploadedAt: '2026-08-20T14:15:00Z', modifiedAt: '2026-08-25T11:30:00Z',
    aiStatus: 'Ready', sharingStatus: 'Private'
  },
  {
    id: 'doc-012', name: 'Sales Playbook 2026.pdf', owner: 'Marcus Johnson', department: 'Sales', classification: 'INTERNAL',
    tags: ['Playbook', 'Sales'], version: 'v2.2', size: '6.7 MB', uploadedAt: '2026-01-10T08:45:00Z', modifiedAt: '2026-06-01T15:20:00Z',
    aiStatus: 'Ready', sharingStatus: 'Shared'
  },
  {
    id: 'doc-013', name: 'Q4 Hiring Plan.xlsx', owner: 'Michael Scott', department: 'HR', classification: 'CONFIDENTIAL',
    tags: ['Hiring', 'Planning'], version: 'v1.5', size: '2.1 MB', uploadedAt: '2026-09-15T10:00:00Z', modifiedAt: '2026-10-01T16:45:00Z',
    aiStatus: 'Processing', sharingStatus: 'Private'
  },
  {
    id: 'doc-014', name: 'Infrastructure Cost Analysis.pdf', owner: 'Sarah Jenkins', department: 'Finance', classification: 'SECRET',
    tags: ['Costs', 'AWS', 'Analysis'], version: 'v1.0', size: '3.8 MB', uploadedAt: '2026-08-05T09:15:00Z', modifiedAt: '2026-08-10T14:00:00Z',
    aiStatus: 'Ready', sharingStatus: 'Shared'
  },
  {
    id: 'doc-015', name: 'Brand Guidelines.pdf', owner: 'David Kim', department: 'Marketing', classification: 'PUBLIC',
    tags: ['Brand', 'Design'], version: 'v4.0', size: '22.5 MB', uploadedAt: '2025-11-20T11:30:00Z', modifiedAt: '2026-02-15T09:45:00Z',
    aiStatus: 'Ready', sharingStatus: 'Shared'
  },
  {
    id: 'doc-016', name: 'Incident Response Plan.docx', owner: 'Amanda Chen', department: 'Security', classification: 'CONFIDENTIAL',
    tags: ['Security', 'Incident', 'SOP'], version: 'v2.5', size: '1.9 MB', uploadedAt: '2026-04-12T13:00:00Z', modifiedAt: '2026-07-22T10:15:00Z',
    aiStatus: 'Ready', sharingStatus: 'Shared'
  },
  {
    id: 'doc-017', name: 'Q3 Board Deck.pptx', owner: 'Sarah Jenkins', department: 'Executive', classification: 'SECRET',
    tags: ['Board', 'Deck', 'Q3'], version: 'v3.1', size: '14.2 MB', uploadedAt: '2026-10-03T15:30:00Z', modifiedAt: '2026-10-04T18:00:00Z',
    aiStatus: 'Embedding', sharingStatus: 'Private'
  },
  {
    id: 'doc-018', name: 'Frontend Architecture V2.md', owner: 'Elena Rodriguez', department: 'Engineering', classification: 'INTERNAL',
    tags: ['Frontend', 'Architecture'], version: 'v1.0', size: '0.8 MB', uploadedAt: '2026-09-10T09:00:00Z', modifiedAt: '2026-09-12T14:20:00Z',
    aiStatus: 'Ready', sharingStatus: 'Shared'
  },
  {
    id: 'doc-019', name: 'Enterprise License Agreement.pdf', owner: 'Robert Evans', department: 'Legal', classification: 'CONFIDENTIAL',
    tags: ['Legal', 'Agreement', 'Template'], version: 'v5.2', size: '3.4 MB', uploadedAt: '2026-01-05T10:30:00Z', modifiedAt: '2026-05-18T11:45:00Z',
    aiStatus: 'Ready', sharingStatus: 'Shared'
  },
  {
    id: 'doc-020', name: 'Customer Support Scripts.txt', owner: 'James Wilson', department: 'Customer Success', classification: 'INTERNAL',
    tags: ['Support', 'Scripts'], version: 'v8.4', size: '0.1 MB', uploadedAt: '2026-03-15T08:15:00Z', modifiedAt: '2026-09-20T16:00:00Z',
    aiStatus: 'Ready', sharingStatus: 'Shared'
  },
  {
    id: 'doc-021', name: 'Competitor Analysis 2026.pdf', owner: 'Marcus Johnson', department: 'Sales', classification: 'CONFIDENTIAL',
    tags: ['Analysis', 'Competitors'], version: 'v1.0', size: '8.9 MB', uploadedAt: '2026-06-10T14:30:00Z', modifiedAt: '2026-06-12T09:15:00Z',
    aiStatus: 'Processing', sharingStatus: 'Shared'
  },
  {
    id: 'doc-022', name: 'Benefits Overview 2027.pdf', owner: 'Michael Scott', department: 'HR', classification: 'INTERNAL',
    tags: ['Benefits', '2027'], version: 'v0.5', size: '4.6 MB', uploadedAt: '2026-10-05T11:00:00Z', modifiedAt: '2026-10-06T13:45:00Z',
    aiStatus: 'Embedding', sharingStatus: 'Private'
  },
  {
    id: 'doc-023', name: 'API Documentation.md', owner: 'Elena Rodriguez', department: 'Engineering', classification: 'PUBLIC',
    tags: ['API', 'Docs'], version: 'v3.1', size: '1.2 MB', uploadedAt: '2026-02-20T09:00:00Z', modifiedAt: '2026-08-30T10:30:00Z',
    aiStatus: 'Ready', sharingStatus: 'Shared'
  },
  {
    id: 'doc-024', name: 'Penetration Test Report.pdf', owner: 'Amanda Chen', department: 'Security', classification: 'SECRET',
    tags: ['Security', 'PenTest', 'Audit'], version: 'v1.0', size: '9.3 MB', uploadedAt: '2026-05-15T15:45:00Z', modifiedAt: '2026-05-16T10:00:00Z',
    aiStatus: 'Ready', sharingStatus: 'Private'
  },
  {
    id: 'doc-025', name: 'Social Media Assets.zip', owner: 'David Kim', department: 'Marketing', classification: 'PUBLIC',
    tags: ['Social', 'Assets', 'Images'], version: 'v1.0', size: '125.0 MB', uploadedAt: '2026-09-01T08:30:00Z', modifiedAt: '2026-09-01T08:30:00Z',
    aiStatus: 'Failed', sharingStatus: 'Shared'
  }
];
