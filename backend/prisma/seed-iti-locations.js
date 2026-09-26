import prisma from '../src/config/prisma.js';

const DISTRICT_COORDS = {
  'agra': [27.1767, 78.0081],
  'aligarh': [27.8974, 78.0880],
  'ambedkar nagar': [26.4429, 82.6886],
  'amethi': [26.1554, 81.8159],
  'amroha': [28.9044, 78.4674],
  'auraiya': [26.4671, 79.5167],
  'ayodhya': [26.7922, 82.1998],
  'azamgarh': [26.0688, 83.1859],
  'baghpat': [28.9454, 77.2201],
  'bahraich': [27.5744, 81.5976],
  'ballia': [25.7581, 84.1497],
  'balrampur': [27.4300, 82.1800],
  'banda': [25.4754, 80.3347],
  'barabanki': [26.9268, 81.1834],
  'bareilly': [28.3670, 79.4304],
  'basti': [26.7994, 82.7634],
  'bhadohi': [25.3957, 82.5714],
  'bijnor': [29.3732, 78.1358],
  'badaun': [28.0333, 79.1167],
  'bulandshahr': [28.4069, 77.8498],
  'chandauli': [25.2605, 83.2687],
  'chitrakoot': [25.2155, 80.8986],
  'deoria': [26.5024, 83.7791],
  'etah': [27.5574, 78.6653],
  'etawah': [26.7769, 79.0238],
  'farrukhabad': [27.3828, 79.5834],
  'fatehpur': [25.9266, 80.8129],
  'firozabad': [27.1593, 78.3957],
  'gautam buddha nagar': [28.5355, 77.3910],
  'ghaziabad': [28.6692, 77.4538],
  'ghazipur': [25.5840, 83.5770],
  'gonda': [27.1332, 81.9619],
  'gorakhpur': [26.7606, 83.3732],
  'hamirpur': [25.9524, 80.1517],
  'hapur': [28.7306, 77.7759],
  'hardoi': [27.3965, 80.1292],
  'hathras': [27.5969, 78.0519],
  'jalaun': [26.1458, 79.3517],
  'jaunpur': [25.7464, 82.6837],
  'jhansi': [25.4484, 78.5685],
  'kannauj': [27.0543, 79.9149],
  'kanpur dehat': [26.3533, 79.9529],
  'kanpur nagar': [26.4499, 80.3319],
  'kanpur': [26.4499, 80.3319],
  'kasganj': [27.8083, 78.6472],
  'kaushambi': [25.5317, 81.4283],
  'kheri': [27.9472, 80.7744],
  'kushinagar': [26.7411, 83.8893],
  'lalitpur': [24.6896, 78.4117],
  'lucknow': [26.8467, 80.9462],
  'maharajganj': [27.1478, 83.5606],
  'mahoba': [25.2917, 79.8719],
  'mainpuri': [27.2289, 79.0270],
  'mathura': [27.4924, 77.6737],
  'mau': [25.9417, 83.5611],
  'meerut': [28.9845, 77.7064],
  'mirzapur': [25.1460, 82.5690],
  'moradabad': [28.8386, 78.7733],
  'muzaffarnagar': [29.4727, 77.7085],
  'pilibhit': [28.6319, 79.8044],
  'pratapgarh': [25.9189, 81.9961],
  'prayagraj': [25.4358, 81.8463],
  'raebareli': [26.2294, 81.2407],
  'rampur': [28.8154, 79.0255],
  'saharanpur': [29.9679, 77.5452],
  'sambhal': [28.5833, 78.5667],
  'sant kabir nagar': [26.7786, 83.0336],
  'shahjahanpur': [27.8805, 79.9120],
  'shamli': [29.4494, 77.3106],
  'shravasti': [27.7064, 81.9619],
  'siddharthnagar': [27.2797, 82.8094],
  'sitapur': [27.5684, 80.6829],
  'sonbhadra': [24.6853, 83.0673],
  'sultanpur': [26.2648, 82.0727],
  'unnao': [26.5463, 80.4879],
  'varanasi': [25.3176, 82.9739],
  'pune': [18.5204, 73.8567],
  'mumbai': [19.0760, 72.8777],
  'jaipur': [26.9124, 75.7873]
};

async function seedLocations() {
  const itis = await prisma.iTI.findMany({ select: { id: true, district: true } });
  console.log(`Checking ${itis.length} ITIs for location coordinates...`);

  let updated = 0;
  for (let i = 0; i < itis.length; i++) {
    const iti = itis[i];
    const key = (iti.district || '').toLowerCase().trim();
    const base = DISTRICT_COORDS[key] || DISTRICT_COORDS['lucknow'];

    // Deterministic pseudo-random jitter around the district center (radius within 2-25 km)
    const angle = (i * 137.5) * (Math.PI / 180); // golden ratio angle
    const distanceKm = 2 + ((i * 7) % 25); // 2km to 27km from district center
    const latOffset = (distanceKm / 111.0) * Math.cos(angle);
    const lngOffset = (distanceKm / (111.0 * Math.cos(base[0] * Math.PI / 180))) * Math.sin(angle);

    const lat = base[0] + latOffset;
    const lng = base[1] + lngOffset;

    await prisma.$executeRawUnsafe(
      `UPDATE "ITI" SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography WHERE id = $3;`,
      lng,
      lat,
      iti.id
    );
    updated++;
  }

  console.log(`Successfully updated coordinates for ${updated} ITIs.`);
}

seedLocations()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
