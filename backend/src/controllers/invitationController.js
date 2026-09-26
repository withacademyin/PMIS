import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
import { sendOfficerInvitation } from '../services/emailService.js';

const CLIENT_URL = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Admin invites an officer to a District Node
 */
export const inviteOfficer = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
    }

    const { district, email } = req.body;

    if (typeof email !== 'string' || typeof district !== 'string' || !EMAIL_PATTERN.test(email.trim()) || !district.trim()) {
      return res.status(400).json({ success: false, message: 'Email and district are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedDistrict = district.trim();

    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // Check for pending invitations for this email in this district
    const existingInvitation = await prisma.officerInvitation.findFirst({
      where: { email: normalizedEmail, status: 'PENDING', district: normalizedDistrict }
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
        district: normalizedDistrict,
        email: normalizedEmail,
        tokenHash,
        invitedBy: req.user.id,
        expiresAt,
      },
    });

    const inviteLink = `${CLIENT_URL}/auth/signup?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

    try {
      await sendOfficerInvitation(normalizedEmail, normalizedDistrict, inviteLink);
    } catch (e) {
      console.warn('Failed to deliver officer invitation email, invite created with link:', e.message);
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

    if (typeof email !== 'string' || typeof token !== 'string' || typeof password !== 'string' || typeof name !== 'string' || !email.trim() || !token || !password || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Missing required fields: email, token, password, and name are required' });
    }
    if (!EMAIL_PATTERN.test(email.trim()) || token.length > 256 || password.length < 10 || password.length > 128) {
      return res.status(400).json({ success: false, message: 'Invalid email, token, or password length' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const invitation = await prisma.officerInvitation.findFirst({
      where: {
        email: normalizedEmail,
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
      const currentInvitation = await tx.officerInvitation.findUnique({ where: { id: invitation.id } });
      if (!currentInvitation || currentInvitation.status !== 'PENDING' || currentInvitation.expiresAt <= new Date()) {
        throw new Error('Invitation is no longer available');
      }
      const existingUser = await tx.user.findUnique({ where: { email: normalizedEmail } });
      if (existingUser) throw new Error('An account already exists for this email');
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          role: 'OFFICER',
        },
      });

      const officerProfile = await tx.officerProfile.create({
        data: {
          userId: user.id,
          name: name.trim(),
          district: invitation.district,
          department: typeof department === 'string' ? department.trim() || null : null,
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
    if (error.message === 'Invitation is no longer available' || error.message === 'An account already exists for this email') {
      return res.status(409).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
