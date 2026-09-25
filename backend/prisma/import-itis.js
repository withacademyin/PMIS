import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../src/config/prisma.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const csvPath = path.join(projectRoot, 'UP_ITIs_full.csv');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];
    if (character === '"' && quoted && nextCharacter === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      row.push(value.trim());
      value = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && nextCharacter === '\n') index += 1;
      row.push(value.trim());
      value = '';
      if (row.some((cell) => cell !== '')) rows.push(row);
      row = [];
    } else {
      value += character;
    }
  }

  if (value || row.length) {
    row.push(value.trim());
    if (row.some((cell) => cell !== '')) rows.push(row);
  }

  const headers = rows.shift();
  return rows.map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] || ''])));
}

function toDescription(record) {
  return [
    record.address && `Address: ${record.address}`,
    record.pincode && `Pincode: ${record.pincode}`,
    record.phone && `Phone: ${record.phone}`,
    record.email && `Email: ${record.email}`,
    record.source_page && `Source page: ${record.source_page}`,
    record.trades_data_status && `Trade data: ${record.trades_data_status}`,
  ].filter(Boolean).join('\n') || null;
}

async function main() {
  const records = parseCsv(await fs.readFile(csvPath, 'utf8'));
  let created = 0;
  let updated = 0;

  for (const record of records) {
    if (!record.iti_code || !record.iti_name || !record.state) continue;

    const data = {
      name: record.iti_name,
      code: record.iti_code,
      category: record.category || null,
      address: record.address || null,
      pincode: record.pincode || null,
      district: record.district_current || record.district_as_listed,
      state: record.state,
      phone: record.phone || null,
      email: record.email || null,
      sourcePage: record.source_page ? Number(record.source_page) : null,
      ncvtDetailUrl: record.ncvt_detail_url || null,
      trades: record.trades ? record.trades.split(';').map((trade) => trade.trim()).filter(Boolean) : [],
      tradesDataStatus: record.trades_data_status || null,
      isGovernment: record.category.toUpperCase() !== 'P',
      description: toDescription(record),
      status: 'ACTIVE',
    };
    const existing = await prisma.iTI.findFirst({ where: { code: record.iti_code } });

    if (existing) {
      await prisma.iTI.update({ where: { id: existing.id }, data });
      updated += 1;
    } else {
      await prisma.iTI.create({ data });
      created += 1;
    }
  }

  console.log(`Imported ${records.length} CSV rows: ${created} created, ${updated} updated.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());