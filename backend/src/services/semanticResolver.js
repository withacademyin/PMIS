import { PrismaClient } from '@prisma/client';
import { generateEmbedding } from './aiService.js';

const prisma = new PrismaClient();

export const resolveEntity = async (entityName, expectedType = null) => {
  try {
    const embeddingValues = await generateEmbedding(entityName);
    if (!embeddingValues) return null;

    // Convert array to pgvector string format
    const embeddingString = `[${embeddingValues.join(',')}]`;

    let results;
    if (expectedType) {
      results = await prisma.$queryRaw`
        SELECT id, canonical_name, type, category, description,
               1 - (embedding <=> ${embeddingString}::vector) as similarity
        FROM "CanonicalEntity"
        WHERE type = ${expectedType} AND is_active = true
        ORDER BY embedding <=> ${embeddingString}::vector
        LIMIT 5;
      `;
    } else {
      results = await prisma.$queryRaw`
        SELECT id, canonical_name, type, category, description,
               1 - (embedding <=> ${embeddingString}::vector) as similarity
        FROM "CanonicalEntity"
        WHERE is_active = true
        ORDER BY embedding <=> ${embeddingString}::vector
        LIMIT 5;
      `;
    }

    return results;
  } catch (error) {
    console.error(`[semanticResolver] failed to resolve entity ${entityName}:`, error.message);
    return null;
  }
};

export const createCanonicalEntity = async (data) => {
  const { canonical_name, type, category, description, aliases } = data;
  
  // We embed a rich text representation of the entity as recommended
  const textToEmbed = `Name: ${canonical_name}\nType: ${type}\nCategory: ${category || 'N/A'}\nAliases: ${(aliases || []).join(', ')}\nDescription: ${description || 'N/A'}`;
  
  const embeddingValues = await generateEmbedding(textToEmbed);
  
  if (!embeddingValues) {
    throw new Error('Failed to generate embedding for ' + canonical_name);
  }

  const embeddingString = `[${embeddingValues.join(',')}]`;
  
  const entity = await prisma.canonicalEntity.create({
    data: {
      canonical_name,
      type,
      category,
      description,
      aliases: aliases || []
    }
  });

  await prisma.$executeRaw`
    UPDATE "CanonicalEntity" 
    SET embedding = ${embeddingString}::vector 
    WHERE id = ${entity.id}
  `;
  
  return entity;
};
