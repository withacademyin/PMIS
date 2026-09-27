import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const UP_DISTRICTS = [
  "Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Ayodhya", "Azamgarh",
  "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti",
  "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah",
  "Etawah", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur",
  "Gonda", "Gorakhpur", "Hamirpur", "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi",
  "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kushinagar", "Lakhimpur Kheri",
  "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut",
  "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Prayagraj", "Rae Bareli",
  "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shravasti",
  "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"
];

const LOW_REGISTRATION_DISTRICTS = ["Shravasti", "Balrampur", "Bahraich", "Chitrakoot", "Siddharthnagar"];

const QUALIFICATIONS = [
  { code: "ITI_ELECTRICIAN", label: "Electrician", category: "VOCATIONAL" },
  { code: "ITI_FITTER", label: "Fitter", category: "VOCATIONAL" },
  { code: "ITI_COPA", label: "COPA (Computer Operator)", category: "VOCATIONAL" },
  { code: "ITI_MMV", label: "Mechanic Motor Vehicle", category: "VOCATIONAL" },
  { code: "ITI_WELDER", label: "Welder", category: "VOCATIONAL" },
  { code: "DIPLOMA_MECHANICAL", label: "Diploma in Mechanical Engg.", category: "DIPLOMA" },
  { code: "DIPLOMA_ELECTRICAL", label: "Diploma in Electrical Engg.", category: "DIPLOMA" },
  { code: "DIPLOMA_CIVIL", label: "Diploma in Civil Engg.", category: "DIPLOMA" },
  { code: "GRADUATE_BCOM", label: "Bachelor of Commerce (B.Com)", category: "GRADUATE" },
  { code: "GRADUATE_BSC", label: "Bachelor of Science (B.Sc)", category: "GRADUATE" },
  { code: "GRADUATE_BA", label: "Bachelor of Arts (B.A)", category: "GRADUATE" },
  { code: "GRADUATE_ANY", label: "Any Graduate", category: "GRADUATE" },
  { code: "10TH_PASS", label: "High School (10th Pass)", category: "SCHOOL" },
  { code: "12TH_PASS", label: "Intermediate (12th Pass)", category: "SCHOOL" }
];

async function seed() {
  console.log('--- Seeding PMIS District Opportunity Radar ---');

  // 1. Seed State: Uttar Pradesh
  console.log('1. Seeding State: Uttar Pradesh...');
  await prisma.state.upsert({
    where: { code: 'UP' },
    update: { name: 'Uttar Pradesh' },
    create: { code: 'UP', name: 'Uttar Pradesh' }
  });

  // 2. Seed All 75 Districts
  console.log('2. Seeding 75 UP Districts...');
  for (const name of UP_DISTRICTS) {
    const code = name.toUpperCase().replace(/\s+/g, '_');
    const isLowReg = LOW_REGISTRATION_DISTRICTS.includes(name);
    await prisma.district.upsert({
      where: { code },
      update: { name, stateCode: 'UP', lowRegistrationFlag: isLowReg },
      create: {
        code,
        name,
        stateCode: 'UP',
        localLanguage: 'Hindi',
        lowRegistrationFlag: isLowReg
      }
    });
  }

  // 3. District Configuration for Gorakhpur
  await prisma.districtConfiguration.upsert({
    where: { districtCode: 'GORAKHPUR' },
    update: {},
    create: {
      districtCode: 'GORAKHPUR',
      defaultCatchmentMin: 60,
      targetMultiplier: 3.0,
      highRiskDaysLimit: 14,
      highRiskCoverageCap: 0.5
    }
  });

  // 4. Seed Nodal Officers (DNO Gorakhpur & State PMU Officer)
  console.log('3. Seeding Nodal Officers...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Officer@123', salt);

  // DNO Gorakhpur
  const dnoUser = await prisma.user.upsert({
    where: { email: 'dno.gorakhpur@pmis.gov.in' },
    update: { role: 'OFFICER' },
    create: {
      email: 'dno.gorakhpur@pmis.gov.in',
      password: passwordHash,
      role: 'OFFICER'
    }
  });

  const dnoProfile = await prisma.officerProfile.upsert({
    where: { userId: dnoUser.id },
    update: { name: 'Rahul Sharma', district: 'Gorakhpur', department: 'District Skill Development & Employment' },
    create: {
      userId: dnoUser.id,
      name: 'Rahul Sharma',
      district: 'Gorakhpur',
      department: 'District Skill Development & Employment',
      isVerified: true
    }
  });

  await prisma.officerDistrict.upsert({
    where: { officerProfileId_districtCode: { officerProfileId: dnoProfile.id, districtCode: 'GORAKHPUR' } },
    update: {},
    create: { officerProfileId: dnoProfile.id, districtCode: 'GORAKHPUR' }
  });

  // State PMU Officer
  const pmuUser = await prisma.user.upsert({
    where: { email: 'pmu.up@pmis.gov.in' },
    update: { role: 'ADMIN' },
    create: {
      email: 'pmu.up@pmis.gov.in',
      password: passwordHash,
      role: 'ADMIN'
    }
  });

  const pmuProfile = await prisma.officerProfile.upsert({
    where: { userId: pmuUser.id },
    update: { name: 'Priya Verma', district: 'State PMU Lucknow', department: 'State PMU (Skill & Vocational Education)' },
    create: {
      userId: pmuUser.id,
      name: 'Priya Verma',
      district: 'State PMU Lucknow',
      department: 'State PMU (Skill & Vocational Education)',
      isVerified: true
    }
  });

  for (const d of ['GORAKHPUR', 'DEORIA', 'MAHARAJGANJ', 'KUSHINAGAR', 'SANT_KABIR_NAGAR', 'LUCKNOW', 'VARANASI']) {
    await prisma.officerDistrict.upsert({
      where: { officerProfileId_districtCode: { officerProfileId: pmuProfile.id, districtCode: d } },
      update: {},
      create: { officerProfileId: pmuProfile.id, districtCode: d }
    });
  }

  // 5. Seed Qualifications
  console.log('4. Seeding Qualifications...');
  for (const q of QUALIFICATIONS) {
    await prisma.qualification.upsert({
      where: { code: q.code },
      update: { label: q.label, category: q.category },
      create: { code: q.code, label: q.label, category: q.category }
    });
  }

  // 6. Seed Institutions in Gorakhpur and Catchment
  console.log('5. Seeding 40+ Institutions in Gorakhpur & Catchment...');
  const institutionsData = [
    // Gorakhpur ITIs
    { name: "Government ITI Gorakhpur (Charpatha)", code: "ITI-GKP-01", type: "ITI", district: "Gorakhpur", districtCode: "GORAKHPUR", lat: 26.7588, lng: 83.3697, phone: "0551-220011", contact: "Shri R.K. Yadav", role: "Principal", seats: 360, programmes: [ { code: "ITI_ELECTRICIAN", name: "Electrician", seats: 120 }, { code: "ITI_FITTER", name: "Fitter", seats: 100 }, { code: "ITI_COPA", name: "COPA", seats: 80 }, { code: "ITI_WELDER", name: "Welder", seats: 60 } ] },
    { name: "Government ITI Sahjanwa", code: "ITI-GKP-02", type: "ITI", district: "Gorakhpur", districtCode: "GORAKHPUR", lat: 26.7512, lng: 83.1895, phone: "0551-280022", contact: "Dr. P.N. Singh", role: "Principal", seats: 200, programmes: [ { code: "ITI_FITTER", name: "Fitter", seats: 80 }, { code: "ITI_ELECTRICIAN", name: "Electrician", seats: 60 }, { code: "ITI_MMV", name: "Mechanic Motor Vehicle", seats: 60 } ] },
    { name: "Government ITI Campierganj", code: "ITI-GKP-03", type: "ITI", district: "Gorakhpur", districtCode: "GORAKHPUR", lat: 26.9634, lng: 83.2755, phone: "0551-290033", contact: "Smt. Manju Lata", role: "Vice Principal", seats: 160, programmes: [ { code: "ITI_ELECTRICIAN", name: "Electrician", seats: 60 }, { code: "ITI_WELDER", name: "Welder", seats: 50 }, { code: "ITI_COPA", name: "COPA", seats: 50 } ] },
    { name: "Government ITI Bansgaon", code: "ITI-GKP-04", type: "ITI", district: "Gorakhpur", districtCode: "GORAKHPUR", lat: 26.5492, lng: 83.3512, phone: "0551-260044", contact: "Shri A.K. Srivastava", role: "Principal", seats: 180, programmes: [ { code: "ITI_FITTER", name: "Fitter", seats: 70 }, { code: "ITI_ELECTRICIAN", name: "Electrician", seats: 60 }, { code: "ITI_MMV", name: "Mechanic Motor Vehicle", seats: 50 } ] },
    { name: "Government ITI Gola", code: "ITI-GKP-05", type: "ITI", district: "Gorakhpur", districtCode: "GORAKHPUR", lat: 26.3421, lng: 83.3541, phone: "0551-250055", contact: "Shri V.K. Mishra", role: "Principal", seats: 140, programmes: [ { code: "ITI_ELECTRICIAN", name: "Electrician", seats: 50 }, { code: "ITI_FITTER", name: "Fitter", seats: 50 }, { code: "ITI_WELDER", name: "Welder", seats: 40 } ] },
    { name: "Government ITI Pipraich", code: "ITI-GKP-06", type: "ITI", district: "Gorakhpur", districtCode: "GORAKHPUR", lat: 26.8315, lng: 83.5244, phone: "0551-240066", contact: "Dr. S.P. Gautam", role: "Principal", seats: 160, programmes: [ { code: "ITI_COPA", name: "COPA", seats: 60 }, { code: "ITI_ELECTRICIAN", name: "Electrician", seats: 50 }, { code: "ITI_FITTER", name: "Fitter", seats: 50 } ] },
    { name: "Gorakhnath Private ITI", code: "ITI-GKP-07", type: "ITI", district: "Gorakhpur", districtCode: "GORAKHPUR", lat: 26.7820, lng: 83.3810, phone: "0551-270077", contact: "Shri M.P. Tripathi", role: "Director", seats: 120, programmes: [ { code: "ITI_ELECTRICIAN", name: "Electrician", seats: 60 }, { code: "ITI_FITTER", name: "Fitter", seats: 60 } ] },
    { name: "Maa Saraswati ITI Gida", code: "ITI-GKP-08", type: "ITI", district: "Gorakhpur", districtCode: "GORAKHPUR", lat: 26.7410, lng: 83.2120, phone: "0551-270088", contact: "Shri Dinesh Sharma", role: "Training Officer", seats: 100, programmes: [ { code: "ITI_FITTER", name: "Fitter", seats: 50 }, { code: "ITI_WELDER", name: "Welder", seats: 50 } ] },
    { name: "Surya Industrial Training Institute", code: "ITI-GKP-09", type: "ITI", district: "Gorakhpur", districtCode: "GORAKHPUR", lat: 26.7622, lng: 83.4215, phone: "0551-270099", contact: "Shri Ramesh Verma", role: "Principal", seats: 120, programmes: [ { code: "ITI_ELECTRICIAN", name: "Electrician", seats: 60 }, { code: "ITI_COPA", name: "COPA", seats: 60 } ] },
    { name: "Purvanchal ITI Medical College Road", code: "ITI-GKP-10", type: "ITI", district: "Gorakhpur", districtCode: "GORAKHPUR", lat: 26.8041, lng: 83.3980, phone: "0551-270100", contact: "Smt. Sunita Rai", role: "Principal", seats: 90, programmes: [ { code: "ITI_COPA", name: "COPA", seats: 50 }, { code: "ITI_ELECTRICIAN", name: "Electrician", seats: 40 } ] },
    { name: "Vikas ITI Khorabar", code: "ITI-GKP-11", type: "ITI", district: "Gorakhpur", districtCode: "GORAKHPUR", lat: 26.7112, lng: 83.4321, phone: "0551-270111", contact: "Shri Rajesh Gupta", role: "Manager", seats: 100, programmes: [ { code: "ITI_FITTER", name: "Fitter", seats: 50 }, { code: "ITI_WELDER", name: "Welder", seats: 50 } ] },
    { name: "Aryavart ITI Jungle Chhatrapati", code: "ITI-GKP-12", type: "ITI", district: "Gorakhpur", districtCode: "GORAKHPUR", lat: 26.8520, lng: 83.3210, phone: "0551-270122", contact: "Shri Arvind Pandey", role: "Principal", seats: 110, programmes: [ { code: "ITI_ELECTRICIAN", name: "Electrician", seats: 60 }, { code: "ITI_MMV", name: "Mechanic Motor Vehicle", seats: 50 } ] },
    { name: "Kisan ITI Barhalganj", code: "ITI-GKP-13", type: "ITI", district: "Gorakhpur", districtCode: "GORAKHPUR", lat: 26.2810, lng: 83.5012, phone: "0551-270133", contact: "Shri Harish Tiwari", role: "Principal", seats: 120, programmes: [ { code: "ITI_FITTER", name: "Fitter", seats: 60 }, { code: "ITI_ELECTRICIAN", name: "Electrician", seats: 60 } ] },
    { name: "Adarsh ITI Sardarnagar", code: "ITI-GKP-14", type: "ITI", district: "Gorakhpur", districtCode: "GORAKHPUR", lat: 26.7214, lng: 83.6120, phone: "0551-270144", contact: "Shri Anand Singh", role: "Principal", seats: 100, programmes: [ { code: "ITI_ELECTRICIAN", name: "Electrician", seats: 50 }, { code: "ITI_WELDER", name: "Welder", seats: 50 } ] },

    // Gorakhpur Polytechnics
    { name: "Government Polytechnic Gorakhpur", code: "POLY-GKP-01", type: "POLYTECHNIC", district: "Gorakhpur", districtCode: "GORAKHPUR", lat: 26.7650, lng: 83.3850, phone: "0551-233011", contact: "Er. K.N. Rai", role: "Principal", seats: 300, programmes: [ { code: "DIPLOMA_MECHANICAL", name: "Mechanical Engg", seats: 120 }, { code: "DIPLOMA_ELECTRICAL", name: "Electrical Engg", seats: 100 }, { code: "DIPLOMA_CIVIL", name: "Civil Engg", seats: 80 } ] },
    { name: "Government Girls Polytechnic Gorakhpur", code: "POLY-GKP-02", type: "POLYTECHNIC", district: "Gorakhpur", districtCode: "GORAKHPUR", lat: 26.7720, lng: 83.3920, phone: "0551-233022", contact: "Dr. Pratibha Singh", role: "Principal", seats: 180, programmes: [ { code: "DIPLOMA_ELECTRICAL", name: "Electrical Engg", seats: 60 }, { code: "ITI_COPA", name: "Computer Operations", seats: 60 }, { code: "DIPLOMA_CIVIL", name: "Civil Engg", seats: 60 } ] },
    { name: "Maharana Pratap Polytechnic Gorakhpur", code: "POLY-GKP-03", type: "POLYTECHNIC", district: "Gorakhpur", districtCode: "GORAKHPUR", lat: 26.7490, lng: 83.3610, phone: "0551-233033", contact: "Er. V.P. Srivastava", role: "Principal", seats: 240, programmes: [ { code: "DIPLOMA_MECHANICAL", name: "Mechanical Engg", seats: 90 }, { code: "DIPLOMA_ELECTRICAL", name: "Electrical Engg", seats: 90 }, { code: "DIPLOMA_CIVIL", name: "Civil Engg", seats: 60 } ] },
    { name: "GIDA Institute of Polytechnic Sahjanwa", code: "POLY-GKP-04", type: "POLYTECHNIC", district: "Gorakhpur", districtCode: "GORAKHPUR", lat: 26.7450, lng: 83.1950, phone: "0551-233044", contact: "Er. Sandeep Mathur", role: "Director", seats: 150, programmes: [ { code: "DIPLOMA_MECHANICAL", name: "Mechanical Engg", seats: 80 }, { code: "DIPLOMA_ELECTRICAL", name: "Electrical Engg", seats: 70 } ] },
    { name: "Suyash Institute of Information Technology", code: "POLY-GKP-05", type: "POLYTECHNIC", district: "Gorakhpur", districtCode: "GORAKHPUR", lat: 26.7150, lng: 83.4110, phone: "0551-233055", contact: "Dr. Anil Pandey", role: "Principal", seats: 120, programmes: [ { code: "DIPLOMA_ELECTRICAL", name: "Electrical Engg", seats: 60 }, { code: "DIPLOMA_CIVIL", name: "Civil Engg", seats: 60 } ] },
    { name: "Buddha Polytechnic College Gida", code: "POLY-GKP-06", type: "POLYTECHNIC", district: "Gorakhpur", districtCode: "GORAKHPUR", lat: 26.7380, lng: 83.2200, phone: "0551-233066", contact: "Er. R.C. Patel", role: "Director", seats: 180, programmes: [ { code: "DIPLOMA_MECHANICAL", name: "Mechanical Engg", seats: 90 }, { code: "DIPLOMA_ELECTRICAL", name: "Electrical Engg", seats: 90 } ] },

    // Gorakhpur Degree Colleges
    { name: "Deen Dayal Upadhyaya Gorakhpur University", code: "COL-GKP-01", type: "COLLEGE", district: "Gorakhpur", districtCode: "GORAKHPUR", lat: 26.7475, lng: 83.3820, phone: "0551-220150", contact: "Prof. S.K. Shukla", role: "Placement Head", seats: 800, programmes: [ { code: "GRADUATE_BCOM", name: "B.Com", seats: 300 }, { code: "GRADUATE_BSC", name: "B.Sc", seats: 300 }, { code: "GRADUATE_BA", name: "B.A", seats: 200 } ] },
    { name: "St. Andrew's College Gorakhpur", code: "COL-GKP-02", type: "COLLEGE", district: "Gorakhpur", districtCode: "GORAKHPUR", lat: 26.7530, lng: 83.3760, phone: "0551-233405", contact: "Dr. C.O. Samuel", role: "Dean of Students", seats: 500, programmes: [ { code: "GRADUATE_BSC", name: "B.Sc (Comp. & Math)", seats: 200 }, { code: "GRADUATE_BCOM", name: "B.Com", seats: 150 }, { code: "GRADUATE_BA", name: "B.A", seats: 150 } ] },
    { name: "Digvijay Nath Post Graduate College", code: "COL-GKP-03", type: "COLLEGE", district: "Gorakhpur", districtCode: "GORAKHPUR", lat: 26.7570, lng: 83.3890, phone: "0551-233451", contact: "Dr. Rajeev Ranjan", role: "Principal", seats: 450, programmes: [ { code: "GRADUATE_BCOM", name: "B.Com", seats: 200 }, { code: "GRADUATE_BA", name: "B.A", seats: 250 } ] },
    { name: "Madan Mohan Malaviya University of Tech (MMMUT)", code: "COL-GKP-04", type: "COLLEGE", district: "Gorakhpur", districtCode: "GORAKHPUR", lat: 26.7310, lng: 83.4330, phone: "0551-227000", contact: "Prof. P.K. Mishra", role: "Training & Placement Officer", seats: 600, programmes: [ { code: "DIPLOMA_MECHANICAL", name: "B.Tech/Dip Mechanical", seats: 180 }, { code: "DIPLOMA_ELECTRICAL", name: "B.Tech/Dip Electrical", seats: 180 }, { code: "DIPLOMA_CIVIL", name: "B.Tech/Dip Civil", seats: 120 }, { code: "GRADUATE_ANY", name: "All Tech Graduates", seats: 120 } ] },

    // Surrounding Catchment: Deoria (Adjacent East)
    { name: "Government ITI Deoria", code: "ITI-DEO-01", type: "ITI", district: "Deoria", districtCode: "DEORIA", lat: 26.5020, lng: 83.7780, phone: "05568-22011", contact: "Shri O.P. Yadav", role: "Principal", seats: 280, programmes: [ { code: "ITI_ELECTRICIAN", name: "Electrician", seats: 90 }, { code: "ITI_FITTER", name: "Fitter", seats: 90 }, { code: "ITI_WELDER", name: "Welder", seats: 50 }, { code: "ITI_MMV", name: "MMV", seats: 50 } ] },
    { name: "Government ITI Salempur", code: "ITI-DEO-02", type: "ITI", district: "Deoria", districtCode: "DEORIA", lat: 26.3010, lng: 83.9210, phone: "05568-23022", contact: "Shri B.K. Tiwari", role: "Principal", seats: 150, programmes: [ { code: "ITI_ELECTRICIAN", name: "Electrician", seats: 50 }, { code: "ITI_FITTER", name: "Fitter", seats: 50 }, { code: "ITI_COPA", name: "COPA", seats: 50 } ] },
    { name: "Government ITI Rudrapur", code: "ITI-DEO-03", type: "ITI", district: "Deoria", districtCode: "DEORIA", lat: 26.4320, lng: 83.6190, phone: "05568-24033", contact: "Shri S.N. Singh", role: "Principal", seats: 140, programmes: [ { code: "ITI_ELECTRICIAN", name: "Electrician", seats: 50 }, { code: "ITI_WELDER", name: "Welder", seats: 50 }, { code: "ITI_FITTER", name: "Fitter", seats: 40 } ] },
    { name: "Government Polytechnic Deoria", code: "POLY-DEO-01", type: "POLYTECHNIC", district: "Deoria", districtCode: "DEORIA", lat: 26.5120, lng: 83.7850, phone: "05568-25011", contact: "Er. A.K. Rai", role: "Principal", seats: 200, programmes: [ { code: "DIPLOMA_MECHANICAL", name: "Mechanical Engg", seats: 80 }, { code: "DIPLOMA_ELECTRICAL", name: "Electrical Engg", seats: 70 }, { code: "DIPLOMA_CIVIL", name: "Civil Engg", seats: 50 } ] },
    { name: "Baba Raghav Das PG College Deoria", code: "COL-DEO-01", type: "COLLEGE", district: "Deoria", districtCode: "DEORIA", lat: 26.4950, lng: 83.7710, phone: "05568-26011", contact: "Dr. B.N. Upadhyay", role: "Dean", seats: 400, programmes: [ { code: "GRADUATE_BCOM", name: "B.Com", seats: 180 }, { code: "GRADUATE_BSC", name: "B.Sc", seats: 120 }, { code: "GRADUATE_BA", name: "B.A", seats: 100 } ] },

    // Surrounding Catchment: Maharajganj (Adjacent North)
    { name: "Government ITI Maharajganj", code: "ITI-MHG-01", type: "ITI", district: "Maharajganj", districtCode: "MAHARAJGANJ", lat: 27.1420, lng: 83.5610, phone: "05523-22011", contact: "Shri M.K. Verma", role: "Principal", seats: 220, programmes: [ { code: "ITI_ELECTRICIAN", name: "Electrician", seats: 80 }, { code: "ITI_FITTER", name: "Fitter", seats: 70 }, { code: "ITI_COPA", name: "COPA", seats: 70 } ] },
    { name: "Government ITI Nautanwa", code: "ITI-MHG-02", type: "ITI", district: "Maharajganj", districtCode: "MAHARAJGANJ", lat: 27.4280, lng: 83.4210, phone: "05523-23022", contact: "Shri Ram Prasad", role: "Principal", seats: 120, programmes: [ { code: "ITI_ELECTRICIAN", name: "Electrician", seats: 60 }, { code: "ITI_FITTER", name: "Fitter", seats: 60 } ] },
    { name: "Government ITI Pharenda", code: "ITI-MHG-03", type: "ITI", district: "Maharajganj", districtCode: "MAHARAJGANJ", lat: 27.0210, lng: 83.2840, phone: "05523-24033", contact: "Shri J.P. Yadav", role: "Principal", seats: 140, programmes: [ { code: "ITI_FITTER", name: "Fitter", seats: 50 }, { code: "ITI_ELECTRICIAN", name: "Electrician", seats: 50 }, { code: "ITI_WELDER", name: "Welder", seats: 40 } ] },
    { name: "Government Polytechnic Maharajganj", code: "POLY-MHG-01", type: "POLYTECHNIC", district: "Maharajganj", districtCode: "MAHARAJGANJ", lat: 27.1350, lng: 83.5520, phone: "05523-25011", contact: "Er. Manish Roy", role: "Principal", seats: 150, programmes: [ { code: "DIPLOMA_ELECTRICAL", name: "Electrical Engg", seats: 80 }, { code: "DIPLOMA_MECHANICAL", name: "Mechanical Engg", seats: 70 } ] },

    // Surrounding Catchment: Sant Kabir Nagar (Adjacent West)
    { name: "Government ITI Khalilabad", code: "ITI-SKN-01", type: "ITI", district: "Sant Kabir Nagar", districtCode: "SANT_KABIR_NAGAR", lat: 26.7780, lng: 83.0720, phone: "05547-22011", contact: "Shri D.K. Maurya", role: "Principal", seats: 200, programmes: [ { code: "ITI_ELECTRICIAN", name: "Electrician", seats: 70 }, { code: "ITI_FITTER", name: "Fitter", seats: 70 }, { code: "ITI_COPA", name: "COPA", seats: 60 } ] },
    { name: "Government ITI Mehdawal", code: "ITI-SKN-02", type: "ITI", district: "Sant Kabir Nagar", districtCode: "SANT_KABIR_NAGAR", lat: 26.9810, lng: 83.1190, phone: "05547-23022", contact: "Shri H.N. Gupta", role: "Principal", seats: 120, programmes: [ { code: "ITI_ELECTRICIAN", name: "Electrician", seats: 60 }, { code: "ITI_WELDER", name: "Welder", seats: 60 } ] },
    { name: "Government Polytechnic Sant Kabir Nagar", code: "POLY-SKN-01", type: "POLYTECHNIC", district: "Sant Kabir Nagar", districtCode: "SANT_KABIR_NAGAR", lat: 26.7850, lng: 83.0610, phone: "05547-25011", contact: "Er. Naveen Sinha", role: "Principal", seats: 150, programmes: [ { code: "DIPLOMA_MECHANICAL", name: "Mechanical Engg", seats: 80 }, { code: "DIPLOMA_ELECTRICAL", name: "Electrical Engg", seats: 70 } ] },
    { name: "Heera Lal Ram Niwas PG College Khalilabad", code: "COL-SKN-01", type: "COLLEGE", district: "Sant Kabir Nagar", districtCode: "SANT_KABIR_NAGAR", lat: 26.7720, lng: 83.0680, phone: "05547-26011", contact: "Dr. K.P. Singh", role: "Principal", seats: 350, programmes: [ { code: "GRADUATE_BCOM", name: "B.Com", seats: 150 }, { code: "GRADUATE_BA", name: "B.A", seats: 200 } ] },

    // Surrounding Catchment: Kushinagar (Adjacent East/Northeast)
    { name: "Government ITI Padrauna", code: "ITI-KSH-01", type: "ITI", district: "Kushinagar", districtCode: "KUSHINAGAR", lat: 26.9010, lng: 83.9850, phone: "05564-22011", contact: "Shri R.S. Chauhan", role: "Principal", seats: 240, programmes: [ { code: "ITI_ELECTRICIAN", name: "Electrician", seats: 80 }, { code: "ITI_FITTER", name: "Fitter", seats: 80 }, { code: "ITI_MMV", name: "MMV", seats: 80 } ] },
    { name: "Government ITI Hata", code: "ITI-KSH-02", type: "ITI", district: "Kushinagar", districtCode: "KUSHINAGAR", lat: 26.7450, lng: 83.7420, phone: "05564-23022", contact: "Shri K.K. Yadav", role: "Principal", seats: 150, programmes: [ { code: "ITI_ELECTRICIAN", name: "Electrician", seats: 50 }, { code: "ITI_FITTER", name: "Fitter", seats: 50 }, { code: "ITI_WELDER", name: "Welder", seats: 50 } ] },
    { name: "Government ITI Tamkuhi Raj", code: "ITI-KSH-03", type: "ITI", district: "Kushinagar", districtCode: "KUSHINAGAR", lat: 26.6910, lng: 84.1820, phone: "05564-24033", contact: "Shri U.N. Pandey", role: "Principal", seats: 120, programmes: [ { code: "ITI_ELECTRICIAN", name: "Electrician", seats: 60 }, { code: "ITI_COPA", name: "COPA", seats: 60 } ] },
    { name: "Government Polytechnic Kushinagar", code: "POLY-KSH-01", type: "POLYTECHNIC", district: "Kushinagar", districtCode: "KUSHINAGAR", lat: 26.9080, lng: 83.9920, phone: "05564-25011", contact: "Er. Alok Ranjan", role: "Principal", seats: 180, programmes: [ { code: "DIPLOMA_CIVIL", name: "Civil Engg", seats: 60 }, { code: "DIPLOMA_ELECTRICAL", name: "Electrical Engg", seats: 60 }, { code: "DIPLOMA_MECHANICAL", name: "Mechanical Engg", seats: 60 } ] },
    { name: "Buddha Post Graduate College Kushinagar", code: "COL-KSH-01", type: "COLLEGE", district: "Kushinagar", districtCode: "KUSHINAGAR", lat: 26.7410, lng: 83.8890, phone: "05564-26011", contact: "Dr. Arvind Kumar", role: "Principal", seats: 350, programmes: [ { code: "GRADUATE_BA", name: "B.A", seats: 180 }, { code: "GRADUATE_BCOM", name: "B.Com", seats: 170 } ] }
  ];

  const createdInstitutions = [];

  for (const inst of institutionsData) {
    const existing = await prisma.iTI.findFirst({ where: { code: inst.code } });
    let institutionRecord;
    if (!existing) {
      institutionRecord = await prisma.iTI.create({
        data: {
          name: inst.name,
          code: inst.code,
          type: inst.type,
          district: inst.district,
          districtRel: { connect: { code: inst.districtCode } },
          state: 'Uttar Pradesh',
          latitude: inst.lat,
          longitude: inst.lng,
          location: `${inst.lat},${inst.lng}`,
          locationConfidence: 'VERIFIED',
          contactName: inst.contact,
          contactRole: inst.role,
          contactPhone: inst.phone,
          isGovernment: inst.name.startsWith('Government'),
          status: 'ACTIVE',
          trades: inst.programmes.map(p => p.name)
        }
      });
    } else {
      institutionRecord = await prisma.iTI.update({
        where: { id: existing.id },
        data: {
          latitude: inst.lat,
          longitude: inst.lng,
          districtRel: { connect: { code: inst.districtCode } },
          type: inst.type,
          contactName: inst.contact,
          contactRole: inst.role,
          contactPhone: inst.phone
        }
      });
    }
    createdInstitutions.push({ ...institutionRecord, progSpecs: inst.programmes });

    // Seed Programmes
    for (const prog of inst.programmes) {
      const progRecord = await prisma.institutionProgramme.upsert({
        where: { institutionId_programmeCode: { institutionId: institutionRecord.id, programmeCode: prog.code } },
        update: { seats: prog.seats, programmeName: prog.name },
        create: {
          institutionId: institutionRecord.id,
          programmeCode: prog.code,
          programmeName: prog.name,
          seats: prog.seats,
          status: 'ACTIVE'
        }
      });

      // Seed Mapping to Qualification
      await prisma.qualificationProgrammeMapping.upsert({
        where: { qualificationCode_programmeId: { qualificationCode: prog.code, programmeId: progRecord.id } },
        update: { matchStrength: 'EXACT' },
        create: {
          qualificationCode: prog.code,
          programmeId: progRecord.id,
          matchStrength: 'EXACT'
        }
      });

      // Related mappings
      if (prog.code === 'ITI_ELECTRICIAN') {
        await prisma.qualificationProgrammeMapping.upsert({
          where: { qualificationCode_programmeId: { qualificationCode: 'DIPLOMA_ELECTRICAL', programmeId: progRecord.id } },
          update: { matchStrength: 'RELATED' },
          create: { qualificationCode: 'DIPLOMA_ELECTRICAL', programmeId: progRecord.id, matchStrength: 'RELATED' }
        });
      }
      if (prog.code === 'ITI_FITTER') {
        await prisma.qualificationProgrammeMapping.upsert({
          where: { qualificationCode_programmeId: { qualificationCode: 'DIPLOMA_MECHANICAL', programmeId: progRecord.id } },
          update: { matchStrength: 'RELATED' },
          create: { qualificationCode: 'DIPLOMA_MECHANICAL', programmeId: progRecord.id, matchStrength: 'RELATED' }
        });
      }
    }
  }

  // 7. Seed 50 Internship Postings (including Scenarios A, B, C)
  console.log('6. Seeding 50 Demo Internship Postings...');
  const now = new Date();

  // Helper date function
  const addDays = (d, days) => new Date(d.getTime() + days * 24 * 60 * 60 * 1000);

  const postingsData = [
    // Scenario A: Electrical Maintenance Intern (12 openings, 4 apps, closes in 6 days) -> Campus Camp
    {
      title: "Electrical Maintenance Intern",
      companyName: "ABC Manufacturing Ltd.",
      sector: "Manufacturing",
      qualificationCode: "ITI_ELECTRICIAN",
      openings: 12,
      applications: 4,
      windowOpenDate: addDays(now, -15),
      windowCloseDate: addDays(now, 6),
      durationMonths: 6,
      monthlySupport: 4500,
      address: "GIDA Industrial Area, Sector 13, Gorakhpur",
      districtCode: "GORAKHPUR",
      lat: 26.7450,
      lng: 83.2100,
      isScenario: "SCENARIO_A"
    },
    // Scenario B: CNC Operator Intern (10 openings, 2 apps, closes in 9 days) -> Share Bulletin
    {
      title: "CNC Operator Intern",
      companyName: "Precision Auto Components Ltd.",
      sector: "Automotive",
      qualificationCode: "ITI_FITTER",
      openings: 10,
      applications: 2,
      windowOpenDate: addDays(now, -12),
      windowCloseDate: addDays(now, 9),
      durationMonths: 6,
      monthlySupport: 5000,
      address: "Sahjanwa Industrial Corridor, Gorakhpur",
      districtCode: "GORAKHPUR",
      lat: 26.7550,
      lng: 83.1900,
      isScenario: "SCENARIO_B"
    },
    // Scenario C: High risk, 0 institutions within 30 min -> Widen Outreach
    {
      title: "Advanced Robotics & Mechatronics Trainee",
      companyName: "AeroTech Mechatronics",
      sector: "Advanced Engineering",
      qualificationCode: "DIPLOMA_MECHANICAL",
      openings: 5,
      applications: 1,
      windowOpenDate: addDays(now, -10),
      windowCloseDate: addDays(now, 5),
      durationMonths: 12,
      monthlySupport: 7500,
      address: "Remote Border Technology Zone, Sonauli Border, Maharajganj",
      districtCode: "MAHARAJGANJ",
      lat: 27.4850,
      lng: 83.4950,
      isScenario: "SCENARIO_C"
    }
  ];

  // Generate 47 more realistic postings
  const companyPool = [
    { name: "Tata Motors Service Centre", sector: "Automotive" },
    { name: "Schneider Electric Components", sector: "Electronics" },
    { name: "L&T Construction Site Office", sector: "Infrastructure" },
    { name: "Gorakhpur Steel & Wire Mills", sector: "Heavy Industry" },
    { name: "Apollo Diagnostics Logistics", sector: "Healthcare Logistics" },
    { name: "HDFC Life Branch Operations", sector: "Banking & Financial Services" },
    { name: "ITC Foods Processing Plant", sector: "Food Processing" },
    { name: "Dixon Technologies GIDA Unit", sector: "Electronics Manufacturing" },
    { name: "Bajaj Auto Dealership Hub", sector: "Automotive" },
    { name: "Shree Cement Regional Terminal", sector: "Construction Materials" },
    { name: "Reliance Retail Regional Hub", sector: "Retail & Supply Chain" },
    { name: "Gallantt Ispat Gorakhpur Plant", sector: "Steel & Metallurgy" },
    { name: "V-Mart Regional Distribution", sector: "Logistics" },
    { name: "Power Grid Substation Maintenance", sector: "Power & Energy" }
  ];

  const qualPool = [
    "ITI_ELECTRICIAN", "ITI_FITTER", "ITI_COPA", "ITI_MMV", "ITI_WELDER",
    "DIPLOMA_MECHANICAL", "DIPLOMA_ELECTRICAL", "DIPLOMA_CIVIL",
    "GRADUATE_BCOM", "GRADUATE_BSC", "GRADUATE_BA", "GRADUATE_ANY"
  ];

  // 15 High Risk, 15 Medium Risk, 17 Low Risk
  for (let i = 4; i <= 50; i++) {
    const comp = companyPool[i % companyPool.length];
    const qual = qualPool[i % qualPool.length];
    let openings, apps, daysLeft;

    if (i <= 16) {
      // High Risk: apps = 0 or coverage < 0.5 within 14 days
      openings = 8 + (i % 6) * 2; // 8 to 18
      const target = openings * 3;
      apps = i % 3 === 0 ? 0 : Math.floor(target * 0.2); // Low apps
      daysLeft = 4 + (i % 8); // 4 to 11 days left
    } else if (i <= 31) {
      // Medium Risk: coverage < 1.0
      openings = 6 + (i % 5) * 2;
      const target = openings * 3;
      apps = Math.floor(target * 0.65);
      daysLeft = 15 + (i % 15); // 15 to 29 days left
    } else {
      // Low Risk: coverage >= 1.0
      openings = 5 + (i % 4) * 2;
      const target = openings * 3;
      apps = target + 5 + (i % 10);
      daysLeft = 12 + (i % 20);
    }

    const distCode = i % 5 === 0 ? "DEORIA" : i % 7 === 0 ? "MAHARAJGANJ" : "GORAKHPUR";
    const lat = 26.70 + (i * 0.012) % 0.25;
    const lng = 83.25 + (i * 0.015) % 0.35;

    postingsData.push({
      title: `${qual.replace('ITI_', '').replace('DIPLOMA_', '').replace('GRADUATE_', '')} Trainee Intern`,
      companyName: `${comp.name} #${i}`,
      sector: comp.sector,
      qualificationCode: qual,
      openings,
      applications: apps,
      windowOpenDate: addDays(now, -20),
      windowCloseDate: addDays(now, daysLeft),
      durationMonths: 6,
      monthlySupport: 4000 + (i % 5) * 500,
      address: `Industrial Sector Plot ${i * 4}, ${distCode}`,
      districtCode: distCode,
      lat,
      lng,
      isScenario: `POSTING_${i}`
    });
  }

  const createdPostings = [];
  for (let idx = 0; idx < postingsData.length; idx++) {
    const post = postingsData[idx];
    const postingId = `PMIS-${String(idx + 1).padStart(4, '0')}`;
    const postData = {
        roleTitle: post.title,
        companyName: post.companyName,
        sector: post.sector,
        qualificationCode: post.qualificationCode,
        openings: post.openings,
        applications: post.applications,
        windowOpenDate: post.windowOpenDate,
        windowCloseDate: post.windowCloseDate,
        durationMonths: post.durationMonths,
        monthlySupport: post.monthlySupport,
        address: post.address,
        districtCode: post.districtCode,
        stateCode: "UP",
        latitude: post.lat,
        longitude: post.lng,
        location: `${post.lat},${post.lng}`,
        status: post.windowCloseDate < now ? "CLOSED" : "OPEN",
        source: "DEMO",
        sourceReference: post.isScenario,
        applicationHistory: [
          { date: addDays(post.windowOpenDate, 3).toISOString().split('T')[0], count: Math.floor(post.applications * 0.2) },
          { date: addDays(post.windowOpenDate, 7).toISOString().split('T')[0], count: Math.floor(post.applications * 0.6) },
          { date: now.toISOString().split('T')[0], count: post.applications }
        ]
    };
    const record = await prisma.internshipPosting.upsert({
      where: { postingId },
      update: postData,
      create: { postingId, ...postData }
    });
    createdPostings.push(record);

    // Clean up old snapshots for this posting before re-creating
    await prisma.applicationSnapshot.deleteMany({ where: { postingId: record.id, source: "SYSTEM" } });
    await prisma.applicationSnapshot.create({
      data: {
        postingId: record.id,
        count: record.applications,
        observedAt: now,
        source: "SYSTEM"
      }
    });

    // Calculate initial risk snapshot
    const targetApps = record.openings * 3;
    const coverage = record.applications / targetApps;
    const daysLeft = Math.ceil((record.windowCloseDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    let riskLevel = "LOW";
    let reason = "Healthy application coverage";

    if (daysLeft < 0) {
      riskLevel = "CLOSED";
      reason = "Application window expired";
    } else if (record.applications === 0) {
      riskLevel = "HIGH";
      reason = "Zero applications received";
    } else if (coverage < 0.5 && daysLeft <= 14) {
      riskLevel = "HIGH";
      reason = `${record.applications} applications for ${record.openings} openings, closes in ${daysLeft} days`;
    } else if (coverage < 1.0) {
      riskLevel = "MEDIUM";
      reason = `Application coverage below target (current: ${Math.round(coverage * 100)}%)`;
    }

    await prisma.opportunityRiskSnapshot.deleteMany({ where: { postingId: record.id } });
    await prisma.opportunityRiskSnapshot.create({
      data: {
        postingId: record.id,
        riskLevel,
        reason,
        targetApplications: targetApps,
        coverage: Math.round(coverage * 1000) / 1000,
        daysLeft,
        calculatedAt: now
      }
    });
  }

  // 8. Seed Precomputed Travel Times for Key Institutions and Postings
  console.log('7. Seeding Travel Times...');
  // Haversine calculation helper
  function haversineMinutes(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const km = R * c;
    // Assume average speed 35 km/h in mixed urban/semi-urban UP roads + 5 min buffer
    return Math.max(10, Math.round((km / 35) * 60 + 5));
  }

  for (const post of createdPostings.slice(0, 15)) {
    for (const inst of createdInstitutions.slice(0, 20)) {
      if (post.latitude && post.longitude && inst.latitude && inst.longitude) {
        const minutes = haversineMinutes(post.latitude, post.longitude, inst.latitude, inst.longitude);
        await prisma.travelTime.upsert({
          where: { postingId_institutionId: { postingId: post.id, institutionId: inst.id } },
          update: { roadTravelMinutes: minutes },
          create: {
            postingId: post.id,
            institutionId: inst.id,
            roadTravelMinutes: minutes,
            isApproximate: true,
            source: "PRECOMPUTED"
          }
        });
      }
    }
  }

  // 9. Seed Weekly Action Plan Item for Gorakhpur (Week 28 Sep - 04 Oct 2026)
  console.log('8. Seeding Weekly Action Items...');
  const weekId = '2026-W40';
  const scenarioAPosting = createdPostings.find(p => p.sourceReference === 'SCENARIO_A');
  const scenarioBPosting = createdPostings.find(p => p.sourceReference === 'SCENARIO_B');
  const gkpIti = createdInstitutions.find(i => i.code === 'ITI-GKP-01');

  if (scenarioAPosting && gkpIti) {
    const itemA = await prisma.actionPlanItem.upsert({
      where: {
        districtCode_weekIdentifier_postingId: {
          districtCode: 'GORAKHPUR',
          weekIdentifier: weekId,
          postingId: scenarioAPosting.id
        }
      },
      update: {},
      create: {
        districtCode: 'GORAKHPUR',
        weekIdentifier: weekId,
        postingId: scenarioAPosting.id,
        recommendedAction: 'Campus Camp',
        targetInstitutions: [{ id: gkpIti.id, name: gkpIti.name, role: gkpIti.contactRole, phone: gkpIti.contactPhone }],
        isDone: false
      }
    });

    await prisma.actionPlanNote.deleteMany({ where: { itemId: itemA.id } });
    await prisma.actionPlanNote.create({
      data: {
        itemId: itemA.id,
        authorName: 'Rahul Sharma',
        noteText: 'Called Principal Shri R.K. Yadav; scheduled camp for upcoming Friday at 11 AM.'
      }
    });
  }

  if (scenarioBPosting) {
    await prisma.actionPlanItem.upsert({
      where: {
        districtCode_weekIdentifier_postingId: {
          districtCode: 'GORAKHPUR',
          weekIdentifier: weekId,
          postingId: scenarioBPosting.id
        }
      },
      update: {},
      create: {
        districtCode: 'GORAKHPUR',
        weekIdentifier: weekId,
        postingId: scenarioBPosting.id,
        recommendedAction: 'Share Bulletin',
        targetInstitutions: createdInstitutions.slice(0, 3).map(i => ({ id: i.id, name: i.name, contact: i.contactName })),
        isDone: false
      }
    });
  }

  // 10. Seed Illustrative Outcomes
  console.log('9. Seeding Illustrative Outcome Observations...');
  const sampleTargeted = createdPostings.slice(0, 5);
  const sampleUntargeted = createdPostings.slice(5, 10);

  // Clean up old outcome observations from demo data
  await prisma.outcomeObservation.deleteMany({ where: { source: "DEMO_BENCHMARK" } });

  for (const post of sampleTargeted) {
    await prisma.outcomeObservation.create({
      data: {
        postingId: post.id,
        isTargeted: true,
        applicationsTotal: Math.floor(post.openings * 2.2),
        catchmentApplications: Math.floor(post.openings * 1.8),
        offerCount: post.openings,
        acceptanceCount: Math.floor(post.openings * 0.9),
        joiningCount: Math.floor(post.openings * 0.85),
        isIllustrative: true,
        source: "DEMO_BENCHMARK"
      }
    });
  }

  for (const post of sampleUntargeted) {
    await prisma.outcomeObservation.create({
      data: {
        postingId: post.id,
        isTargeted: false,
        applicationsTotal: Math.floor(post.openings * 0.9),
        catchmentApplications: Math.floor(post.openings * 0.4),
        offerCount: Math.floor(post.openings * 0.6),
        acceptanceCount: Math.floor(post.openings * 0.45),
        joiningCount: Math.floor(post.openings * 0.4),
        isIllustrative: true,
        source: "DEMO_BENCHMARK"
      }
    });
  }

  console.log('✅ PMIS Radar Seed Completed Successfully!');
}

seed()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
