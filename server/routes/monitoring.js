/**
 * Monitoring & Error Tracking API Routes
 * Provides endpoints for dashboard and error tracking
 */

import express from 'express';
const router = express.Router();
import { getMetrics } from '../middleware/performanceMonitor.js';
import {
  getErrorStats,
  getRecentErrors,
  getEndpointErrors,
  getUserErrors,
} from '../services/errorTrackingService.js';
import logger from '../utils/logger.js';

function requireMonitoringAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.slice(7).trim();
  const expectedToken = process.env.MONITORING_API_TOKEN;

  if (!expectedToken || token !== expectedToken) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
}

/**
 * GET /api/monitoring/health
 * Public liveness probe with no auth required.
 * Returns only liveness status and a timestamp. Operational details such as
 * process uptime and NODE_ENV are deliberately omitted so unauthenticated
 * callers cannot fingerprint the environment or infer deployment timing. The
 * authenticated /metrics endpoint remains the source for detailed telemetry.
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
  });
});

/**
 * GET /api/monitoring/metrics
 * Get current performance metrics
 */
router.get('/metrics', requireMonitoringAuth, (req, res) => {
  try {
    const metrics = getMetrics();

    res.status(200).json({
      success: true,
      data: metrics,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error fetching metrics', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch metrics',
    });
  }
});

/**
 * GET /api/monitoring/errors/stats
 * Get error statistics
 */
router.get('/errors/stats', requireMonitoringAuth, (req, res) => {
  try {
    const stats = getErrorStats();

    res.status(200).json({
      success: true,
      data: stats,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error fetching error stats', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch error statistics',
    });
  }
});

/**
 * GET /api/monitoring/errors/recent
 * Get recent errors
 * Query params: limit (default 50)
 */
router.get('/errors/recent', requireMonitoringAuth, (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 1000);
    const errors = getRecentErrors(limit);

    res.status(200).json({
      success: true,
      data: errors,
      count: errors.length,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error fetching recent errors', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent errors',
    });
  }
});

/**
 * GET /api/monitoring/errors/endpoint/:endpoint
 * Get errors for specific endpoint
 */
router.get('/errors/endpoint', requireMonitoringAuth, (req, res) => {
  try {
    const endpoint = req.query.url;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        error: 'URL query parameter is required',
      });
    }

    const limit = Math.min(parseInt(req.query.limit) || 20, 1000);
    const errors = getEndpointErrors(endpoint, limit);

    res.status(200).json({
      success: true,
      data: errors,
      count: errors.length,
      endpoint,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error fetching endpoint errors', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch endpoint errors',
    });
  }
});

/**
 * GET /api/monitoring/errors/user/:userId
 * Get errors for specific user
 */
router.get('/errors/user/:userId', requireMonitoringAuth, (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 20, 1000);
    const errors = getUserErrors(userId, limit);

    res.status(200).json({
      success: true,
      data: errors,
      count: errors.length,
      userId,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error fetching user errors', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user errors',
    });
  }
});

/**
 * GET /api/monitoring/logs
 * Get application logs
 * Query params: level, limit
 */
router.get('/logs', requireMonitoringAuth, (req, res) => {
  try {
    const level = req.query.level || 'all';
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000);

    res.status(200).json({
      success: true,
      message: 'Logs are available in server/logs/combined.log',
      locations: {
        error: 'server/logs/error.log',
        combined: 'server/logs/combined.log',
        exceptions: 'server/logs/exceptions.log',
        rejections: 'server/logs/rejections.log',
      },
    });
  } catch (error) {
    logger.error('Error fetching logs', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch logs',
    });
  }
});

/**
 * POST /api/monitoring/test-error
 * Test endpoint for triggering an error
 * For development/testing only
 */
router.post('/test-error', requireMonitoringAuth, (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      error: 'Test endpoint not available in production',
    });
  }

  logger.info('Test error triggered');

  const testError = new Error('This is a test error for monitoring');
  testError.statusCode = 500;

  next(testError);
});

export default router;
