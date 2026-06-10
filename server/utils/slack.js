/**
 * Slack Alert Integration
 * Sends alerts to Slack for critical errors and metrics
 */

import logger from './logger.js';

/**
 * Send Slack alert
 * @param {Object} alertData - Alert data
 */
async function sendSlackAlert(alertData) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    logger.warn('Slack webhook URL not configured. Skipping alert.');
    return;
  }

  try {
    const payload = formatSlackMessage(alertData);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      logger.error('Failed to send Slack alert', {
        status: response.status,
        statusText: response.statusText,
      });
    } else {
      logger.info('Slack alert sent successfully', { alertType: alertData.title });
    }
  } catch (error) {
    logger.error('Error sending Slack alert', { error: error.message });
  }
}

/**
 * Format alert data for Slack
 * @param {Object} data - Alert data
 */
function formatSlackMessage(data) {
  const color = data.severity === 'critical' ? 'danger' : 'warning';

  const blockFields = [];
  if (data.message) blockFields.push({ type: "mrkdwn", text: `*Message:*\n${data.message}` });
  if (data.url) blockFields.push({ type: "mrkdwn", text: `*URL:*\n${data.url}` });
  if (data.method) blockFields.push({ type: "mrkdwn", text: `*Method:*\n${data.method}` });
  if (data.userId) blockFields.push({ type: "mrkdwn", text: `*User ID:*\n${data.userId}` });
  if (data.timestamp) blockFields.push({ type: "mrkdwn", text: `*Timestamp:*\n${new Date(data.timestamp).toISOString()}` });

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: data.title || "🚨 Alert",
        emoji: true
      }
    }
  ];

  if (blockFields.length > 0) {
    blocks.push({
      type: "section",
      fields: blockFields
    });
  }

  if (data.stack) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Stack Trace:*\n\`\`\`${data.stack}\`\`\``
      }
    });
  }

  blocks.push({
    type: "context",
    elements: [
      {
        type: "plain_text",
        text: "NexaSphere Error Monitoring"
      }
    ]
  });

  return {
    attachments: [
      {
        color: color,
        blocks: blocks
      }
    ]
  };
}

/**
 * Send performance alert
 * @param {Object} metrics - Performance metrics
 */
async function sendPerformanceAlert(metrics) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    return;
  }

  try {
    const payload = {
      attachments: [
        {
          color: metrics.errorRate > 5 ? "danger" : "warning",
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: "📊 Performance Alert",
                emoji: true
              }
            },
            {
              type: "section",
              fields: [
                { type: "mrkdwn", text: `*Error Rate:*\n${metrics.errorRate.toFixed(2)}%` },
                { type: "mrkdwn", text: `*Threshold:*\n5%` },
                { type: "mrkdwn", text: `*Total Requests:*\n${metrics.totalRequests}` },
                { type: "mrkdwn", text: `*Total Errors:*\n${metrics.totalErrors}` }
              ]
            },
            {
              type: "context",
              elements: [
                {
                  type: "plain_text",
                  text: "NexaSphere Performance Monitoring"
                }
              ]
            }
          ]
        }
      ]
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

   if (!response.ok) {
      logger.error("Failed to send performance alert", {
        status: response.status,
        statusText: response.statusText,
      });
    } else {
      logger.info("Performance alert sent successfully");
    }
  } catch (error) {
    logger.error('Error sending performance alert', { error: error.message });
  }
}

/**
 * Send error rate alert
 * @param {number} errorRate - Current error rate
 * @param {number} threshold - Error rate threshold
 */
async function sendErrorRateAlert(errorRate, threshold) {
  sendSlackAlert({
    title: `⚠️ Error Rate Alert`,
    message: `Error rate (${errorRate.toFixed(2)}%) has exceeded threshold (${threshold}%)`,
    severity: errorRate > threshold * 2 ? 'critical' : 'warning',
  });
}

export { sendSlackAlert, formatSlackMessage, sendPerformanceAlert, sendErrorRateAlert };
