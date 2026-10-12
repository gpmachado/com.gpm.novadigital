'use strict';

/**
 * @file HourlyMessageStats.js
 * @description Hourly message counters for the Traffic tab in the app settings. Kept apart
 * from the availability policy: the statistics never influence availability decisions.
 */

const HOUR_MS = 60 * 60 * 1000;
const BUCKETS = 24;

/**
 * Compact hourly message counter. It keeps one count per clock hour for the last 24 hours
 * instead of retaining one timestamp per frame.
 */
class HourlyMessageStats {

  constructor() {
    this.lastMessageAt = null;
    this.buckets = {};
  }

  record(timestamp = Date.now()) {
    this._prune(timestamp);
    const key = this._hourStart(timestamp);
    this.buckets[key] = (this.buckets[key] || 0) + 1;
    this.lastMessageAt = timestamp;
  }

  summary(timestamp = Date.now()) {
    this._prune(timestamp);
    const current = this._hourStart(timestamp);
    let last24h = 0;
    for (const count of Object.values(this.buckets)) last24h += count;

    return {
      currentHour: this.buckets[current] || 0,
      previousHour: this.buckets[current - HOUR_MS] || 0,
      last24h,
      lastMessageAt: this.lastMessageAt,
    };
  }

  reset() {
    this.lastMessageAt = null;
    this.buckets = {};
  }

  _prune(timestamp) {
    const oldest = this._hourStart(timestamp) - ((BUCKETS - 1) * HOUR_MS);
    for (const key of Object.keys(this.buckets)) {
      if (Number(key) < oldest) delete this.buckets[key];
    }
  }

  _hourStart(timestamp) {
    return Math.floor(timestamp / HOUR_MS) * HOUR_MS;
  }
}

module.exports = { HourlyMessageStats };
