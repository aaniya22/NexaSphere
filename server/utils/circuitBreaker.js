import logger from './logger.js';

export class CircuitBreaker {
  constructor(fn, options = {}) {
    if (typeof fn !== 'function') {
      throw new Error('CircuitBreaker requires a function to wrap');
    }

    this.fn = fn;
    this.name = options.name || fn.name || 'unnamed';
    this.failureThreshold = options.failureThreshold || 5;
    this.successThreshold = options.successThreshold || 1;
    this.coolDownPeriod = options.coolDownPeriod || 10000;
    this.maxCoolDownPeriod = options.maxCoolDownPeriod || 60000;

    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.tripCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    this.currentCoolDown = this.coolDownPeriod;

    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return this;
  }

  _emit(event, data) {
    const cbs = this.listeners.get(event);
    if (cbs) cbs.forEach((cb) => cb(data));
  }

  async execute(...args) {
    this.checkState();

    if (this.state === 'OPEN') {
      const err = new Error('Circuit breaker is OPEN. Request blocked.');
      err.code = 'CIRCUIT_OPEN';
      throw err;
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
      this._emit('half_open', { name: this.name });
    }
  }

  onSuccess() {
    this.successCount++;
    if (this.state === 'HALF_OPEN') {
      if (this.successCount >= this.successThreshold) {
        this.reset();
      }
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
      this.currentCoolDown = Math.min(this.currentCoolDown * 2, this.maxCoolDownPeriod);
      this.trip();
    }
  }

  trip() {
    this.state = 'OPEN';
    this.tripCount++;
    this.nextAttemptTime = Date.now() + this.currentCoolDown;
    logger.warn(
      `[CircuitBreaker] "${this.name}" tripped to OPEN (cooldown: ${this.currentCoolDown}ms)`
    );
    this._emit('open', { name: this.name, cooldown: this.currentCoolDown });
  }

  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.currentCoolDown = this.coolDownPeriod;
    this.nextAttemptTime = null;
    logger.info(`[CircuitBreaker] "${this.name}" reset to CLOSED`);
    this._emit('closed', { name: this.name });
  }

  async manualRetry(...args) {
    if (this.state === 'CLOSED') {
      return this.execute(...args);
    }
    try {
      const result = await this.fn(...args);
      this.reset();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  forceReset() {
    this.reset();
  }

  getMetrics() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      tripCount: this.tripCount,
      failureThreshold: this.failureThreshold,
      successThreshold: this.successThreshold,
      currentCoolDown: this.currentCoolDown,
      coolDownPeriod: this.coolDownPeriod,
      maxCoolDownPeriod: this.maxCoolDownPeriod,
      nextAttemptInMs: this.nextAttemptTime ? Math.max(0, this.nextAttemptTime - Date.now()) : 0,
    };
  }
}

class CircuitBreakerRegistry {
  constructor() {
    this._breakers = new Map();
  }

  register(name, breaker) {
    if (this._breakers.has(name)) {
      logger.warn(`[CircuitBreakerRegistry] Overwriting existing breaker: "${name}"`);
    }
    this._breakers.set(name, breaker);
    return breaker;
  }

  get(name) {
    return this._breakers.get(name);
  }

  getAllMetrics() {
    const metrics = [];
    for (const breaker of this._breakers.values()) {
      metrics.push(breaker.getMetrics());
    }
    return metrics;
  }

  reset(name) {
    const breaker = this._breakers.get(name);
    if (breaker) {
      breaker.forceReset();
      return true;
    }
    return false;
  }

  async manualRetry(name, ...args) {
    const breaker = this._breakers.get(name);
    if (breaker) {
      return breaker.manualRetry(...args);
    }
    throw new Error(`No circuit breaker registered with name: "${name}"`);
  }
}

export const circuitBreakerRegistry = new CircuitBreakerRegistry();
