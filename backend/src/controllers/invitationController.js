import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
import { sendRecruiterInvitation } from '../services/emailService.js';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

/**
 * Admin invites a recruiter to a company
 */
export const inviteRecruiter = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { companyId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Check for pending invitations
    const existingInvitation = await prisma.recruiterInvitation.findFirst({
      where: { email, status: 'PENDING', companyId }
    });
    if (existingInvitation) {
      return res.status(400).json({ success: false, message: 'Invitation already pending for this email' });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    const invitation = await prisma.recruiterInvitation.create({
      data: {
        companyId,
        email,
        tokenHash,
        invitedBy: req.user.id,
        expiresAt,
      },
    });

    const inviteLink = `${CLIENT_URL}/auth/accept-invite?token=${token}&email=${encodeURIComponent(email)}`;

    await sendRecruiterInvitation(email, company.name, inviteLink);

    return res.status(201).json({ success: true, message: 'Invitation sent successfully', invitationId: invitation.id });
  } catch (error) {
    console.error('Error inviting recruiter:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Public endpoint for accepting recruiter invitation
 */
export const acceptInvitation = async (req, res) => {
  try {
    const { email, token, password, name } = req.body;

    if (!email || !token || !password || !name) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const invitation = await prisma.recruiterInvitation.findFirst({
      where: {
        email,
        tokenHash,
        status: 'PENDING',
        expiresAt: { gt: new Date() }
      },
      include: { company: true }
    });

    if (!invitation) {
      return res.status(400).json({ success: false, message: 'Invalid or expired invitation' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Use a Prisma transaction to ensure Atomicity
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'RECRUITER',
        },
      });

      const recruiterProfile = await tx.recruiterProfile.create({
        data: {
          userId: user.id,
          companyName: invitation.company.name,
          companyId: invitation.companyId,
        },
      });

      await tx.recruiterInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });

      return { user, recruiterProfile };
    });

    return res.status(200).json({ success: true, message: 'Invitation accepted. You can now log in.' });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
