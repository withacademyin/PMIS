import prisma from '../config/prisma.js';

const normalizeTrade = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const tradeMatches = (itiTrades, requiredTrade) => {
  const requested = requiredTrade.split(/[;,]/).map(normalizeTrade).filter(Boolean);
  return requested.filter((trade) => itiTrades.some((itiTrade) => {
    const normalized = normalizeTrade(itiTrade);
    return normalized === trade || normalized.includes(trade) || trade.includes(normalized);
  }));
};

async function getOwnedRequirement(id, user) {
  const requirement = await prisma.workRequirement.findUnique({
    where: { id },
    include: { officer: true },
  });

  if (!requirement) return null;
  if (user.role !== 'ADMIN' && requirement.officerId !== user.officerProfile?.id) return false;
  return requirement;
}

export const matchRequirementToITIs = async (req, res) => {
  try {
    const requirement = await getOwnedRequirement(req.params.id, req.user);
    if (requirement === null) return res.status(404).json({ success: false, message: 'Requirement not found' });
    if (requirement === false) return res.status(403).json({ success: false, message: 'Not authorized to match this requirement' });

    const district = req.user.role === 'ADMIN' ? (req.body.district || requirement.officer.district) : requirement.officer.district;
    const itis = await prisma.iTI.findMany({
      where: { district: { equals: district, mode: 'insensitive' }, status: 'ACTIVE' },
      include: {
        _count: { select: { workers: true } },
        workers: {
          where: {
            trade: { equals: requirement.requiredTrade, mode: 'insensitive' },
            isVerified: true,
            availabilityStatus: 'AVAILABLE',
          },
          select: { id: true },
        },
      },
    });

    const recommendations = itis
      .map((iti) => {
        const matchedTrades = tradeMatches(iti.trades, requirement.requiredTrade);
        const matchingWorkers = iti.workers.length;
        const tradeScore = matchedTrades.length ? 70 + Math.min(20, matchedTrades.length * 10) : 0;
        const workerScore = Math.min(10, matchingWorkers * 2);
        const score = tradeScore ? Math.min(100, tradeScore + workerScore) : 0;
        const reasons = [
          `${iti.district} district match`,
          matchedTrades.length ? `Offers: ${matchedTrades.join(', ')}` : 'Required trade not found in institute trade list',
          matchingWorkers ? `${matchingWorkers} verified available ${requirement.requiredTrade} worker${matchingWorkers === 1 ? '' : 's'}` : 'No verified available workers registered yet',
          `${iti._count.workers} total registered worker${iti._count.workers === 1 ? '' : 's'}`,
        ];

        return {
          requirementId: requirement.id,
          itiId: iti.id,
          score,
          reasons,
          status: 'RECOMMENDED',
        };
      })
      .filter((recommendation) => recommendation.score > 0)
      .sort((left, right) => right.score - left.score);

    await prisma.$transaction([
      prisma.iTIRecommendation.deleteMany({ where: { requirementId: requirement.id } }),
      ...recommendations.map((recommendation) => prisma.iTIRecommendation.create({ data: recommendation })),
    ]);

    const savedRecommendations = await prisma.iTIRecommendation.findMany({
      where: { requirementId: requirement.id },
      include: { iti: { include: { _count: { select: { workers: true } } } } },
      orderBy: [{ score: 'desc' }, { iti: { name: 'asc' } }],
    });

    return res.json({ success: true, count: savedRecommendations.length, data: savedRecommendations });
  } catch (error) {
    console.error('Error matching requirement to ITIs:', error);
    return res.status(500).json({ success: false, message: 'Failed to match requirement to ITIs' });
  }
};

export const getRequirementITIs = async (req, res) => {
  try {
    const requirement = await getOwnedRequirement(req.params.id, req.user);
    if (requirement === null) return res.status(404).json({ success: false, message: 'Requirement not found' });
    if (requirement === false) return res.status(403).json({ success: false, message: 'Not authorized to view this requirement' });

    const recommendations = await prisma.iTIRecommendation.findMany({
      where: { requirementId: requirement.id },
      include: {
        iti: {
          include: { _count: { select: { workers: true } } },
        },
      },
      orderBy: [{ score: 'desc' }, { iti: { name: 'asc' } }],
    });

    return res.json({ success: true, count: recommendations.length, data: recommendations });
  } catch (error) {
    console.error('Error fetching ITI recommendations:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch ITI recommendations' });
  }
};

export const getITIWorkers = async (req, res) => {
  try {
    const iti = await prisma.iTI.findUnique({ where: { id: req.params.id }, select: { id: true, district: true } });
    if (!iti) return res.status(404).json({ success: false, message: 'ITI not found' });

    if (req.user.role !== 'ADMIN' && iti.district.toLowerCase() !== req.user.officerProfile?.district?.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'ITI is outside your assigned district' });
    }

    const { trade } = req.query;
    const workers = await prisma.workerProfile.findMany({
      where: {
        itiId: iti.id,
        ...(trade ? { trade: { equals: trade, mode: 'insensitive' } } : {}),
      },
      include: { user: { select: { email: true } } },
      orderBy: [{ isVerified: 'desc' }, { fullName: 'asc' }],
    });

    return res.json({ success: true, count: workers.length, data: workers });
  } catch (error) {
    console.error('Error fetching ITI workers:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch ITI workers' });
  }
};