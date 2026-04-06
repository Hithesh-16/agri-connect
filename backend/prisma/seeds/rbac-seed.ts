import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SYSTEM_ROLES = [
  { name: 'SUPER_ADMIN', displayName: { en: 'Super Admin', te: 'సూపర్ అడ్మిన్', hi: 'सुपर एडमिन' }, description: 'Full platform access' },
  { name: 'PLATFORM_ADMIN', displayName: { en: 'Platform Admin', te: 'ప్లాట్‌ఫాం అడ్మిన్', hi: 'प्लैटफ़ॉर्म एडमिन' }, description: 'Platform management' },
  { name: 'FARMER', displayName: { en: 'Farmer', te: 'రైతు', hi: 'किसान' }, description: 'Farmer/consumer role' },
  { name: 'VENDOR', displayName: { en: 'Vendor', te: 'విక్రేత', hi: 'विक्रेता' }, description: 'Service provider/vendor' },
  { name: 'LABOR_INDIVIDUAL', displayName: { en: 'Farm Worker', te: 'వ్యవసాయ కూలీ', hi: 'खेत मजदूर' }, description: 'Individual farm laborer' },
  { name: 'LABOR_TEAM_LEADER', displayName: { en: 'Team Leader', te: 'టీమ్ లీడర్', hi: 'टीम लीडर' }, description: 'Labor team leader' },
  { name: 'FPO_ADMIN', displayName: { en: 'FPO Admin', te: 'FPO అడ్మిన్', hi: 'FPO एडमिन' }, description: 'Farmer Producer Organization admin' },
  { name: 'GOVERNMENT_OFFICER', displayName: { en: 'Government Officer', te: 'ప్రభుత్వ అధికారి', hi: 'सरकारी अधिकारी' }, description: 'District/state agriculture officer' },
  { name: 'SUPPORT_AGENT', displayName: { en: 'Support Agent', te: 'సపోర్ట్ ఏజెంట్', hi: 'सपोर्ट एजेंट' }, description: 'Customer support' },
  { name: 'CONTENT_MODERATOR', displayName: { en: 'Content Moderator', te: 'కంటెంట్ మోడరేటర్', hi: 'कंटेंट मॉडरेटर' }, description: 'Community content moderation' },
];

// Resource:action permission definitions
const PERMISSIONS = [
  // Users
  { resource: 'users', action: 'read' },
  { resource: 'users', action: 'update' },
  { resource: 'users', action: 'delete' },
  { resource: 'users', action: 'manage' },
  // Roles
  { resource: 'roles', action: 'read' },
  { resource: 'roles', action: 'manage' },
  // Services
  { resource: 'services', action: 'create' },
  { resource: 'services', action: 'read' },
  { resource: 'services', action: 'update' },
  { resource: 'services', action: 'delete' },
  // Bookings
  { resource: 'bookings', action: 'create' },
  { resource: 'bookings', action: 'read' },
  { resource: 'bookings', action: 'update' },
  { resource: 'bookings', action: 'manage' },
  // Payments
  { resource: 'payments', action: 'read' },
  { resource: 'payments', action: 'manage' },
  // Community
  { resource: 'community', action: 'create' },
  { resource: 'community', action: 'read' },
  { resource: 'community', action: 'update' },
  { resource: 'community', action: 'delete' },
  { resource: 'community', action: 'moderate' },
  // Listings
  { resource: 'listings', action: 'create' },
  { resource: 'listings', action: 'read' },
  { resource: 'listings', action: 'update' },
  { resource: 'listings', action: 'delete' },
  // Prices
  { resource: 'prices', action: 'read' },
  { resource: 'prices', action: 'manage' },
  // Schemes
  { resource: 'schemes', action: 'read' },
  { resource: 'schemes', action: 'manage' },
  // Disputes
  { resource: 'disputes', action: 'create' },
  { resource: 'disputes', action: 'read' },
  { resource: 'disputes', action: 'manage' },
  // Reviews
  { resource: 'reviews', action: 'create' },
  { resource: 'reviews', action: 'read' },
  // Audit
  { resource: 'audit', action: 'read' },
  // All (superadmin wildcard)
  { resource: '*', action: 'manage' },
];

// Role → permissions mapping
const ROLE_PERMISSIONS: Record<string, { resource: string; action: string; scope?: string }[]> = {
  SUPER_ADMIN: [{ resource: '*', action: 'manage', scope: 'all' }],
  PLATFORM_ADMIN: [
    { resource: 'users', action: 'manage', scope: 'all' },
    { resource: 'roles', action: 'read', scope: 'all' },
    { resource: 'services', action: 'manage', scope: 'all' },
    { resource: 'bookings', action: 'manage', scope: 'all' },
    { resource: 'payments', action: 'manage', scope: 'all' },
    { resource: 'community', action: 'moderate', scope: 'all' },
    { resource: 'disputes', action: 'manage', scope: 'all' },
    { resource: 'schemes', action: 'manage', scope: 'all' },
    { resource: 'audit', action: 'read', scope: 'all' },
  ],
  FARMER: [
    { resource: 'services', action: 'read', scope: 'all' },
    { resource: 'bookings', action: 'create', scope: 'own' },
    { resource: 'bookings', action: 'read', scope: 'own' },
    { resource: 'bookings', action: 'update', scope: 'own' },
    { resource: 'listings', action: 'create', scope: 'own' },
    { resource: 'listings', action: 'read', scope: 'all' },
    { resource: 'listings', action: 'update', scope: 'own' },
    { resource: 'listings', action: 'delete', scope: 'own' },
    { resource: 'community', action: 'create', scope: 'own' },
    { resource: 'community', action: 'read', scope: 'all' },
    { resource: 'prices', action: 'read', scope: 'all' },
    { resource: 'schemes', action: 'read', scope: 'all' },
    { resource: 'reviews', action: 'create', scope: 'own' },
    { resource: 'reviews', action: 'read', scope: 'all' },
    { resource: 'disputes', action: 'create', scope: 'own' },
    { resource: 'disputes', action: 'read', scope: 'own' },
  ],
  VENDOR: [
    { resource: 'services', action: 'create', scope: 'own' },
    { resource: 'services', action: 'read', scope: 'all' },
    { resource: 'services', action: 'update', scope: 'own' },
    { resource: 'services', action: 'delete', scope: 'own' },
    { resource: 'bookings', action: 'read', scope: 'own' },
    { resource: 'bookings', action: 'update', scope: 'own' },
    { resource: 'payments', action: 'read', scope: 'own' },
    { resource: 'reviews', action: 'read', scope: 'all' },
    { resource: 'disputes', action: 'create', scope: 'own' },
    { resource: 'disputes', action: 'read', scope: 'own' },
  ],
  LABOR_INDIVIDUAL: [
    { resource: 'services', action: 'read', scope: 'all' },
    { resource: 'bookings', action: 'read', scope: 'own' },
    { resource: 'bookings', action: 'update', scope: 'own' },
    { resource: 'payments', action: 'read', scope: 'own' },
  ],
  LABOR_TEAM_LEADER: [
    { resource: 'services', action: 'create', scope: 'own' },
    { resource: 'services', action: 'read', scope: 'all' },
    { resource: 'services', action: 'update', scope: 'own' },
    { resource: 'bookings', action: 'read', scope: 'organization' },
    { resource: 'bookings', action: 'update', scope: 'organization' },
    { resource: 'payments', action: 'read', scope: 'organization' },
  ],
  FPO_ADMIN: [
    { resource: 'users', action: 'read', scope: 'organization' },
    { resource: 'bookings', action: 'read', scope: 'organization' },
    { resource: 'listings', action: 'manage', scope: 'organization' },
    { resource: 'prices', action: 'read', scope: 'all' },
    { resource: 'schemes', action: 'read', scope: 'all' },
  ],
  GOVERNMENT_OFFICER: [
    { resource: 'users', action: 'read', scope: 'geographic' },
    { resource: 'bookings', action: 'read', scope: 'geographic' },
    { resource: 'prices', action: 'read', scope: 'all' },
    { resource: 'schemes', action: 'manage', scope: 'geographic' },
    { resource: 'audit', action: 'read', scope: 'geographic' },
  ],
  SUPPORT_AGENT: [
    { resource: 'users', action: 'read', scope: 'all' },
    { resource: 'bookings', action: 'read', scope: 'all' },
    { resource: 'disputes', action: 'manage', scope: 'all' },
    { resource: 'community', action: 'moderate', scope: 'all' },
  ],
  CONTENT_MODERATOR: [
    { resource: 'community', action: 'read', scope: 'all' },
    { resource: 'community', action: 'moderate', scope: 'all' },
    { resource: 'community', action: 'delete', scope: 'all' },
    { resource: 'reviews', action: 'read', scope: 'all' },
  ],
};

async function seedRBAC() {
  console.log('Seeding RBAC system...');

  // 1. Create permissions
  console.log('Creating permissions...');
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { resource_action: { resource: perm.resource, action: perm.action } },
      update: {},
      create: { resource: perm.resource, action: perm.action },
    });
  }
  console.log(`  ${PERMISSIONS.length} permissions created.`);

  // 2. Create roles
  console.log('Creating roles...');
  for (const role of SYSTEM_ROLES) {
    await prisma.roleDefinition.upsert({
      where: { name: role.name },
      update: { displayName: role.displayName, description: role.description },
      create: { name: role.name, displayName: role.displayName, description: role.description, isSystem: true },
    });
  }
  console.log(`  ${SYSTEM_ROLES.length} roles created.`);

  // 3. Assign permissions to roles
  console.log('Assigning permissions to roles...');
  for (const [roleName, perms] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.roleDefinition.findUnique({ where: { name: roleName } });
    if (!role) continue;

    for (const perm of perms) {
      const permission = await prisma.permission.findUnique({
        where: { resource_action: { resource: perm.resource, action: perm.action } },
      });
      if (!permission) continue;

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: { scope: perm.scope || 'own' },
        create: { roleId: role.id, permissionId: permission.id, scope: perm.scope || 'own' },
      });
    }
  }
  console.log('  Permissions assigned.');

  // 4. Migrate existing users from legacy Role enum to new RBAC
  console.log('Migrating existing users to RBAC...');
  const roleMapping: Record<string, string> = {
    FARMER: 'FARMER',
    TRADER: 'VENDOR',
    DEALER: 'VENDOR',
    CORPORATE: 'VENDOR',
  };

  const users = await prisma.user.findMany({ where: { role: { not: null } } });
  for (const user of users) {
    if (!user.role) continue;
    const targetRoleName = roleMapping[user.role] || 'FARMER';
    const targetRole = await prisma.roleDefinition.findUnique({ where: { name: targetRoleName } });
    if (!targetRole) continue;

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: targetRole.id } },
      update: { isActive: true },
      create: { userId: user.id, roleId: targetRole.id },
    });
  }
  console.log(`  ${users.length} users migrated.`);

  console.log('RBAC seed complete!');
}

seedRBAC()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error('RBAC seed failed:', err);
    prisma.$disconnect();
    process.exit(1);
  });
