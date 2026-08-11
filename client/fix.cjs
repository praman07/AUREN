const fs = require("fs");

function fix(path, replacements) {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, "utf8");
    let changed = false;
    for (let r of replacements) {
      if (r[0].test(content)) {
        content = content.replace(r[0], r[1]);
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(path, content);
      console.log("Fixed: " + path);
    }
  }
}

fix("src/core/auth/providers/EnterpriseAuthProvider.tsx", [
  [/role: user\.publicMetadata\.role as string,/g, "role: user.publicMetadata.role as any,"],
  [/clearanceLevel: user\.publicMetadata\.clearanceLevel as string,/g, "clearanceLevel: user.publicMetadata.clearanceLevel as any,"]
]);

fix("src/core/auth/providers/MockClerkProvider.tsx", [
  [/setIsLoaded\([a-zA-Z]+\);/g, ""],
  [/roles: \["ADMIN"\],/g, "role: \"ADMIN\" as any, clearanceLevel: \"L5\" as any, roles: [\"ADMIN\"],"],
  [/roles: \['ADMIN'\],/g, "role: 'ADMIN' as any, clearanceLevel: 'L5' as any, roles: ['ADMIN'],"]
]);

fix("src/features/departments/mock/security.mock.ts", [
  [/import \{ Department, Role, PermissionKey, Group, OrganizationPolicy \} from/, "import type { Department, Role, PermissionKey, Group, OrganizationPolicy } from"]
]);

fix("src/features/departments/store/useSecurityStore.ts", [
  [/import \{ Department, Role, Group, OrganizationPolicy, PermissionKey \} from/, "import type { Department, Role, Group, OrganizationPolicy, PermissionKey } from"]
]);

fix("src/features/documents/components/details/sections/MetadataSections.tsx", [
  [/classification={doc\.metadata\?\.classification \|\| .PUBLIC.}/, "classification={(doc.metadata?.classification || \"PUBLIC\") as any}"],
  [/status={doc\.jobs\?\.\[0\]\?\.status === .COMPLETED. \? .Ready. : .Processing.}/, "status={(doc.jobs?.[0]?.status === \"COMPLETED\" ? \"Ready\" : \"Processing\") as any}"]
]);

fix("src/features/documents/store/useUploadStore.ts", [
  [/create<UploadState>\(\(set, get\) =>/, "create<UploadState>((set) =>"]
]);

fix("src/features/users/components/data-table/UsersTable.tsx", [
  [/, MoreHorizontal/, ""]
]);
