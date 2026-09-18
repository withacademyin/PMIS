import prisma from '../config/prisma.js';

export const createCompany = async (req, res) => {
  try {
    // Only Admin can create companies
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
    }

    const { name, website, industry, location, description, size } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Company name is required' });
    }

    const company = await prisma.company.create({
      data: {
        name,
        website,
        industry,
        location,
        description,
        size,
      },
    });

    return res.status(201).json({ success: true, company });
  } catch (err) {
    console.error('Error creating company:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getCompanies = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
    }

    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: { recruiters: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ success: true, companies });
  } catch (err) {
    console.error('Error fetching companies:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getCompanyById = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
    }

    const { id } = req.params;

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        recruiters: {
          include: {
            user: { select: { email: true, createdAt: true } },
          },
        },
        invitations: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    return res.status(200).json({ success: true, company });
  } catch (err) {
    console.error('Error fetching company:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getMyCompany = async (req, res) => {
  try {
    if (req.user.role !== 'RECRUITER') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const recruiter = await prisma.recruiterProfile.findUnique({
      where: { userId: req.user.id },
      include: { company: true },
    });

    if (!recruiter || !recruiter.company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    return res.status(200).json({ success: true, company: recruiter.company });
  } catch (err) {
    console.error('Error fetching my company:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateMyCompany = async (req, res) => {
  try {
    if (req.user.role !== 'RECRUITER') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const recruiter = await prisma.recruiterProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!recruiter || !recruiter.companyId) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const { name, website, industry, location, description, size } = req.body;

    const company = await prisma.company.update({
      where: { id: recruiter.companyId },
      data: {
        name,
        website,
        industry,
        location,
        description,
        size,
      },
    });

    // Simple Audit Log creation
    await prisma.auditLog.create({
      data: {
        actor: req.user.id,
        action: 'UPDATE_COMPANY',
        entity: 'COMPANY',
        entityId: company.id,
        metadata: { fieldsUpdated: Object.keys(req.body) },
      }
    });

    return res.status(200).json({ success: true, company });
  } catch (err) {
    console.error('Error updating my company:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
    }

    const { id } = req.params;

    // Use a transaction to safely nullify recruiters and delete invitations before deleting the company
    await prisma.$transaction(async (tx) => {
      // 1. Delete all pending/existing invitations for this company
      await tx.recruiterInvitation.deleteMany({
        where: { companyId: id },
      });

      // 2. Disassociate recruiters by setting their companyId to null
      await tx.recruiterProfile.updateMany({
        where: { companyId: id },
        data: { companyId: null },
      });

      // 3. Finally, delete the company
      await tx.company.delete({
        where: { id },
      });
    });

    return res.status(200).json({ success: true, message: 'Company deleted successfully' });
  } catch (err) {
    console.error('Error deleting company:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
