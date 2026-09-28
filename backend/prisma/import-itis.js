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
  const existingITIs = await prisma.iTI.findMany({ select: { id: true, code: true } });
  const existingMap = new Map(existingITIs.map((item) => [item.code, item.id]));

  const toCreate = [];
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

    const existingId = existingMap.get(record.iti_code);
    if (existingId) {
      await prisma.iTI.update({ where: { id: existingId }, data });
      updated += 1;
    } else {
      toCreate.push(data);
    }
  }

  let created = 0;
  if (toCreate.length > 0) {
    const res = await prisma.iTI.createMany({ data: toCreate, skipDuplicates: true });
    created = res.count;
  }

  console.log(`Imported ${records.length} CSV rows: ${created} created, ${updated} updated.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());