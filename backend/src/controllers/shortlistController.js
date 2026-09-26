import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all shortlists for the current officer
export const getMyShortlists = async (req, res) => {
  try {
    const officerId = req.user.officerProfile?.id;
    if (!officerId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Officer profile not found' });
    }

    const { status, requirementId } = req.query;
    const where = officerId ? { officerId } : {};
    if (status) where.status = status;
    if (requirementId) where.requirementId = requirementId;

    const shortlists = await prisma.shortlist.findMany({
      where,
      orderBy: { shortlistedAt: 'desc' },
      include: {
        worker: {
          select: {
            id: true,
            fullName: true,
            trade: true,
            iti: { select: { name: true, district: true } }
          }
        },
        requirement: {
          select: { title: true, requiredTrade: true }
        }
      }
    });

    res.status(200).json({ success: true, data: shortlists });
  } catch (error) {
    console.error('Error fetching shortlists:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch shortlists' });
  }
};

// Add a worker to shortlist
export const addToShortlist = async (req, res) => {
  try {
    const officerId = req.user.officerProfile?.id;
    if (!officerId) {
      return res.status(403).json({ success: false, message: 'Officer profile not found' });
    }

    const { workerId, requirementId, notes, matchScore, distanceM } = req.body;

    if (typeof workerId !== 'string' || !workerId.trim()) {
      return res.status(400).json({ success: false, message: 'workerId is required' });
    }
    if (matchScore !== undefined && matchScore !== null && (!Number.isFinite(Number(matchScore)) || Number(matchScore) < 0 || Number(matchScore) > 100)) {
      return res.status(400).json({ success: false, message: 'matchScore must be between 0 and 100' });
    }
    if (distanceM !== undefined && distanceM !== null && (!Number.isFinite(Number(distanceM)) || Number(distanceM) < 0)) {
      return res.status(400).json({ success: false, message: 'distanceM must be a non-negative number' });
    }
    if (notes !== undefined && notes !== null && typeof notes !== 'string') {
      return res.status(400).json({ success: false, message: 'notes must be a string' });
    }

    const worker = await prisma.workerProfile.findUnique({ where: { id: workerId }, select: { id: true, trade: true, itiId: true, iti: { select: { district: true } } } });
    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });
    const district = req.user.officerProfile.district;
    if (!worker.iti || worker.iti.district.toLowerCase() !== district.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'Worker is outside your assigned district' });
    }
    if (requirementId) {
      const requirement = await prisma.workRequirement.findFirst({
        where: {
          id: requirementId,
          officerId,
          requiredTrade: { equals: worker.trade || '', mode: 'insensitive' },
          recommendations: { some: { itiId: worker.itiId } },
        },
      });
      if (!requirement) return res.status(403).json({ success: false, message: 'Requirement is not assigned to your account or the worker is not a matched candidate' });
      if (requirement.requiredTrade.toLowerCase() !== worker.trade?.toLowerCase()) {
        return res.status(400).json({ success: false, message: 'Worker trade does not match the requirement' });
      }
    }

    // Check if worker already shortlisted for this requirement
    const existing = await prisma.shortlist.findFirst({
      where: {
        workerId,
        officerId,
        requirementId: requirementId || null
      }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Worker is already shortlisted for this requirement' });
    }

    const shortlist = await prisma.shortlist.create({
      data: {
        workerId,
        officerId,
        requirementId: requirementId || null,
        notes: typeof notes === 'string' ? notes.trim() : null,
        matchScore: matchScore !== undefined && matchScore !== null ? Number(matchScore) : null,
        distanceM: distanceM !== undefined && distanceM !== null ? Number(distanceM) : null
      }
    });

    res.status(201).json({ success: true, data: shortlist });
  } catch (error) {
    console.error('Error adding to shortlist:', error);
    res.status(500).json({ success: false, message: 'Failed to add to shortlist' });
  }
};

// Update shortlist status
export const updateShortlistStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const officerId = req.user.officerProfile?.id;
    if (!officerId && req.user.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Officer profile not found' });
    const { status, notes } = req.body;
    const allowedStatuses = ['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'ACCEPTED', 'REJECTED'];
    if (status !== undefined && !allowedStatuses.includes(status)) return res.status(400).json({ success: false, message: 'Invalid shortlist status' });
    if (notes !== undefined && notes !== null && typeof notes !== 'string') return res.status(400).json({ success: false, message: 'notes must be a string' });

    const existing = await prisma.shortlist.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Shortlist not found' });
    }
    
    if (existing.officerId !== officerId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this shortlist' });
    }

    const shortlist = await prisma.shortlist.update({
      where: { id },
      data: {
        status: status !== undefined ? status : existing.status,
        notes: notes !== undefined ? (notes === null ? null : notes.trim()) : existing.notes
      }
    });

    res.status(200).json({ success: true, data: shortlist });
  } catch (error) {
    console.error('Error updating shortlist:', error);
    res.status(500).json({ success: false, message: 'Failed to update shortlist' });
  }
};

// Remove from shortlist
export const removeFromShortlist = async (req, res) => {
  try {
    const { id } = req.params;
    const officerId = req.user.officerProfile?.id;
    if (!officerId && req.user.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Officer profile not found' });

    const existing = await prisma.shortlist.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Shortlist not found' });
    }
    if (existing.officerId !== officerId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this shortlist' });
    }

    await prisma.shortlist.delete({ where: { id } });

    res.status(200).json({ success: true, message: 'Worker removed from shortlist' });
  } catch (error) {
    console.error('Error removing from shortlist:', error);
    res.status(500).json({ success: false, message: 'Failed to remove from shortlist' });
  }
};
