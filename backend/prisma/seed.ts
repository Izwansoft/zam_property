import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Starting seed...');

  // ─────────────────────────────────────────────────────────────────────────
  // Tenant: Demo Marketplace
  // ─────────────────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Marketplace',
      slug: 'demo',
      status: 'ACTIVE',
      enabledVerticals: ['real_estate'],
      branding: {
        primaryColor: '#0066cc',
        logoUrl: null,
      },
      settings: {
        create: {
          locale: 'en',
          currency: 'MYR',
          timezone: 'Asia/Kuala_Lumpur',
          features: {
            reviewsEnabled: true,
            bookingsEnabled: false,
          },
        },
      },
      domains: {
        create: {
          domain: 'demo.localhost',
          isPrimary: true,
          verified: true,
        },
      },
    },
    include: {
      settings: true,
      domains: true,
    },
  });

  console.log(`✅ Tenant created: ${tenant.name} (${tenant.slug})`);
  console.log(`   Settings ID: ${tenant.settings?.id}`);
  console.log(`   Domains: ${tenant.domains.map((d: { domain: string }) => d.domain).join(', ')}`);

  // ─────────────────────────────────────────────────────────────────────────
  // Vertical Registry: Seed core vertical definitions
  // ─────────────────────────────────────────────────────────────────────────
  const realEstateDefinition = await prisma.verticalDefinition.upsert({
    where: { type: 'real_estate' },
    update: {
      name: 'Real Estate',
      description: 'Property listings including residential, commercial, and land',
      icon: 'home',
      color: '#3B82F6',
      schemaVersion: '1.0',
      isActive: true,
      isCore: true,
      attributeSchema: {
        version: '1.0',
        fields: [],
      },
      validationRules: {
        version: '1.0',
        rules: [],
      },
      searchMapping: {
        version: '1.0',
        properties: {},
      },
      displayMetadata: {
        version: '1.0',
      },
    },
    create: {
      type: 'real_estate',
      name: 'Real Estate',
      description: 'Property listings including residential, commercial, and land',
      icon: 'home',
      color: '#3B82F6',
      schemaVersion: '1.0',
      isActive: true,
      isCore: true,
      attributeSchema: {
        version: '1.0',
        fields: [],
      },
      validationRules: {
        version: '1.0',
        rules: [],
      },
      searchMapping: {
        version: '1.0',
        properties: {},
      },
      displayMetadata: {
        version: '1.0',
      },
    },
    select: { id: true, type: true },
  });

  await prisma.tenantVertical.upsert({
    where: {
      tenantId_verticalId: {
        tenantId: tenant.id,
        verticalId: realEstateDefinition.id,
      },
    },
    update: {
      isEnabled: true,
      disabledAt: null,
    },
    create: {
      tenantId: tenant.id,
      verticalId: realEstateDefinition.id,
      isEnabled: true,
    },
    select: { id: true },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // User: Demo Tenant Admin
  // ─────────────────────────────────────────────────────────────────────────
  const demoPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(demoPassword, 10);

  const user = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'admin@demo.local',
      },
    },
    update: {
      fullName: 'Demo Admin',
      phone: '+60123456789',
      role: 'TENANT_ADMIN',
      status: 'ACTIVE',
      isSystem: true,
    },
    create: {
      tenantId: tenant.id,
      email: 'admin@demo.local',
      passwordHash,
      fullName: 'Demo Admin',
      phone: '+60123456789',
      role: 'TENANT_ADMIN',
      status: 'ACTIVE',
      isSystem: true,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
    },
  });

  console.log(`✅ Demo user upserted: ${user.email} (${user.role})`);
  console.log(`   Demo password: ${demoPassword}`);

  console.log('🌱 Seed completed.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
