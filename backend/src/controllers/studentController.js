
import prisma from '../config/prisma.js';
import { createRequire } from 'module';

// Polyfill DOMMatrix and Path2D for pdf-parse in Node.js
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {};
}
if (typeof globalThis.Path2D === 'undefined') {
  globalThis.Path2D = class Path2D {};
}

const require = createRequire(import.meta.url);
const pdfParseModule = require('pdf-parse/lib/pdf-parse.js');
const pdfParse = typeof pdfParseModule === 'function' ? pdfParseModule : (pdfParseModule.default || pdfParseModule);

import { condenseResume } from '../utils/resumeCondenser.js';
import { parseResumeHybrid } from '../utils/hybridParser.js';

export const onboardStudent = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== 'LEARNER') {
      return res.status(403).json({ success: false, message: 'Forbidden to Access' });
    }

    const { institute, course, manualUpdate } = req.body;
    const file = req.file;

    if (!institute || !course) {
      return res.status(400).json({ success: false, message: 'Institute and course are required to be filled' });
    }

    const isManualUpdate = manualUpdate === 'true';
    let extractedData = { skills: [], languages: [], projectTypes: [], certifications: [], contextBlob: undefined };

    const parseList = (field) => {
      if (!field) return [];
      if (Array.isArray(field)) return field;
      return String(field).split(',').map((s) => s.trim()).filter(Boolean);
    };

    if (isManualUpdate) {
      extractedData.skills = parseList(req.body.skills);
      extractedData.languages = parseList(req.body.languages);
      extractedData.projectTypes = parseList(req.body.projectTypes);
      extractedData.certifications = parseList(req.body.certifications);
    } else if (file && file.buffer) {
      const pdfData = await pdfParse(file.buffer);
      const resumeText = pdfData.text;

      // 1. NLP CONDENSER: Strip fluff and get pure entities
      const contextBlob = condenseResume(resumeText);
      console.log('NLP Extracted Blob:', contextBlob);

      // 2. HYBRID PARSER: Deterministic base + Semantic Recovery + Selective LLM Verification
      const hybridResult = await parseResumeHybrid(resumeText);
      
      // Map rich objects back to standard strings to preserve database schema compatibility
      // In the future, we could save the full rich objects to the StudentSkill model
      extractedData.skills = hybridResult.skills.map(s => s.name);
      extractedData.languages = hybridResult.languages.map(l => l.name);
      extractedData.projectTypes = hybridResult.projectTypes.map(p => p.name);
      extractedData.certifications = hybridResult.certifications.map(c => c.name);
      
      // Save contextBlob for future use by the LLM
      extractedData.contextBlob = contextBlob;
    }

    const updatedProfile = await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: {
        college: institute,
        skills: extractedData.skills,
        languages: extractedData.languages,
        projectTypes: extractedData.projectTypes,
        certifications: extractedData.certifications,
        contextBlob: extractedData.contextBlob !== undefined ? extractedData.contextBlob : undefined,
      },
      create: {
        userId: user.id,
        fullName: user.email.split('@')[0],
        college: institute,
        skills: extractedData.skills,
        languages: extractedData.languages,
        projectTypes: extractedData.projectTypes,
        certifications: extractedData.certifications,
        contextBlob: extractedData.contextBlob || null,
      },
    });

    return res.json({
      success: true,
      message: 'Onboarding complete',
      profile: updatedProfile,
    });
  } catch (err) {
    console.error('Onboarding error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

import { generateSkillAssessment, evaluateSkillAssessment } from '../services/aiService.js';

export const generateAssessment = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'LEARNER') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { skills } = req.body;
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ success: false, message: 'Skills array is required' });
    }

    const profile = await prisma.studentProfile.findUnique({ where: { userId: user.id } });
    if (profile?.lastAssessmentAt) {
      const daysSince = (new Date() - new Date(profile.lastAssessmentAt)) / (1000 * 60 * 60 * 24);
      if (daysSince < 3) {
        return res.status(403).json({ success: false, message: 'You must wait 3 days before retaking the assessment.' });
      }
    }

    const assessment = await generateSkillAssessment(skills, profile?.contextBlob);
    
    return res.json({ success: true, data: assessment });
  } catch (error) {
    console.error('Assessment generation error:', error);
    return res.status(500).json({ success: false, message: 'Server error generating assessment' });
  }
};

export const evaluateAssessment = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'LEARNER') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { answers, infractions = 0 } = req.body;
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ success: false, message: 'Answers array is required' });
    }

    // Evaluate answers
    const scores = await evaluateSkillAssessment(answers);

    // Save scores to StudentProfile
    const profile = await prisma.studentProfile.findUnique({ where: { userId: user.id } });
    
    if (profile) {
      let existingScores = {};
      try {
        existingScores = typeof profile.skillScores === 'string' ? JSON.parse(profile.skillScores) : profile.skillScores;
      } catch(e) {}
      
      let newScores = { ...existingScores, ...scores };

      // Apply cheating penalty
      if (infractions > 0) {
        const penalty = infractions * 10;
        for (const skill in newScores) {
          newScores[skill] = Math.max(0, newScores[skill] - penalty);
        }
      }

      await prisma.studentProfile.update({
        where: { id: profile.id },
        data: { 
          skillScores: newScores,
          cheatingFlags: infractions, // Overwrite with infractions from current session
          lastAssessmentAt: new Date(),
        },
      });
    }

    // Return the scores as they were evaluated minus penalty if any
    if (infractions > 0 && profile) {
      const penalty = infractions * 10;
      for (const skill in scores) {
        scores[skill] = Math.max(0, scores[skill] - penalty);
      }
    }

    return res.json({ success: true, data: scores });
  } catch (error) {
    console.error('Assessment evaluation error:', error);
    return res.status(500).json({ success: false, message: 'Server error evaluating assessment' });
  }
};
