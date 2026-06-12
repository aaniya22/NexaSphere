# Performance Testing & Continuous Monitoring

## Overview
This guide details the processes and tools we use to track, monitor, and optimize performance across the NexaSphere application. Performance is a critical user experience factor, and our goal is to maintain fast, responsive interactions by actively tracking Core Web Vitals.

## 1. Metrics Tracked
We track standard Web Vitals against the following budgets:
- **First Contentful Paint (FCP)**: < 2.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Total Blocking Time (TBT)**: < 200ms
- **Time to Interactive (TTI)**: < 4s
- **Bundle size**: < 150KB gzip

## 2. CI/CD Integration (Lighthouse)
To prevent performance regressions from reaching production, we enforce a Lighthouse check on every Pull Request.
- **Workflow**: `.github/workflows/lighthouse-ci.yml`
- **Config**: `website/lighthouserc.json`
- **Assertion**: Pull requests will automatically fail if the performance score drops below `0.9` (90) or if any Core Web Vital threshold is violated.

## 3. Real User Monitoring (RUM)
In production, we collect real user performance data using the `web-vitals` library. 
- **Implementation**: Real user metrics (CLS, INP, FCP, LCP, TTFB) are captured in `website/src/reportWebVitals.js`.
- **Analytics Backend**: The data is sent securely to our analytics backend (currently routed via `/api/performance/vitals`).

## 4. Performance Dashboard & Alerts
The performance data sent to the backend is aggregated into our monitoring dashboard (e.g., Datadog, Grafana, or AWS CloudWatch):
- **Historical Trends**: View FCP and LCP improvements/degradations over the last 30 days.
- **Identifying Slow Pages**: The dashboard aggregates data by route, allowing us to pinpoint specifically which pages are underperforming.
- **Alerting**: The system is configured to alert the `#devops-alerts` channel if the p75 of LCP goes above 2.5s for more than 15 minutes.

## 5. Team Responsibilities
- **Review Lighthouse Reports**: Before merging your PR, verify that the Lighthouse check is green. If it fails, open the detailed Lighthouse report to identify what caused the regression.
- **Optimize Assets**: Ensure images are compressed, lazy-loaded, and that large third-party dependencies are code-split.
