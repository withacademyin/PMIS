import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all shortlists for the current officer
export const getMyShortlists = async (req, res) => {
  try {
    const officerId = req.user.officerProfile?.id;
    if (!officerId) {
      return res.status(403).json({ success: false, message: 'Officer profile not found' });
    }

    const { status, requirementId } = req.query;
    const where = { officerId };
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

    if (!workerId) {
      return res.status(400).json({ success: false, message: 'workerId is required' });
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
        requirementId,
        notes,
        matchScore,
        distanceM
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
    const { status, notes } = req.body;

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
        notes: notes !== undefined ? notes : existing.notes
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
