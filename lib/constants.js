'use strict';

// Single source of truth - matches app.json "version" field.
const { version: APP_VERSION } = require('../app.json');

module.exports = {

  APP_VERSION,

  // Debug
  // true  -> verbose zigbee-clusters frame logging and extra app-side ZCL diagnostics.
  // false -> production logging.
  ZCL_DEBUG: false,

  // Availability watchdog timeouts
  // Time without any Zigbee frame before a device is marked unavailable.
  // The app only has mains-powered switches and smart plugs, so a single tier is needed.

  // Fast tier - mains-powered switches and smart plugs. The availability heartbeat is the
  // Basic-cluster report every ~2.75 min (measured median 165 s on every switch driver, max gap
  // 3.0 min; the DP switches add private 0xFFE2/0xFFE4 attributes), and smart plugs also send
  // measurement frames every few seconds. The onOff periodic report below is NOT the heartbeat.
  HEARTBEAT_FAST_MS: 25 * 60 * 1000, // 25 min

  // ZCL attribute reporting - max interval for the onOff cluster (ZCL switches, plugs).
  // minInterval 0 / minChange 0 is what reports a button press; this max interval only adds a
  // periodic state refresh that corrects a lost report. It is not an availability heartbeat
  // (see HEARTBEAT_FAST_MS). Was 600 s; 1800 s cuts that periodic traffic to a third, and a lost
  // state report is corrected within 30 min instead of 10. Applied at the next app start.
  // (smartplug_3 keeps its own tuned REDUCED_REPORTING table.)
  ONOFF_REPORT_MAX_INTERVAL_S: 1800,              // 30 min (in seconds - ZCL unit)

  // Smart plug (TS011F) - AC-powered with active polling; 10 min covers 5 missed poll cycles.
  SMART_PLUG_POLL_MIN_MS:          2 * 60 * 1000, //  2 min - base poll interval
  SMART_PLUG_POLL_MAX_MS:         15 * 60 * 1000, // 15 min - backoff cap
  SMART_PLUG_VOLTAGE_POLL_EVERY:  5,              // rmsVoltage every 5 cycles  (~10 min)
  SMART_PLUG_ENERGY_POLL_EVERY:  10,              // kWh       every 10 cycles  (~20 min)

  // Chave global de disponibilidade
  // homey.settings key (see settings/index.html): when its stored value is exactly
  // `false`, no device is ever marked unavailable by the watchdog
  // (lib/AvailabilityManager.js#_isGloballyEnabled) - Traffic/Rejoins statistics and
  // the "restore on activity" path keep running unaffected. Absent, or any value
  // other than `false`, means enabled: the historical, always-on behaviour.
  AVAILABILITY_ENABLED_SETTING_KEY: 'availability_enabled',

};
