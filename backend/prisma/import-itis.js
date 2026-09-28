import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../src/config/prisma.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const csvPath = path.join(projectRoot, 'UP_ITIs_augmented.csv');

/**
 * Parse CSV text that may contain:
 *  - Quoted fields with commas inside (RFC 4180)
 *  - Escaped double-quotes ("" inside quoted fields)
 *  - PostgreSQL array literals like {"Electrician","Fitter"} which are themselves quoted
 */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"' && quoted && next === '"') {
      // Escaped double-quote inside a quoted field
      value += '"';
      i += 1;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (ch === ',' && !quoted) {
      row.push(value.trim());
      value = '';
    } else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && next === '\n') i += 1;
      row.push(value.trim());
      value = '';
      if (row.some((cell) => cell !== '')) rows.push(row);
      row = [];
    } else {
      value += ch;
    }
  }

  // Flush last row
  if (value || row.length) {
    row.push(value.trim());
    if (row.some((cell) => cell !== '')) rows.push(row);
  }

  const headers = rows.shift();
  return rows.map((cells) =>
    Object.fromEntries(headers.map((h, idx) => [h, cells[idx] || '']))
  );
}

/**
 * Parse PostgreSQL array literal string like {"Electrician","Fitter","COPA"}
 * into a JS array of strings. Falls back to semicolon-split for the old format.
 */
function parsePgArray(raw) {
  if (!raw) return [];

  // PostgreSQL array literal: {value1,value2,...}
  const pgMatch = raw.match(/^\{(.+)\}$/);
  if (pgMatch) {
    const inner = pgMatch[1];
    const items = [];
    let current = '';
    let inQuote = false;

    for (let i = 0; i < inner.length; i++) {
      const ch = inner[i];
      if (ch === '"' && !inQuote) {
        inQuote = true;
      } else if (ch === '"' && inQuote) {
        // Check for escaped quote
        if (inner[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuote = false;
        }
      } else if (ch === ',' && !inQuote) {
        items.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    if (current.trim()) items.push(current.trim());
    return items.filter(Boolean);
  }

  // Fallback: semicolon-separated (old CSV format)
  return raw
    .split(';')
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * Build description text from record fields (matches existing import-itis.js pattern).
 */
function toDescription(record) {
  // If the CSV already has a description, use it
  if (record.description) return record.description;

  return (
    [
      record.address && `Address: ${record.address}`,
      record.pincode && `Pincode: ${record.pincode}`,
      record.phone && `Phone: ${record.phone}`,
      record.email && `Email: ${record.email}`,
      record.sourcePage && `Source page: ${record.sourcePage}`,
      record.tradesDataStatus && `Trade data: ${record.tradesDataStatus}`,
      record.strength && `Strength: ${record.strength}`,
    ]
      .filter(Boolean)
      .join('\n') || null
  );
}

async function main() {
  console.log(`Reading CSV from: ${csvPath}`);
  const text = await fs.readFile(csvPath, 'utf8');
  const records = parseCsv(text);
  console.log(`Parsed ${records.length} rows from CSV.`);

  // Build a map of existing ITIs by code for upsert
  const existingITIs = await prisma.iTI.findMany({
    select: { id: true, code: true },
  });
  const existingByCode = new Map(
    existingITIs
      .filter((iti) => iti.code)
      .map((iti) => [iti.code, iti.id])
  );
  console.log(`Found ${existingITIs.length} existing ITIs in DB (${existingByCode.size} with codes).`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  // Process in chunks to avoid overwhelming the DB
  const CHUNK_SIZE = 50;

  for (let i = 0; i < records.length; i += CHUNK_SIZE) {
    const chunk = records.slice(i, i + CHUNK_SIZE);

    await Promise.all(
      chunk.map(async (record) => {
        // Determine the code field — CSV header is "code"
        const code = record.code || null;
        const name = record.name || '';

        if (!name && !code) {
          skipped += 1;
          return;
        }

        // District: CSV uses "district" directly
        const district = record.district || '';
        const state = record.state || '';

        if (!district || !state) {
          skipped += 1;
          return;
        }

        // Parse trades from PostgreSQL array literal or semicolon format
        const trades = parsePgArray(record.trades);

        // Parse strength
        const strengthRaw = record.strength;
        const strength =
          strengthRaw && !isNaN(Number(strengthRaw))
            ? parseInt(strengthRaw, 10)
            : null;

        // Determine isGovernment
        const categoryRaw = (record.category || '').toUpperCase();
        const isGovernmentRaw = record.isGovernment;
        let isGovernment;
        if (isGovernmentRaw === 'true') {
          isGovernment = true;
        } else if (isGovernmentRaw === 'false') {
          isGovernment = false;
        } else {
          isGovernment = categoryRaw !== 'P';
        }

        const sourcePage = record.sourcePage
          ? parseInt(record.sourcePage, 10) || null
          : record.source_page
            ? parseInt(record.source_page, 10) || null
            : null;

        const data = {
          name,
          code,
          category: record.category || null,
          address: record.address || null,
          pincode: record.pincode || null,
          district,
          state,
          phone: record.phone || null,
          email: record.email || null,
          sourcePage,
          ncvtDetailUrl: record.ncvtDetailUrl || record.ncvt_detail_url || null,
          trades,
          tradesDataStatus: record.tradesDataStatus || record.trades_data_status || null,
          strength,
          isGovernment,
          description: toDescription(record),
          status: record.status || 'ACTIVE',
        };

        const existingId = code ? existingByCode.get(code) : null;

        if (existingId) {
          await prisma.iTI.update({ where: { id: existingId }, data });
          updated += 1;
        } else {
          await prisma.iTI.create({ data });
          created += 1;
        }
      })
    );

    const progress = Math.min(i + CHUNK_SIZE, records.length);
    if (progress % 200 === 0 || progress >= records.length) {
      console.log(`  Progress: ${progress}/${records.length} rows processed...`);
    }
  }

  console.log(
    `\n✅ Import complete: ${records.length} CSV rows processed.\n` +
      `   ${created} created | ${updated} updated | ${skipped} skipped`
  );
}

main()
  .catch((error) => {
    console.error('❌ Import failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());