'use strict';

const NovaDigitalTuyaDpSwitchBase = require('../../lib/NovaDigitalTuyaDpSwitchBase');

// Nova Digital TPZ-3 / Moes SFL02-Z-3 (TS0601). DP numbers from the Zigbee2MQTT definition.
// Hardware log 2026-10-18: gangs 1 and 2 switch and report; DP 36 and 104 only seen in the
// pairing dump (types match), writing them is not tested yet. Same for the inching DPs.
const DP = {
  GANG1:     24,
  GANG2:     25,
  GANG3:     26,
  BACKLIGHT: 36,   // bool
  VIBRATION: 104,  // enum 0-3
  MOMENTARY: [105, 106, 107],  // value, seconds 0-3600, one per gang (setting momentary_1..3)
};

const DP_MAP = {
  main:       DP.GANG1,
  secondGang: DP.GANG2,
  thirdGang:  DP.GANG3,
};

const GANG_LABELS = {
  secondGang: 'Gang 2',
  thirdGang:  'Gang 3',
};

class NovaDigitalSwitch3GangTuya extends NovaDigitalTuyaDpSwitchBase {
  _getDpMap()        { return DP_MAP; }
  _getGangLabels()   { return GANG_LABELS; }
  _getMainDpExtras() { return [DP.BACKLIGHT, DP.VIBRATION, ...DP.MOMENTARY]; }

  async _handleDatapoint(dp, value) {
    if (dp === DP.BACKLIGHT) {
      this.log(`backlight reported: ${value}`);
      await this.setSettings({ backlight_enabled: Boolean(value) })
        .catch(err => this.error('setSettings backlight:', err));
      return;
    }
    if (dp === DP.VIBRATION) {
      this.log(`vibration reported: ${value}`);
      await this.setSettings({ vibration_gear: String(value) })
        .catch(err => this.error('setSettings vibration:', err));
      return;
    }
    const gang = DP.MOMENTARY.indexOf(dp) + 1;
    if (gang) {
      this.log(`inching ${gang} reported: ${value}`);
      await this.setSettings({ [`momentary_${gang}`]: Number(value) })
        .catch(err => this.error('setSettings inching:', err));
      return;
    }
    await this._handleOnOff(dp, value);
  }

  async onSettings({ newSettings, changedKeys }) {
    if (!this._isMain) return;
    for (const key of changedKeys) {
      if (key === 'backlight_enabled') {
        await this.writeBool(DP.BACKLIGHT, Boolean(newSettings[key]))
          .catch(err => { this.error('Write backlight:', err.message); throw err; });
      } else if (key === 'vibration_gear') {
        await this.writeEnum(DP.VIBRATION, Number(newSettings[key]))
          .catch(err => { this.error('Write vibration:', err.message); throw err; });
      } else if (/^momentary_[123]$/.test(key)) {
        const dp = DP.MOMENTARY[Number(key.slice(-1)) - 1];
        await this.writeData32(dp, Number(newSettings[key]))
          .catch(err => { this.error(`Write ${key}:`, err.message); throw err; });
      }
    }
  }
}

module.exports = NovaDigitalSwitch3GangTuya;
