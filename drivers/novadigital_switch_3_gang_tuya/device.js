'use strict';

const NovaDigitalTuyaDpSwitchBase = require('../../lib/NovaDigitalTuyaDpSwitchBase');

// Nova Digital TPZ-3 / Moes SFL02-Z-3 (TS0601): the gangs are DP 24, 25 and 26 (Zigbee2MQTT
// definition). Not yet verified on hardware.
const DP_MAP = {
  main:       24,
  secondGang: 25,
  thirdGang:  26,
};

const GANG_LABELS = {
  secondGang: 'Gang 2',
  thirdGang:  'Gang 3',
};

class NovaDigitalSwitch3GangTuya extends NovaDigitalTuyaDpSwitchBase {
  _getDpMap()     { return DP_MAP; }
  _getGangLabels(){ return GANG_LABELS; }
}

module.exports = NovaDigitalSwitch3GangTuya;
