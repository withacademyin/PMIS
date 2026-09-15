import { PrismaClient } from '@prisma/client';
import { SKILLS, LANGUAGES, PROJECT_TYPES, CERTIFICATIONS } from '../src/utils/fallbackParser.js';
import { createCanonicalEntity } from '../src/services/semanticResolver.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding the CanonicalEntity database...');

  await seedDictionary(SKILLS, 'skill');
  await seedDictionary(LANGUAGES, 'language');
  await seedDictionary(PROJECT_TYPES, 'project_type');
  await seedDictionary(CERTIFICATIONS, 'certification');
  
  console.log('Seeding finished.');
}

async function seedDictionary(dictionary, type) {
  for (const [canonical_name, aliases] of Object.entries(dictionary)) {
    const existing = await prisma.canonicalEntity.findFirst({
      where: { canonical_name, type }
    });
    
    if (!existing) {
      console.log(`Seeding ${type}: ${canonical_name}`);
      try {
        await createCanonicalEntity({
          canonical_name,
          type,
          aliases,
          category: null,
          description: null
        });
        // 500ms delay to prevent rate limiting on the embedding API during initial bulk seed
        await new Promise(r => setTimeout(r, 500)); 
      } catch (err) {
        console.error(`Failed to seed ${canonical_name}:`, err.message);
      }
    } else {
      console.log(`Skipping ${canonical_name} (already exists)`);
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
