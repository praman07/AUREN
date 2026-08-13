import { PermissionFilter } from '../infrastructure/search/PermissionFilter';
import { SearchRequest } from '../domain/retrieval/types';

function testPermissionFiltering() {
  console.log('--- Testing Zero-Trust Context Fusion ---');
  
  const filterBuilder = new PermissionFilter();
  
  // Scenario 1: Employee searching their own organization
  const req1: SearchRequest = {
    query: 'salary guidelines',
    organizationId: 'org_1',
    userId: 'user_1',
    roleIds: [], departmentIds: ['dept_hr', 'dept_eng'],
    limit: 5
  };
  
  const filter1 = filterBuilder.buildVectorFilter(req1);
  console.log('\nScenario 1: Employee with HR and Engineering Departments');
  console.log(JSON.stringify(filter1, null, 2));
  
  // Verify structure
  const must1 = filter1.must.find((m: any) => m.key === 'organizationId');
  if (!must1 || must1.match.value !== 'org_1') {
    throw new Error('Organization ID must be enforced at the root level');
  }
  
  // Scenario 2: Contractor with NO department access
  const req2: SearchRequest = {
    query: 'company roadmap',
    organizationId: 'org_1',
    userId: 'user_contractor',
    roleIds: [], departmentIds: [],
    limit: 5
  };
  
  const filter2 = filterBuilder.buildVectorFilter(req2);
  console.log('\nScenario 2: Contractor (No Departments)');
  console.log(JSON.stringify(filter2, null, 2));
  
  const hasDepartmentCondition = filter2.should.some((cond: any) => cond.must && cond.must.some((m: any) => m.key === 'departmentId'));
  if (hasDepartmentCondition) {
    throw new Error('Contractor should not have department conditions');
  }
  
  console.log('\n--- Permission Filtering Test Complete ---');
}

testPermissionFiltering();
