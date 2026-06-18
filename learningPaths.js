import express from 'express';
import { requireStudentAuth } from '../middleware/studentAuthMiddleware.js';
import { learningPathService } from '../services/learningPathService.js';
import { learningPathsRepository } from '../repositories/learningPathsRepository.js';

const router = express.Router();

router.get('/learning-paths', async (req, res) => {
  try {
    const paths = await learningPathsRepository.listAll();
    res.json(paths);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/learning-paths/:id', requireStudentAuth, async (req, res) => {
  try {
    const userId = req.studentUser.sub || req.studentUser.id;
    const details = await learningPathService.getPathDetails(userId, req.params.id);
    res.json(details);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

router.post('/learning-paths/:id/enroll', requireStudentAuth, async (req, res) => {
  try {
    const userId = req.studentUser.sub || req.studentUser.id;
    const { targetWeeks, initialLevel } = req.body;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + (targetWeeks || 12) * 7);

    await learningPathsRepository.enrollUser(userId, req.params.id, targetDate, initialLevel || 1);
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/learning-paths/:id/leaderboard', async (req, res) => {
  try {
    const leaderboard = await learningPathService.getLeaderboard(req.params.id);
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post(
  '/learning-paths/milestones/:milestoneId/complete',
  requireStudentAuth,
  async (req, res) => {
    try {
      const userId = req.studentUser.sub || req.studentUser.id;
      const { pathId } = req.body;

      const enrollment = await learningPathsRepository.getUserEnrollment(userId, pathId);
      if (!enrollment) return res.status(404).json({ error: 'Not enrolled in this path' });

      await learningPathsRepository.completeMilestone(enrollment.id, req.params.milestoneId);
      const updated = await learningPathService.calculateProgress(enrollment.id);

      res.json({ success: true, progress: updated.progress_percent });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.post('/learning-paths/:id/assess', requireStudentAuth, async (req, res) => {
  try {
    // Simple logic to set starting level based on quiz score
    const { score } = req.body; // Score from 0-10
    const level = score > 8 ? 3 : score > 4 ? 2 : 1;
    res.json({ recommendedLevel: level });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
