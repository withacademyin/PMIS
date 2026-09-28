import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding 52 Work Requirements (Opportunities)...');

  // Get the Gorakhpur Officer
  const officer = await prisma.user.findFirst({
    where: { email: 'officer@example.com' },
    include: { officerProfile: true }
  });

  if (!officer || !officer.officerProfile) {
    console.error('Officer profile for officer@example.com not found!');
    process.exit(1);
  }

  const officerId = officer.officerProfile.id;

  const companies = ['ABC Manufacturing Ltd.', 'Precision Auto Components Ltd.', 'Purvanchal Green Energy Corp', 'Eastern Electronics & Appliances', 'Vikas Structural Steel Works', 'Kashi Purvanchal Infrastructure', 'Sharda Motors Commercial Vehicles', 'Gorakhpur Textiles Hub', 'Reliance Jio Fiber', 'Tata Motors Authorized Service'];
  const sectors = ['Manufacturing', 'Automotive', 'Renewable Energy', 'Electronics', 'Heavy Engineering', 'Construction', 'Logistics', 'Textiles', 'Telecommunications', 'Automotive Maintenance'];
  const trades = ['Electrician', 'Fitter', 'Welder', 'Mechanic Motor Vehicle', 'COPA', 'Turner', 'Machinist', 'Electronics Mechanic', 'Draughtsman (Civil)'];
  const risks = ['HIGH', 'MEDIUM', 'LOW'];

  const districts = [
    { name: 'Agra', lat: 27.1767, lng: 78.0081 },
    { name: 'Mathura', lat: 27.4924, lng: 77.6737 },
    { name: 'Firozabad', lat: 27.1590, lng: 78.3958 },
    { name: 'Aligarh', lat: 27.8974, lng: 78.0880 },
    { name: 'Hathras', lat: 27.5971, lng: 78.0583 }
  ];

  const opportunities = [];

  for (const district of districts) {
    for (let i = 0; i < 14; i++) {
      const trade = trades[Math.floor(Math.random() * trades.length)];
      const company = companies[Math.floor(Math.random() * companies.length)];
      const sector = sectors[Math.floor(Math.random() * sectors.length)];
      const risk = risks[Math.floor(Math.random() * risks.length)];
      
      // We embed District, Lat, Lng, and Risk into the jdText so the frontend can easily parse them without database schema changes
      opportunities.push({
        title: `${trade} - Apprenticeship / Job`,
        description: `We are looking for a skilled ${trade} to join ${company} in the ${sector} sector. Must have relevant ITI certification.`,
        jdText: `Role: ${trade}\nCompany: ${company}\nLocation: ${district.name}\nStipend: ₹5000 - ₹8000 / month\nDuration: 12 months\nDistrict: ${district.name}\nLat: ${district.lat + (Math.random() * 0.05 - 0.025)}\nLng: ${district.lng + (Math.random() * 0.05 - 0.025)}\nRisk: ${risk}`,
        officerId: officerId,
        requiredTrade: trade,
      });
    }
  }

  // Clear existing jobs for this officer before inserting the new 70
  await prisma.workRequirement.deleteMany({
    where: { officerId: officerId }
  });

  const res = await prisma.workRequirement.createMany({
    data: opportunities
  });

  console.log(`✅ Successfully seeded ${res.count} work requirements!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
