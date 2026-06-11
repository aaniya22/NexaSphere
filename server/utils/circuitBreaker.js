/**
 * Circuit Breaker Pattern Implementation
 * Protects remote calls and external API requests from cascading failures.
 */
export class CircuitBreaker {
  constructor(fn, options = {}) {
    if (typeof fn !== 'function') {
      throw new Error('CircuitBreaker requires a function to wrap');
    }

    this.fn = fn;
    this.failureThreshold = options.failureThreshold || 5;
    this.coolDownPeriod = options.coolDownPeriod || 10000; // 10s default
    this.maxCoolDownPeriod = options.maxCoolDownPeriod || 60000; // 60s default

    // State Variables
    this.state = 'CLOSED'; // 'CLOSED', 'OPEN', 'HALF_OPEN'
    this.failureCount = 0;
    this.successCount = 0;
    this.tripCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    this.currentCoolDown = this.coolDownPeriod;
  }

  async execute(...args) {
    this.checkState();

    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN. Request blocked.');
    }

    try {
      const result = await this.fn(...args);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  checkState() {
    if (this.state === 'OPEN' && Date.now() >= this.nextAttemptTime) {
      this.state = 'HALF_OPEN';
    }
  }

  onSuccess() {
    this.successCount++;
    if (this.state === 'HALF_OPEN') {
      this.reset();
    } else {
      this.failureCount = 0;
    }
  }

  onFailure(error) {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'CLOSED') {
      if (this.failureCount >= this.failureThreshold) {
        this.trip();
      }
    } else if (this.state === 'HALF_OPEN') {
      // In Half-Open, a single failure trips the circuit back to OPEN with exponential backoff
      this.currentCoolDown = Math.min(this.currentCoolDown * 2, this.maxCoolDownPeriod);
      this.trip();
    }
  }

  trip() {
    this.state = 'OPEN';
    this.tripCount++;
    this.nextAttemptTime = Date.now() + this.currentCoolDown;
  }

  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.currentCoolDown = this.coolDownPeriod;
    this.nextAttemptTime = null;
  }

  getMetrics() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      tripCount: this.tripCount,
      currentCoolDown: this.currentCoolDown,
      nextAttemptInMs: this.nextAttemptTime ? Math.max(0, this.nextAttemptTime - Date.now()) : 0
    };
  }
}
