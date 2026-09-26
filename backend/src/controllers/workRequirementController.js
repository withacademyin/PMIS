import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all requirements for the current officer
export const getMyRequirements = async (req, res) => {
  try {
    const officerId = req.user.officerProfile?.id;
    if (!officerId) {
      return res.status(403).json({ success: false, message: 'Officer profile not found' });
    }

    const requirements = await prisma.workRequirement.findMany({
      where: { officerId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { shortlists: true }
        }
      }
    });

    res.status(200).json({ success: true, data: requirements });
  } catch (error) {
    console.error('Error fetching requirements:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch requirements' });
  }
};

// Get a single requirement by ID
export const getRequirementById = async (req, res) => {
  try {
    const { id } = req.params;
    const officerId = req.user.officerProfile?.id;

    const requirement = await prisma.workRequirement.findUnique({
      where: { id },
      include: {
        shortlists: {
          include: {
            worker: {
              include: {
                user: { select: { email: true } },
                iti: { select: { name: true, district: true } }
              }
            }
          }
        }
      }
    });

    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Requirement not found' });
    }

    if (requirement.officerId !== officerId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this requirement' });
    }

    res.status(200).json({ success: true, data: requirement });
  } catch (error) {
    console.error('Error fetching requirement:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch requirement' });
  }
};

// Create a new requirement
export const createRequirement = async (req, res) => {
  try {
    const officerId = req.user.officerProfile?.id;
    if (!officerId) {
      return res.status(403).json({ success: false, message: 'Officer profile not found' });
    }

    const { title, description, jdText, requiredTrade } = req.body;

    if (typeof title !== 'string' || typeof description !== 'string' || typeof requiredTrade !== 'string' || !title.trim() || !description.trim() || !requiredTrade.trim()) {
      return res.status(400).json({ success: false, message: 'Title, description, and requiredTrade are required' });
    }

    const requirement = await prisma.workRequirement.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        jdText: typeof jdText === 'string' ? jdText.trim() : null,
        requiredTrade: requiredTrade.trim(),
        officerId
      }
    });

    res.status(201).json({ success: true, data: requirement });
  } catch (error) {
    console.error('Error creating requirement:', error);
    res.status(500).json({ success: false, message: 'Failed to create requirement' });
  }
};

// Update a requirement
export const updateRequirement = async (req, res) => {
  try {
    const { id } = req.params;
    const officerId = req.user.officerProfile?.id;
    if (!officerId && req.user.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Officer profile not found' });
    const { title, description, jdText, requiredTrade } = req.body;
    if (title !== undefined && (typeof title !== 'string' || !title.trim())) return res.status(400).json({ success: false, message: 'Title must be a non-empty string' });
    if (description !== undefined && (typeof description !== 'string' || !description.trim())) return res.status(400).json({ success: false, message: 'Description must be a non-empty string' });
    if (requiredTrade !== undefined && (typeof requiredTrade !== 'string' || !requiredTrade.trim())) return res.status(400).json({ success: false, message: 'requiredTrade must be a non-empty string' });
    if (jdText !== undefined && jdText !== null && typeof jdText !== 'string') return res.status(400).json({ success: false, message: 'jdText must be a string' });

    const existing = await prisma.workRequirement.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Requirement not found' });
    }
    if (existing.officerId !== officerId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this requirement' });
    }

    const requirement = await prisma.workRequirement.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : existing.title,
        description: description !== undefined ? description.trim() : existing.description,
        jdText: jdText !== undefined ? (jdText === null ? null : jdText.trim()) : existing.jdText,
        requiredTrade: requiredTrade !== undefined ? requiredTrade.trim() : existing.requiredTrade
      }
    });

    res.status(200).json({ success: true, data: requirement });
  } catch (error) {
    console.error('Error updating requirement:', error);
    res.status(500).json({ success: false, message: 'Failed to update requirement' });
  }
};

// Delete a requirement
export const deleteRequirement = async (req, res) => {
  try {
    const { id } = req.params;
    const officerId = req.user.officerProfile?.id;
    if (!officerId && req.user.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Officer profile not found' });

    const existing = await prisma.workRequirement.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Requirement not found' });
    }
    if (existing.officerId !== officerId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this requirement' });
    }

    await prisma.workRequirement.delete({ where: { id } });

    res.status(200).json({ success: true, message: 'Requirement deleted successfully' });
  } catch (error) {
    console.error('Error deleting requirement:', error);
    res.status(500).json({ success: false, message: 'Failed to delete requirement' });
  }
};
