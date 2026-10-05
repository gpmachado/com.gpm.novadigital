'use strict';

/**
 * App Settings API.
 *
 * Only devices with an AvailabilityManager are returned. Multi-gang drivers
 * install the manager on their main/EP1 device only, producing one row per
 * physical Zigbee node.
 *
 * getAvailabilitySetting/setAvailabilitySetting cover the app-wide on/off switch
 * (see lib/AvailabilityManager.js, "Global switch") - turning it off also
 * force-restores every device that is currently unavailable, in the same pass.
 */
const { AVAILABILITY_ENABLED_SETTING_KEY } = require('./lib/constants');

/**
 * Every installed device across every driver.
 * @param {object} homey
 * @yields {object} device
 */
function* allDevices(homey) {
  for (const driver of Object.values(homey.drivers.getDrivers())) {
    yield* driver.getDevices();
  }
}

module.exports = {
  async getMessageStats({ homey }) {
    const rowsByPhysicalDevice = new Map();
    const drivers = homey.drivers.getDrivers();
    const rejoinSince = homey.settings.get('rejoin_tracking_since') || null;

    for (const [driverId, driver] of Object.entries(drivers)) {
      for (const device of driver.getDevices()) {
        const manager = device._availability;
        if (!manager || typeof manager.getMessageStats !== 'function') continue;

        const data = device.getData?.() || {};
        const settings = device.getSettings?.() || {};
        const physicalId = data.ieeeAddress
          || settings.zb_ieee_address
          || device.getId();
        const fullStats = manager.getMessageStats();
        const stats = {
          mode: fullStats.mode,
          currentHour: fullStats.currentHour,
          previousHour: fullStats.previousHour,
          last24h: fullStats.last24h,
          lastMessageAt: fullStats.lastMessageAt,
          bySource: fullStats.bySource,
        };

        const row = {
          id: device.getId(),
          physicalId,
          endpoint: 1,
          name: device.getName(),
          zone: device.getZone?.()?.getName?.() || '',
          driverId,
          modelId: data.modelId || settings.zb_product_id || '',
          manufacturerName:
            data.manufacturerName || settings.zb_manufacturer_name || '',
          available: device.getAvailable(),
          stats,
          rejoinCount: device.getStoreValue?.('rejoin_count') ?? null,
          rejoinLastAt: device.getStoreValue?.('rejoin_last_at') ?? null,
          rejoinSince,
        };

        const existing = rowsByPhysicalDevice.get(physicalId);
        const isMain = !data.subDeviceId;
        if (!existing || (isMain && existing.isSubDevice)) {
          rowsByPhysicalDevice.set(physicalId, {
            ...row,
            isSubDevice: Boolean(data.subDeviceId),
          });
        }
      }
    }

    return Array.from(rowsByPhysicalDevice.values())
      .map(({ isSubDevice, ...row }) => row);
  },

  async resetMessageStats({ homey }) {
    const managers = new Set();
    const drivers = homey.drivers.getDrivers();

    for (const driver of Object.values(drivers)) {
      for (const device of driver.getDevices()) {
        const manager = device._availability;
        if (manager && typeof manager.resetMessageStats === 'function') {
          managers.add(manager);
        }
      }
    }

    const results = await Promise.allSettled(
      Array.from(managers, manager => manager.resetMessageStats()),
    );
    const failures = results.filter(result => result.status === 'rejected');

    if (failures.length > 0) {
      throw new Error(
        `Failed to reset ${failures.length} of ${results.length} statistics counters`,
      );
    }

    return { reset: results.length };
  },

  async resetRejoinStats({ homey }) {
    const drivers = homey.drivers.getDrivers();
    const writes = [];

    for (const driver of Object.values(drivers)) {
      for (const device of driver.getDevices()) {
        if (device.getStoreValue?.('rejoin_count') !== undefined) {
          writes.push(device.setStoreValue('rejoin_count', 0));
          writes.push(device.setStoreValue('rejoin_last_at', null));
        }
      }
    }

    await Promise.allSettled(writes);
    homey.settings.set('rejoin_tracking_since', Date.now());

    return { since: homey.settings.get('rejoin_tracking_since') };
  },

  async getAvailabilitySetting({ homey }) {
    return { enabled: homey.settings.get(AVAILABILITY_ENABLED_SETTING_KEY) !== false };
  },

  /**
   * body.enabled must be an actual boolean - not truthy/falsy-coerced - so a client that
   * serializes booleans as strings ({"enabled":"false"}) gets a clear error instead of
   * silently having its intent inverted (Boolean("false") === true), and a missing or
   * malformed body errors instead of silently taking the "disable everything" branch.
   */
  async setAvailabilitySetting({ homey, body }) {
    if (typeof body?.enabled !== 'boolean') {
      throw new Error('enabled must be a boolean');
    }
    const enabled = body.enabled;
    homey.settings.set(AVAILABILITY_ENABLED_SETTING_KEY, enabled);
    // Unconditional: the only confirmation in the log that the toggle was received at all
    // (the gates in AvailabilityManager are silent by design).
    homey.log(`[Availability] Global switch turned ${enabled ? 'on' : 'off'}`);

    // Force-restore every device that is currently unavailable: turning the switch off
    // means "no device should be marked unavailable by timeout", which includes ones the
    // watchdog already caught before this call. The setting above is already persisted
    // regardless of how this goes - a partial restore failure is reported back as
    // `restoreFailures` instead of throwing, so the caller never has to guess whether the
    // setting itself took effect from an error alone.
    let restoreFailures = 0;
    if (!enabled) {
      const restores = [];
      for (const device of allDevices(homey)) {
        const manager = device._availability;
        if (manager && typeof manager.markAvailable === 'function' && !device.getAvailable()) {
          restores.push(manager.markAvailable());
        }
      }

      if (restores.length > 0) {
        homey.log(`[Availability] Restoring ${restores.length} device(s) that were unavailable`);
      }

      const results = await Promise.allSettled(restores);
      restoreFailures = results.filter(result => result.status === 'rejected').length;
      if (restoreFailures > 0) {
        homey.error(
          `[Availability] Switch turned off, but failed to restore ${restoreFailures} of ${results.length} devices`,
        );
      }
    }

    return { enabled, restoreFailures };
  },
};
