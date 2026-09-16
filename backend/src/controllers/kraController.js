import prisma from '../config/prisma.js';

export const createKRA = async (req, res) => {
  try {
    const { id: internshipId } = req.params;
    const { title, description, startDate, dueDate, priority, items } = req.body;

    const internship = await prisma.internship.findUnique({
      where: { id: internshipId },
      include: {
        application: {
          include: { job: true },
        },
      },
    });

    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship not found' });
    }

    if (req.user.role !== 'RECRUITER') {
       return res.status(403).json({ success: false, message: 'Only recruiters can create KRAs' });
    }

    const kra = await prisma.kRA.create({
      data: {
        internshipId,
        title,
        description,
        startDate: new Date(startDate),
        dueDate: new Date(dueDate),
        priority,
        items: items && items.length > 0 ? {
          create: items.map(item => ({ title: item.title }))
        } : undefined
      },
      include: {
        items: true,
      }
    });

    res.status(201).json({ success: true, data: kra });
  } catch (error) {
    console.error('Error creating KRA:', error);
    res.status(500).json({ success: false, message: 'Failed to create KRA' });
  }
};

export const updateKRAStatus = async (req, res) => {
  try {
    const { kraId } = req.params;
    const { status, progress } = req.body;

    const kra = await prisma.kRA.update({
      where: { id: kraId },
      data: { 
        status: status !== undefined ? status : undefined,
        progress: progress !== undefined ? progress : undefined,
      }
    });

    res.json({ success: true, data: kra });
  } catch (error) {
    console.error('Error updating KRA:', error);
    res.status(500).json({ success: false, message: 'Failed to update KRA status' });
  }
};

export const submitEvidence = async (req, res) => {
  try {
    const { kraId } = req.params;
    const { evidenceUrl, notes } = req.body;

    const submission = await prisma.kRASubmission.create({
      data: {
        kraId,
        evidenceUrl,
        notes,
      }
    });

    await prisma.kRA.update({
      where: { id: kraId },
      data: { status: 'SUBMITTED' }
    });

    res.status(201).json({ success: true, data: submission });
  } catch (error) {
    console.error('Error submitting evidence:', error);
    res.status(500).json({ success: false, message: 'Failed to submit evidence' });
  }
};

export const updateKRAItem = async (req, res) => {
  try {
    const { kraId, itemId } = req.params;
    const { completed } = req.body;

    const item = await prisma.kRAItem.update({
      where: { id: itemId },
      data: { completed }
    });

    // Optionally update KRA progress here automatically based on total vs completed items

    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Error updating KRA item:', error);
    res.status(500).json({ success: false, message: 'Failed to update KRA item' });
  }
};
