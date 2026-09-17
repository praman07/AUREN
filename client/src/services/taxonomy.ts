// AUREN Knowledge Domain & Subfield Taxonomy Service
// Hierarchical Knowledge Structure: Domain -> Subfield -> Document

export interface KnowledgeDomain {
  id: string;
  name: string;
  description: string;
  color: string;
  subfields: {
    id: string;
    name: string;
    description: string;
  }[];
}

export const KNOWLEDGE_TAXONOMY: KnowledgeDomain[] = [
  {
    id: 'architecture',
    name: 'Core Architecture',
    description: 'Foundational distributed systems, consensus protocols, and API designs',
    color: 'blue',
    subfields: [
      { id: 'consensus', name: 'Consensus & Raft', description: 'Distributed consensus engines and replication quorum' },
      { id: 'storage', name: 'Vector & Chunk Storage', description: 'Qdrant vector collections and storage tiers' },
      { id: 'apis', name: 'API Contracts & Gateways', description: 'gRPC definitions, OpenAPI specs, and internal mesh' },
      { id: 'distributed_systems', name: 'Distributed Systems', description: 'High-availability cluster topologies and partitioned state' },
      { id: 'retrieval', name: 'Semantic Retrieval', description: 'Dense vector search, hybrid ranking, and rerankers' },
    ],
  },
  {
    id: 'security',
    name: 'Security & Compliance',
    description: 'Zero-trust governance, role-based clearance, and cryptographic ledgers',
    color: 'emerald',
    subfields: [
      { id: 'iam', name: 'IAM & RBAC Governance', description: 'Clearance levels, cross-department access, and member roles' },
      { id: 'zero_trust', name: 'Zero-Trust Architecture', description: 'Mutual TLS, token attestation, and least-privilege policies' },
      { id: 'compliance', name: 'Regulatory Compliance', description: 'SOC2 Type II, ISO 27001, and tamper-evident audit logs' },
      { id: 'incident_response', name: 'Incident Response & Drills', description: 'Breach containment runbooks and automated killswitches' },
    ],
  },
  {
    id: 'infrastructure',
    name: 'Platform Engineering',
    description: 'Cloud infrastructure, container orchestration, and observability',
    color: 'amber',
    subfields: [
      { id: 'cloud', name: 'Cloud Infrastructure', description: 'GCP, AWS multi-region footprints and Terraform state' },
      { id: 'devops', name: 'CI/CD & DevOps', description: 'GitHub Actions, automated test suites, and image registries' },
      { id: 'observability', name: 'Observability & Telemetry', description: 'Prometheus metrics, OpenTelemetry traces, and error budgets' },
    ],
  },
  {
    id: 'governance',
    name: 'Product Governance',
    description: 'Enterprise specifications, privacy guarantees, and master blueprints',
    color: 'purple',
    subfields: [
      { id: 'enterprise_master', name: 'Super Org Master Directives', description: 'Company-wide charters and executive blueprints' },
      { id: 'data_retention', name: 'Data Retention & Privacy', description: 'TTL policies, GDPR deletion protocols, and vault isolation' },
    ],
  },
];

/**
 * Helper to look up the domain for a given subfield or document department
 */
export function getDomainForSubfield(subfieldName?: string): KnowledgeDomain | undefined {
  if (!subfieldName) return undefined;
  const lower = subfieldName.toLowerCase();
  return KNOWLEDGE_TAXONOMY.find((domain) =>
    domain.subfields.some(
      (sf) =>
        sf.name.toLowerCase().includes(lower) ||
        sf.id.toLowerCase().includes(lower) ||
        lower.includes(sf.name.toLowerCase())
    )
  );
}

export function getDomainForDepartment(departmentName?: string): KnowledgeDomain {
  if (!departmentName) return KNOWLEDGE_TAXONOMY[0];
  const lower = departmentName.toLowerCase();
  if (lower.includes('security') || lower.includes('compliance')) {
    return KNOWLEDGE_TAXONOMY[1];
  }
  if (lower.includes('platform') || lower.includes('infra') || lower.includes('qa')) {
    return KNOWLEDGE_TAXONOMY[2];
  }
  if (lower.includes('product') || lower.includes('govern') || lower.includes('global')) {
    return KNOWLEDGE_TAXONOMY[3];
  }
  return KNOWLEDGE_TAXONOMY[0];
}
