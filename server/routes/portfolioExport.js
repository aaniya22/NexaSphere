import { Router } from 'express';
import { portfolioExportService } from '../services/portfolioExportService.js';
import { portfolioRepository } from '../repositories/portfolioRepository.js';
import { auth } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();

router.get('/:username/pdf', async (req, res) => {
  try {
    const { username } = req.params;
    const { pageSize = 'A4', includeContact = 'true', watermark = 'true' } = req.query;

    const result = await portfolioExportService.generatePDF(username, {
      pageSize,
      includeContact: includeContact === 'true',
      watermark: watermark === 'true',
    });

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="${username}-portfolio.html"`);
    res.send(result.html);
  } catch (error) {
    logger.error('Error generating PDF', { error: error.message, username: req.params.username });
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

router.get('/:username/website', async (req, res) => {
  try {
    const { username } = req.params;
    const { includeSEO = 'true', includeAnalytics = 'false', analyticsId = '' } = req.query;

    const result = await portfolioExportService.generateWebsite(username, {
      includeSEO: includeSEO === 'true',
      includeAnalytics: includeAnalytics === 'true',
      analyticsId,
    });

    res.setHeader('Content-Type', 'application/json');
    res.json({
      success: true,
      data: {
        html: result.html,
        css: result.css,
        assets: result.assets,
        portfolioUrl: result.portfolioUrl,
      },
    });
  } catch (error) {
    logger.error('Error generating website', {
      error: error.message,
      username: req.params.username,
    });
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

router.get('/:username/qr-code', async (req, res) => {
  try {
    const { username } = req.params;
    const portfolioUrl = `${process.env.FRONTEND_URL || 'https://nexasphere.com'}/portfolio/${username}`;
    const qrCode = await portfolioExportService.generateQRCode(portfolioUrl);

    if (!qrCode) {
      return res.status(500).json({ success: false, error: 'Failed to generate QR code' });
    }

    res.json({ success: true, data: { qrCode, url: portfolioUrl } });
  } catch (error) {
    logger.error('Error generating QR code', {
      error: error.message,
      username: req.params.username,
    });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:username/website/html', async (req, res) => {
  try {
    const { username } = req.params;
    const { includeSEO = 'true', includeAnalytics = 'false', analyticsId = '' } = req.query;

    const result = await portfolioExportService.generateWebsite(username, {
      includeSEO: includeSEO === 'true',
      includeAnalytics: includeAnalytics === 'true',
      analyticsId,
    });

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="${username}-portfolio.html"`);
    res.send(result.html);
  } catch (error) {
    logger.error('Error generating website HTML', {
      error: error.message,
      username: req.params.username,
    });
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

router.get('/:username/website/css', async (req, res) => {
  try {
    const { username } = req.params;
    const result = await portfolioExportService.generateWebsite(username);

    res.setHeader('Content-Type', 'text/css');
    res.setHeader('Content-Disposition', `inline; filename="${username}-portfolio.css"`);
    res.send(result.css);
  } catch (error) {
    logger.error('Error generating website CSS', {
      error: error.message,
      username: req.params.username,
    });
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
