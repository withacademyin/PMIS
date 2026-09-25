import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
import { sendOfficerInvitation } from '../services/emailService.js';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

/**
 * Admin invites an officer to a District Node
 */
export const inviteOfficer = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
    }

    const { district, email } = req.body;

    if (!email || !district) {
      return res.status(400).json({ success: false, message: 'Email and district are required' });
    }

    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // Check for pending invitations for this email in this district
    const existingInvitation = await prisma.officerInvitation.findFirst({
      where: { email, status: 'PENDING', district }
    });
    if (existingInvitation) {
      return res.status(400).json({ success: false, message: 'Invitation already pending for this email in this district' });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    const invitation = await prisma.officerInvitation.create({
      data: {
        district,
        email,
        tokenHash,
        invitedBy: req.user.id,
        expiresAt,
      },
    });

    const inviteLink = `${CLIENT_URL}/auth/signup?token=${token}`;
    
    console.log(`\n\n=== INVITATION LINK FOR ${email} in ${district} ===\n${inviteLink}\n====================================\n`);

    try {
      await sendOfficerInvitation(email, district, inviteLink);
    } catch (e) {
      console.warn("Failed to send email, but invite created. Error: ", e);
    }

    return res.status(201).json({ success: true, message: 'Invitation sent successfully', invitationId: invitation.id, inviteLink });
  } catch (error) {
    console.error('Error inviting officer:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Public endpoint for accepting officer invitation
 */
export const acceptInvitation = async (req, res) => {
  try {
    const { email, token, password, name, department } = req.body;

    if (!email || !token || !password || !name) {
      return res.status(400).json({ success: false, message: 'Missing required fields: email, token, password, and name are required' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const invitation = await prisma.officerInvitation.findFirst({
      where: {
        email,
        tokenHash,
        status: 'PENDING',
        expiresAt: { gt: new Date() }
      }
    });

    if (!invitation) {
      return res.status(400).json({ success: false, message: 'Invalid or expired invitation' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'OFFICER',
        },
      });

      const officerProfile = await tx.officerProfile.create({
        data: {
          userId: user.id,
          name: name,
          district: invitation.district,
          department: department || null,
          isVerified: true,
        },
      });

      await tx.officerInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });

      return { user, officerProfile };
    });

    return res.status(200).json({ success: true, message: 'Invitation accepted. You can now log in as Nodal Officer.' });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
