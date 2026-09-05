import { PrismaClient, DocumentVisibility, DocumentClassification, DocumentScope } from '@prisma/client';
import crypto from 'crypto';
import { PasswordService } from '../src/shared/security/password';
import { LlamaCppEmbeddingProvider } from '../src/infrastructure/providers/adapters/embedding/LlamaCppEmbeddingProvider';
import { QdrantVectorStoreProvider } from '../src/infrastructure/providers/adapters/vector/QdrantVectorStoreProvider';

const prisma = new PrismaClient();
const embeddingProvider = new LlamaCppEmbeddingProvider();
const qdrantProvider = new QdrantVectorStoreProvider();

const DEV_PASSWORD = 'NorthstarTest@2026!';

function uuidFromKey(key: string): string {
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '4' + hash.substring(13, 16),
    '8' + hash.substring(17, 20),
    hash.substring(20, 32)
  ].join('-');
}

async function generateEmbeddingSafe(text: string): Promise<number[]> {
  try {
    const res = await embeddingProvider.embedText(text);
    if (res && res.length > 0) {
      return res;
    }
  } catch (err: any) {
    console.warn(`⚠️ Ollama embedding unavailable for text ("${text.substring(0, 30)}..."). Generating deterministic 4096-dim vector.`);
  }

  // Deterministic 4096-dim fallback vector based on text hash
  const hash = crypto.createHash('sha256').update(text).digest();
  const vec = new Array(4096).fill(0);
  for (let i = 0; i < 4096; i++) {
    vec[i] = (hash[i % hash.length] / 255.0) * 2.0 - 1.0;
  }
  return vec;
}

async function main() {
  console.log('================================================================================');
  console.log('         AUREN ENTERPRISE ENVIRONMENT SEED — PERSISTENT DB & QDRANT SEED        ');
  console.log('================================================================================\n');

  const passwordHash = PasswordService.hash(DEV_PASSWORD);

  // ---------------------------------------------------------------------------
  // 1. ORGANIZATIONS
  // ---------------------------------------------------------------------------
  console.log('🌱 [1/6] Seeding Organizations...');

  const northstarOrgId = uuidFromKey('org-northstar-technologies');
  const bluepeakOrgId = uuidFromKey('org-bluepeak-systems');

  const northstarOrg = await prisma.organization.upsert({
    where: { id: northstarOrgId },
    update: {
      name: 'Northstar Technologies Pvt. Ltd.',
      domain: 'northstar-test.local',
      industry: 'CORPORATE',
      webAccessEnabled: true
    },
    create: {
      id: northstarOrgId,
      name: 'Northstar Technologies Pvt. Ltd.',
      domain: 'northstar-test.local',
      industry: 'CORPORATE',
      webAccessEnabled: true
    }
  });

  const bluepeakOrg = await prisma.organization.upsert({
    where: { id: bluepeakOrgId },
    update: {
      name: 'BluePeak Systems Pvt. Ltd.',
      domain: 'bluepeak-test.local',
      industry: 'CORPORATE',
      webAccessEnabled: true
    },
    create: {
      id: bluepeakOrgId,
      name: 'BluePeak Systems Pvt. Ltd.',
      domain: 'bluepeak-test.local',
      industry: 'CORPORATE',
      webAccessEnabled: true
    }
  });

  console.log(` ✅ Northstar Technologies Org ID: ${northstarOrg.id}`);
  console.log(` ✅ BluePeak Systems Org ID:       ${bluepeakOrg.id}`);

  // ---------------------------------------------------------------------------
  // 2. DEPARTMENTS
  // ---------------------------------------------------------------------------
  console.log('\n🌱 [2/6] Seeding Departments...');

  const northstarDeptNames = [
    'Executive', 'Engineering', 'Product', 'Human Resources',
    'Finance', 'Sales', 'Marketing', 'Legal'
  ];

  const northstarDepts: Record<string, any> = {};
  for (const name of northstarDeptNames) {
    const deptId = uuidFromKey(`dept-northstar-${name}`);
    const dept = await prisma.department.upsert({
      where: { id: deptId },
      update: { name, description: `Northstar ${name} Department` },
      create: {
        id: deptId,
        organizationId: northstarOrg.id,
        name,
        description: `Northstar ${name} Department`
      }
    });
    northstarDepts[name] = dept;
  }

  const bluepeakDeptNames = ['Executive', 'Engineering', 'Human Resources', 'Finance'];
  const bluepeakDepts: Record<string, any> = {};
  for (const name of bluepeakDeptNames) {
    const deptId = uuidFromKey(`dept-bluepeak-${name}`);
    const dept = await prisma.department.upsert({
      where: { id: deptId },
      update: { name, description: `BluePeak ${name} Department` },
      create: {
        id: deptId,
        organizationId: bluepeakOrg.id,
        name,
        description: `BluePeak ${name} Department`
      }
    });
    bluepeakDepts[name] = dept;
  }

  console.log(` ✅ Northstar Depts: ${Object.keys(northstarDepts).join(', ')}`);
  console.log(` ✅ BluePeak Depts:  ${Object.keys(bluepeakDepts).join(', ')}`);

  // ---------------------------------------------------------------------------
  // 3. ROLES
  // ---------------------------------------------------------------------------
  console.log('\n🌱 [3/6] Seeding Organizational Roles...');

  const northstarRoleDefs = [
    { name: 'CEO', desc: 'Chief Executive Officer' },
    { name: 'CTO', desc: 'Chief Technology Officer' },
    { name: 'CFO', desc: 'Chief Financial Officer' },
    { name: 'Engineering Manager', desc: 'Engineering Manager' },
    { name: 'Senior Backend Engineer', desc: 'Senior Backend Engineer' },
    { name: 'Senior Frontend Engineer', desc: 'Senior Frontend Engineer' },
    { name: 'Backend Engineer', desc: 'Backend Engineer' },
    { name: 'DevOps', desc: 'DevOps Lead / SRE' },
    { name: 'Junior Developer', desc: 'Junior Developer' },
    { name: 'Product Manager', desc: 'Product Manager' },
    { name: 'Product Analyst', desc: 'Product Analyst' },
    { name: 'HR Director', desc: 'HR Director' },
    { name: 'HR Manager', desc: 'HR Manager' },
    { name: 'Finance Manager', desc: 'Finance Manager' },
    { name: 'Senior Accountant', desc: 'Senior Accountant' },
    { name: 'Sales Director', desc: 'Sales Director' },
    { name: 'Account Executive', desc: 'Account Executive' },
    { name: 'Marketing Manager', desc: 'Marketing Manager' },
    { name: 'Legal Counsel', desc: 'Legal Counsel' },
    { name: 'Super Admin', desc: 'Global Administrative Privileges' }
  ];

  const northstarRoles: Record<string, any> = {};
  for (const r of northstarRoleDefs) {
    const roleId = uuidFromKey(`role-northstar-${r.name}`);
    const role = await prisma.role.upsert({
      where: { id: roleId },
      update: { name: r.name, description: r.desc },
      create: {
        id: roleId,
        organizationId: northstarOrg.id,
        name: r.name,
        description: r.desc,
        isSystem: r.name === 'Super Admin'
      }
    });
    northstarRoles[r.name] = role;
  }

  const bluepeakRoleDefs = [
    { name: 'CEO', desc: 'Chief Executive Officer' },
    { name: 'Engineering Lead', desc: 'Engineering Lead' },
    { name: 'HR Manager', desc: 'HR Manager' },
    { name: 'Finance Manager', desc: 'Finance Manager' },
    { name: 'Super Admin', desc: 'Global Administrative Privileges' }
  ];

  const bluepeakRoles: Record<string, any> = {};
  for (const r of bluepeakRoleDefs) {
    const roleId = uuidFromKey(`role-bluepeak-${r.name}`);
    const role = await prisma.role.upsert({
      where: { id: roleId },
      update: { name: r.name, description: r.desc },
      create: {
        id: roleId,
        organizationId: bluepeakOrg.id,
        name: r.name,
        description: r.desc,
        isSystem: r.name === 'Super Admin'
      }
    });
    bluepeakRoles[r.name] = role;
  }

  console.log(` ✅ Seeded ${Object.keys(northstarRoles).length} Northstar Roles & ${Object.keys(bluepeakRoles).length} BluePeak Roles.`);

  // ---------------------------------------------------------------------------
  // 4. USERS
  // ---------------------------------------------------------------------------
  console.log('\n🌱 [4/6] Seeding User Accounts (Login credentials ready)...');

  const northstarUserSpecs = [
    // Executive
    { key: 'arjun', email: 'arjun.mehta@northstar-test.local', first: 'Arjun', last: 'Mehta', dept: 'Executive', role: 'CEO', superAdmin: false },
    { key: 'vikram', email: 'vikram.sharma@northstar-test.local', first: 'Vikram', last: 'Sharma', dept: 'Executive', role: 'CTO', superAdmin: false },
    { key: 'neha', email: 'neha.kapoor@northstar-test.local', first: 'Neha', last: 'Kapoor', dept: 'Executive', role: 'CFO', superAdmin: false },

    // Engineering
    { key: 'rahul', email: 'rahul.verma@northstar-test.local', first: 'Rahul', last: 'Verma', dept: 'Engineering', role: 'Engineering Manager', superAdmin: false },
    { key: 'praman', email: 'praman.bhogal@northstar-test.local', first: 'Praman', last: 'Bhogal', dept: 'Engineering', role: 'Senior Backend Engineer', superAdmin: false },
    { key: 'ananya', email: 'ananya.singh@northstar-test.local', first: 'Ananya', last: 'Singh', dept: 'Engineering', role: 'Senior Backend Engineer', superAdmin: false },
    { key: 'karan', email: 'karan.arora@northstar-test.local', first: 'Karan', last: 'Arora', dept: 'Engineering', role: 'Senior Frontend Engineer', superAdmin: false },
    { key: 'aditya', email: 'aditya.jain@northstar-test.local', first: 'Aditya', last: 'Jain', dept: 'Engineering', role: 'Backend Engineer', superAdmin: false },
    { key: 'riya', email: 'riya.gupta@northstar-test.local', first: 'Riya', last: 'Gupta', dept: 'Engineering', role: 'Junior Developer', superAdmin: false },
    { key: 'manish', email: 'manish.kumar@northstar-test.local', first: 'Manish', last: 'Kumar', dept: 'Engineering', role: 'DevOps', superAdmin: false },

    // Product
    { key: 'simran', email: 'simran.kaur@northstar-test.local', first: 'Simran', last: 'Kaur', dept: 'Product', role: 'Product Manager', superAdmin: false },
    { key: 'harsh', email: 'harsh.patel@northstar-test.local', first: 'Harsh', last: 'Patel', dept: 'Product', role: 'Product Analyst', superAdmin: false },

    // HR
    { key: 'meera', email: 'meera.joshi@northstar-test.local', first: 'Meera', last: 'Joshi', dept: 'Human Resources', role: 'HR Director', superAdmin: false },
    { key: 'nisha', email: 'nisha.sethi@northstar-test.local', first: 'Nisha', last: 'Sethi', dept: 'Human Resources', role: 'HR Manager', superAdmin: false },

    // Finance
    { key: 'amit', email: 'amit.khanna@northstar-test.local', first: 'Amit', last: 'Khanna', dept: 'Finance', role: 'Finance Manager', superAdmin: false },
    { key: 'tanya', email: 'tanya.mehra@northstar-test.local', first: 'Tanya', last: 'Mehra', dept: 'Finance', role: 'Senior Accountant', superAdmin: false },

    // Sales
    { key: 'saurabh', email: 'saurabh.kapoor@northstar-test.local', first: 'Saurabh', last: 'Kapoor', dept: 'Sales', role: 'Sales Director', superAdmin: false },
    { key: 'deepak', email: 'deepak.arora@northstar-test.local', first: 'Deepak', last: 'Arora', dept: 'Sales', role: 'Account Executive', superAdmin: false },

    // Marketing & Legal
    { key: 'ishita', email: 'ishita.verma@northstar-test.local', first: 'Ishita', last: 'Verma', dept: 'Marketing', role: 'Marketing Manager', superAdmin: false },
    { key: 'kavya', email: 'kavya.malhotra@northstar-test.local', first: 'Kavya', last: 'Malhotra', dept: 'Legal', role: 'Legal Counsel', superAdmin: false },

    // Super Admin
    { key: 'superadmin', email: 'superadmin@northstar-test.local', first: 'Admin', last: 'Tester', dept: 'Executive', role: 'Super Admin', superAdmin: true }
  ];

  const northstarUsers: Record<string, any> = {};
  for (const u of northstarUserSpecs) {
    const userId = uuidFromKey(`user-northstar-${u.key}`);
    const deptObj = northstarDepts[u.dept];
    const roleObj = northstarRoles[u.role];

    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {
        organizationId: northstarOrg.id,
        departmentId: deptObj ? deptObj.id : null,
        email: u.email,
        firstName: u.first,
        lastName: u.last,
        passwordHash: passwordHash,
        isSuperAdmin: u.superAdmin
      },
      create: {
        id: userId,
        organizationId: northstarOrg.id,
        departmentId: deptObj ? deptObj.id : null,
        email: u.email,
        firstName: u.first,
        lastName: u.last,
        passwordHash: passwordHash,
        isSuperAdmin: u.superAdmin
      }
    });

    if (roleObj) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: roleObj.id } },
        update: {},
        create: { userId: user.id, roleId: roleObj.id }
      });
    }

    northstarUsers[u.key] = { ...user, roleId: roleObj?.id, roleName: u.role, deptName: u.dept };
  }

  // BluePeak Users
  const bluepeakUserSpecs = [
    { key: 'varun', email: 'varun.shah@bluepeak-test.local', first: 'Varun', last: 'Shah', dept: 'Engineering', role: 'Engineering Lead', superAdmin: false },
    { key: 'maya', email: 'maya.rao@bluepeak-test.local', first: 'Maya', last: 'Rao', dept: 'Human Resources', role: 'HR Manager', superAdmin: false },
    { key: 'rohan', email: 'rohan.gupta@bluepeak-test.local', first: 'Rohan', last: 'Gupta', dept: 'Finance', role: 'Finance Manager', superAdmin: false },
    { key: 'bp_admin', email: 'superadmin@bluepeak-test.local', first: 'BluePeak', last: 'Admin', dept: 'Executive', role: 'Super Admin', superAdmin: true }
  ];

  const bluepeakUsers: Record<string, any> = {};
  for (const u of bluepeakUserSpecs) {
    const userId = uuidFromKey(`user-bluepeak-${u.key}`);
    const deptObj = bluepeakDepts[u.dept];
    const roleObj = bluepeakRoles[u.role];

    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {
        organizationId: bluepeakOrg.id,
        departmentId: deptObj ? deptObj.id : null,
        email: u.email,
        firstName: u.first,
        lastName: u.last,
        passwordHash: passwordHash,
        isSuperAdmin: u.superAdmin
      },
      create: {
        id: userId,
        organizationId: bluepeakOrg.id,
        departmentId: deptObj ? deptObj.id : null,
        email: u.email,
        firstName: u.first,
        lastName: u.last,
        passwordHash: passwordHash,
        isSuperAdmin: u.superAdmin
      }
    });

    if (roleObj) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: roleObj.id } },
        update: {},
        create: { userId: user.id, roleId: roleObj.id }
      });
    }

    bluepeakUsers[u.key] = { ...user, roleId: roleObj?.id, roleName: u.role, deptName: u.dept };
  }

  console.log(` ✅ Seeded ${Object.keys(northstarUsers).length} Northstar Accounts & ${Object.keys(bluepeakUsers).length} BluePeak Accounts.`);

  // ---------------------------------------------------------------------------
  // 5. DOCUMENTS SPECIFICATIONS & PERMISSIONS
  // ---------------------------------------------------------------------------
  console.log('\n🌱 [5/6] Seeding Enterprise Document Corpus & Access Policies...');

  const docSpecs = [
    // ORG-WIDE (Northstar)
    {
      key: 'doc-01',
      title: 'Northstar Employee Handbook 2026',
      orgId: northstarOrg.id,
      ownerKey: 'meera',
      visibility: DocumentVisibility.ORG_WIDE,
      deptName: 'Human Resources',
      text: 'Northstar Technologies Pvt. Ltd. Employee Handbook 2026. Standard leave policy allows 24 annual paid leaves. Working hours are 09:00 AM to 06:00 PM IST Monday through Friday.'
    },
    {
      key: 'doc-02',
      title: 'Northstar Remote Work & Home Office Policy',
      orgId: northstarOrg.id,
      ownerKey: 'meera',
      visibility: DocumentVisibility.ORG_WIDE,
      deptName: 'Human Resources',
      text: 'Northstar Flexible Remote Work Policy. Employees are eligible for a 3-day work-from-home schedule per week with prior manager notification. Core collaboration hours are 11:00 AM to 04:00 PM IST.'
    },
    {
      key: 'doc-03',
      title: 'Northstar Information Security Policy',
      orgId: northstarOrg.id,
      ownerKey: 'vikram',
      visibility: DocumentVisibility.ORG_WIDE,
      deptName: 'Engineering',
      text: 'Northstar Information Security Policy. Mandatory 2FA multi-factor authentication is enabled across all internal accounts. System passwords must be updated bi-annually.'
    },
    {
      key: 'doc-04',
      title: 'Northstar Code of Conduct',
      orgId: northstarOrg.id,
      ownerKey: 'meera',
      visibility: DocumentVisibility.ORG_WIDE,
      deptName: 'Human Resources',
      text: 'Northstar Code of Conduct. Northstar maintains strict zero tolerance for workplace harassment, discrimination, or unethical professional behavior.'
    },
    {
      key: 'doc-05',
      title: 'Northstar Company Onboarding Guide',
      orgId: northstarOrg.id,
      ownerKey: 'nisha',
      visibility: DocumentVisibility.ORG_WIDE,
      deptName: 'Human Resources',
      text: 'Northstar New Hire Onboarding Guide. Orientation programs take place on the first Monday of every month led by the HR People Operations team.'
    },

    // ENGINEERING
    {
      key: 'doc-06',
      title: 'Northstar Engineering Architecture Handbook',
      orgId: northstarOrg.id,
      ownerKey: 'rahul',
      visibility: DocumentVisibility.DEPARTMENT,
      deptName: 'Engineering',
      text: 'Northstar Production Architecture Handbook. Northstar backend consists of Node.js microservices communicating through internal REST APIs. Production PostgreSQL runs in a primary/replica configuration.'
    },
    {
      key: 'doc-07',
      title: 'Northstar Production Deployment Runbook',
      orgId: northstarOrg.id,
      ownerKey: 'manish',
      visibility: DocumentVisibility.DEPARTMENT,
      deptName: 'Engineering',
      allowedRoles: ['Engineering Manager', 'DevOps'],
      text: 'Northstar Production Deployment Procedure. Production deployments occur every Tuesday at 22:00 IST. All automated CI/CD pipeline tests must pass before staging promotion.'
    },
    {
      key: 'doc-08',
      title: 'Northstar Incident Response Runbook',
      orgId: northstarOrg.id,
      ownerKey: 'manish',
      visibility: DocumentVisibility.DEPARTMENT,
      deptName: 'Engineering',
      allowedRoles: ['DevOps', 'Senior Backend Engineer'],
      text: 'Northstar Production Incident Response Runbook. P0 severity production incidents trigger PagerDuty alerts to on-call engineers within 5 minutes. Severity 1 escalation SLA is 15 minutes.'
    },
    {
      key: 'doc-09',
      title: 'Northstar Backend API Standards',
      orgId: northstarOrg.id,
      ownerKey: 'ananya',
      visibility: DocumentVisibility.DEPARTMENT,
      deptName: 'Engineering',
      text: 'Northstar Backend API Guidelines. All REST API endpoints must strictly adhere to OpenAPI 3.0 specifications and enforce bearer JWT token validation.'
    },
    {
      key: 'doc-10',
      title: 'Northstar Frontend Development Standards',
      orgId: northstarOrg.id,
      ownerKey: 'karan',
      visibility: DocumentVisibility.DEPARTMENT,
      deptName: 'Engineering',
      text: 'Northstar Frontend Architecture Standards. The web platform is built using React 18 with TypeScript, Vite, and custom Tailwind CSS design tokens.'
    },

    // PRODUCT
    {
      key: 'doc-11',
      title: 'Northstar Product Roadmap 2027',
      orgId: northstarOrg.id,
      ownerKey: 'simran',
      visibility: DocumentVisibility.DEPARTMENT,
      deptName: 'Product',
      text: 'Northstar Strategic Product Roadmap 2027. Project Atlas is scheduled for private beta in February 2027 and European regional expansion in Q2 2027.'
    },
    {
      key: 'doc-12',
      title: 'Northstar Product Requirements Process',
      orgId: northstarOrg.id,
      ownerKey: 'simran',
      visibility: DocumentVisibility.DEPARTMENT,
      deptName: 'Product',
      text: 'Northstar PRD Workflow. Product requirement documents require formal sign-off from Product Manager, Tech Lead, and UX Designer prior to sprint grooming.'
    },
    {
      key: 'doc-13',
      title: 'Northstar Product Analytics Guide',
      orgId: northstarOrg.id,
      ownerKey: 'harsh',
      visibility: DocumentVisibility.DEPARTMENT,
      deptName: 'Product',
      text: 'Northstar Analytics Framework. PostHog and Mixpanel event tracking instrumentation is mandatory for all major tier-1 customer feature releases.'
    },

    // HR
    {
      key: 'doc-14',
      title: 'Northstar HR Employee Relations Manual',
      orgId: northstarOrg.id,
      ownerKey: 'meera',
      visibility: DocumentVisibility.DEPARTMENT,
      deptName: 'Human Resources',
      text: 'Northstar HR Employee Relations Procedure Manual. Formal employee performance disciplinary actions require HR review and written documentation.'
    },
    {
      key: 'doc-15',
      title: 'Northstar Compensation & Benefits Policy',
      orgId: northstarOrg.id,
      ownerKey: 'meera',
      visibility: DocumentVisibility.DEPARTMENT,
      deptName: 'Human Resources',
      text: 'Northstar Compensation & Appraisal Framework. Annual performance appraisal cycles occur in March with performance bands A, B, and C.'
    },
    {
      key: 'doc-16',
      title: 'Northstar Recruitment Procedures',
      orgId: northstarOrg.id,
      ownerKey: 'nisha',
      visibility: DocumentVisibility.DEPARTMENT,
      deptName: 'Human Resources',
      text: 'Northstar Hiring Guidelines. Candidate evaluation workflow requires 2 technical rounds followed by 1 cultural alignment panel.'
    },

    // FINANCE
    {
      key: 'doc-17',
      title: 'Northstar Finance Operations Manual',
      orgId: northstarOrg.id,
      ownerKey: 'amit',
      visibility: DocumentVisibility.DEPARTMENT,
      deptName: 'Finance',
      text: 'Northstar Finance Operations and Accounting Manual. Operational expenses above ₹25,000 require Finance Manager approval. Expenses above ₹1,00,000 require CFO approval.'
    },
    {
      key: 'doc-18',
      title: 'Northstar Expense & Reimbursement Policy',
      orgId: northstarOrg.id,
      ownerKey: 'tanya',
      visibility: DocumentVisibility.DEPARTMENT,
      deptName: 'Finance',
      text: 'Northstar Travel & Expense Guidelines. Travel reimbursements must be submitted within 14 business days accompanied by itemized receipts.'
    },
    {
      key: 'doc-19',
      title: 'Northstar Financial Approval Matrix',
      orgId: northstarOrg.id,
      ownerKey: 'amit',
      visibility: DocumentVisibility.DEPARTMENT,
      deptName: 'Finance',
      text: 'Northstar Financial Authority Matrix. Capital expenditure commitments exceeding ₹5,00,000 require authorization from the Board of Directors.'
    },

    // SALES
    {
      key: 'doc-20',
      title: 'Northstar Sales Compensation Plan',
      orgId: northstarOrg.id,
      ownerKey: 'saurabh',
      visibility: DocumentVisibility.DEPARTMENT,
      deptName: 'Sales',
      text: 'Northstar Enterprise Sales Compensation Plan. Enterprise accounts receive an 8% base commission with quarterly performance accelerators.'
    },
    {
      key: 'doc-21',
      title: 'Northstar Enterprise Account Playbook',
      orgId: northstarOrg.id,
      ownerKey: 'deepak',
      visibility: DocumentVisibility.DEPARTMENT,
      deptName: 'Sales',
      text: 'Northstar Enterprise Sales Playbook. Initial discovery calls must identify customer target ARR, timeline, key decision maker, and existing tech stack.'
    },

    // MARKETING & LEGAL
    {
      key: 'doc-22',
      title: 'Northstar Marketing Campaign Strategy',
      orgId: northstarOrg.id,
      ownerKey: 'ishita',
      visibility: DocumentVisibility.DEPARTMENT,
      deptName: 'Marketing',
      text: 'Northstar Q3 Marketing Strategy. B2B marketing initiatives focus on expanding mid-market SaaS enterprise penetration across the APAC region.'
    },
    {
      key: 'doc-23',
      title: 'Northstar Contract Review Procedure',
      orgId: northstarOrg.id,
      ownerKey: 'kavya',
      visibility: DocumentVisibility.DEPARTMENT,
      deptName: 'Legal',
      text: 'Northstar Legal Contract Review Procedures. Master service agreements and vendor contracts exceeding ₹10,00,000 require formal Legal Counsel approval.'
    },

    // EXECUTIVE
    {
      key: 'doc-24',
      title: 'Northstar Executive Leadership Strategy',
      orgId: northstarOrg.id,
      ownerKey: 'arjun',
      visibility: DocumentVisibility.DEPARTMENT,
      deptName: 'Executive',
      allowedRoles: ['CEO', 'CTO', 'CFO'],
      text: 'Northstar Confidential Executive Strategy. Northstar corporate expansion plans target opening a direct subsidiary in Germany during Q2 2027.'
    },

    // PRIVATE / PERSONAL (OWNER ONLY)
    {
      key: 'doc-25',
      title: 'Rahul Verma Performance Review 2026',
      orgId: northstarOrg.id,
      ownerKey: 'rahul',
      scope: DocumentScope.PERSONAL,
      visibility: DocumentVisibility.PRIVATE,
      text: 'Confidential Performance Review for Rahul Verma. Exceeded engineering milestones in H1 2026, successfully leading the backend core API refactoring.'
    },
    {
      key: 'doc-26',
      title: 'Arjun Mehta Strategic Merger Notes',
      orgId: northstarOrg.id,
      ownerKey: 'arjun',
      scope: DocumentScope.PERSONAL,
      visibility: DocumentVisibility.PRIVATE,
      text: 'Arjun Mehta Private Strategic Notes. Highly confidential exploration of potential M&A acquisition of regional cloud infra provider.'
    },
    {
      key: 'doc-27',
      title: 'Amit Khanna Finance Planning Notes',
      orgId: northstarOrg.id,
      ownerKey: 'amit',
      scope: DocumentScope.PERSONAL,
      visibility: DocumentVisibility.PRIVATE,
      text: 'Amit Khanna Private Finance Planning Notes. Q4 corporate tax structure optimization strategies and internal audit risk preparations.'
    },
    {
      key: 'doc-28',
      title: 'Meera Joshi HR Confidential Notes',
      orgId: northstarOrg.id,
      ownerKey: 'meera',
      scope: DocumentScope.PERSONAL,
      visibility: DocumentVisibility.PRIVATE,
      text: 'Meera Joshi HR Confidential Notes. Executive leadership succession planning, key talent retention risk assessment, and executive bonus benchmarks.'
    },
    {
      key: 'doc-32',
      title: 'Praman_Bhogal_Resume.pdf',
      orgId: northstarOrg.id,
      ownerKey: 'praman',
      scope: DocumentScope.PERSONAL,
      visibility: DocumentVisibility.PRIVATE,
      text: 'Resume of Praman Bhogal. Lead Backend Architect specializing in distributed systems, Rust, Node.js, vector databases, and Zero-Trust AI architectures.'
    },
    {
      key: 'doc-33',
      title: 'Arjun_Mehta_Personal_Notes.pdf',
      orgId: northstarOrg.id,
      ownerKey: 'arjun',
      scope: DocumentScope.PERSONAL,
      visibility: DocumentVisibility.PRIVATE,
      text: 'Arjun Mehta Personal Notes. Micro-services architecture design proposal for next-gen scalable search service.'
    },

    // EXPLICIT ALLOW / DENY TEST SCENARIOS
    {
      key: 'doc-29',
      title: 'Engineering Security Architecture',
      orgId: northstarOrg.id,
      ownerKey: 'rahul',
      visibility: DocumentVisibility.DEPARTMENT,
      deptName: 'Engineering',
      deniedUserKeys: ['riya'],
      text: 'Northstar Engineering Security Architecture. Zero-trust network topology details, VPN key rotation schemes, and database subnet isolation parameters.'
    },
    {
      key: 'doc-30',
      title: 'Engineering Leadership Roadmap',
      orgId: northstarOrg.id,
      ownerKey: 'rahul',
      visibility: DocumentVisibility.DEPARTMENT,
      deptName: 'Engineering',
      allowedRoles: ['Engineering Manager'],
      text: 'Northstar Engineering Leadership Roadmap. Confidential engineering staffing headcount allocations, team restructures, and Q4 promotion budgets.'
    },
    {
      key: 'doc-31',
      title: 'Finance Executive Forecast',
      orgId: northstarOrg.id,
      ownerKey: 'amit',
      visibility: DocumentVisibility.DEPARTMENT,
      deptName: 'Finance',
      allowedUserKeys: ['vikram'],
      text: 'Northstar Finance Executive Forecast. Q4 revenue projections, gross margin target metrics, and EBITDA forecasts for Northstar executive decision making.'
    },

    // BLUEPEAK SYSTEMS (TENANT B)
    {
      key: 'doc-bp-01',
      title: 'BluePeak Engineering Standards & Deployment Window',
      orgId: bluepeakOrg.id,
      ownerKey: 'varun',
      visibility: DocumentVisibility.ORG_WIDE,
      deptName: 'Engineering',
      text: 'BluePeak Engineering Standards. Production deployments occur Thursday at 21:00 IST using BluePeak automated deployment pipelines.'
    },
    {
      key: 'doc-bp-02',
      title: 'BluePeak Finance Operations Manual',
      orgId: bluepeakOrg.id,
      ownerKey: 'rohan',
      visibility: DocumentVisibility.DEPARTMENT,
      deptName: 'Finance',
      text: 'BluePeak Finance Operations Manual. Operational expenses above ₹50,000 require manager approval.'
    }
  ];

  // ---------------------------------------------------------------------------
  // 6. INDEXING DOCUMENTS INTO POSTGRESQL + QDRANT
  // ---------------------------------------------------------------------------
  console.log('\n🌱 [6/6] Processing Embeddings & Indexing into Qdrant...');

  const vectorDim = 4096;
  await qdrantProvider.ensureCollection(`org_${northstarOrg.id.replace(/-/g, '_')}_docs`, vectorDim);
  await qdrantProvider.ensureCollection(`org_${bluepeakOrg.id.replace(/-/g, '_')}_docs`, vectorDim);

  for (let idx = 0; idx < docSpecs.length; idx++) {
    const spec = docSpecs[idx];
    const docId = uuidFromKey(`doc-${spec.key}`);
    const versionId = uuidFromKey(`ver-${spec.key}-v1`);
    const chunkId = uuidFromKey(`chunk-${spec.key}-c0`);

    const ownerUser = spec.orgId === northstarOrg.id ? northstarUsers[spec.ownerKey] : bluepeakUsers[spec.ownerKey];
    if (!ownerUser) {
      throw new Error(`Owner key "${spec.ownerKey}" not found for document "${spec.title}".`);
    }

    const deptObj = spec.deptName
      ? (spec.orgId === northstarOrg.id ? northstarDepts[spec.deptName] : bluepeakDepts[spec.deptName])
      : null;

    // Resolve allowed/denied roles and users
    const allowedRoles: string[] = [];
    if (spec.allowedRoles) {
      for (const rName of spec.allowedRoles) {
        const rObj = spec.orgId === northstarOrg.id ? northstarRoles[rName] : bluepeakRoles[rName];
        if (rObj) allowedRoles.push(rObj.id);
      }
    }

    const allowedUsers: string[] = [];
    if ((spec as any).allowedUserKeys) {
      for (const uKey of (spec as any).allowedUserKeys) {
        const uObj = spec.orgId === northstarOrg.id ? northstarUsers[uKey] : bluepeakUsers[uKey];
        if (uObj) allowedUsers.push(uObj.id);
      }
    }

    const deniedUsers: string[] = [];
    if ((spec as any).deniedUserKeys) {
      for (const uKey of (spec as any).deniedUserKeys) {
        const uObj = spec.orgId === northstarOrg.id ? northstarUsers[uKey] : bluepeakUsers[uKey];
        if (uObj) deniedUsers.push(uObj.id);
      }
    }

    // 1. Database Document
    const docScope = (spec as any).scope || DocumentScope.ORGANIZATION;
    const doc = await prisma.document.upsert({
      where: { id: docId },
      update: {
        title: spec.title,
        visibility: spec.visibility,
        scope: docScope,
        departmentId: deptObj ? deptObj.id : null,
        ownerId: ownerUser.id,
        allowedRoles,
        allowedUsers,
        deniedUsers
      },
      create: {
        id: docId,
        organizationId: spec.orgId,
        ownerId: ownerUser.id,
        title: spec.title,
        classification: DocumentClassification.UNCLASSIFIED,
        mimeType: 'application/pdf',
        sizeBytes: spec.text.length,
        visibility: spec.visibility,
        scope: docScope,
        departmentId: deptObj ? deptObj.id : null,
        allowedRoles,
        allowedUsers,
        deniedUsers
      }
    });

    // 2. Database Version
    const contentHash = crypto.createHash('sha256').update(spec.text).digest('hex');
    const version = await prisma.documentVersion.upsert({
      where: { documentId_version: { documentId: doc.id, version: 1 } },
      update: { hash: contentHash },
      create: {
        id: versionId,
        documentId: doc.id,
        version: 1,
        s3Key: `uploads/${doc.organizationId}/${doc.id}/v1.pdf`,
        hash: contentHash
      }
    });

    // 3. Embedding Vector
    const vector = await generateEmbeddingSafe(spec.text);

    // 4. Database Chunk
    await prisma.documentChunk.upsert({
      where: { id: chunkId },
      update: {
        text: spec.text,
        vectorData: vector,
        embeddingStatus: 'COMPLETED',
        indexingStatus: 'COMPLETED',
        indexedAt: new Date()
      },
      create: {
        id: chunkId,
        organizationId: spec.orgId,
        documentId: doc.id,
        versionId: version.id,
        chunkIndex: 0,
        text: spec.text,
        tokenCount: Math.ceil(spec.text.length / 4),
        embeddingStatus: 'COMPLETED',
        embeddingModel: 'qwen3-embedding:8b',
        embeddingDim: vector.length,
        vectorData: vector,
        indexingStatus: 'COMPLETED',
        indexedAt: new Date(),
        qdrantPointId: chunkId
      }
    });

    // 5. Upsert to Qdrant Collection
    const collectionName = `org_${spec.orgId.replace(/-/g, '_')}_docs`;
    await qdrantProvider.upsert(collectionName, [
      {
        id: chunkId,
        vector: vector,
        payload: {
          documentId: doc.id,
          versionId: version.id,
          chunkIndex: 0,
          text: spec.text,
          organizationId: spec.orgId,
          ownerId: ownerUser.id,
          visibility: spec.visibility,
          scope: docScope,
          departmentId: deptObj ? deptObj.id : null,
          allowedUsers,
          allowedRoles,
          allowedDepartments: [],
          deniedUsers,
          deniedRoles: [],
          deniedDepartments: [],
          title: spec.title,
          createdAt: doc.createdAt.toISOString()
        }
      }
    ]);

    console.log(` [${idx + 1}/${docSpecs.length}] Indexed "${spec.title}" into Qdrant collection '${collectionName}'`);
  }

  console.log('\n================================================================================');
  console.log('              ENTERPRISE ENVIRONMENT SEEDED SUCCESSFULLY!              ');
  console.log('================================================================================\n');
  console.log('🔑 Development Password for ALL Accounts: NorthstarTest@2026!\n');
  console.log('🏢 Northstar Technologies Users (domain: @northstar-test.local):');
  for (const uKey of Object.keys(northstarUsers)) {
    const u = northstarUsers[uKey];
    console.log(` - ${u.firstName} ${u.lastName} (${u.email}) | Dept: ${u.deptName} | Role: ${u.roleName} ${u.isSuperAdmin ? '[SUPER ADMIN]' : ''}`);
  }
  console.log('\n🏢 BluePeak Systems Users (domain: @bluepeak-test.local):');
  for (const uKey of Object.keys(bluepeakUsers)) {
    const u = bluepeakUsers[uKey];
    console.log(` - ${u.firstName} ${u.lastName} (${u.email}) | Dept: ${u.deptName} | Role: ${u.roleName} ${u.isSuperAdmin ? '[SUPER ADMIN]' : ''}`);
  }
}

main()
  .catch((err) => {
    console.error('❌ Enterprise Seeding Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });