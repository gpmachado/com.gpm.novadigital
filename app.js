'use strict';

const Homey = require('homey');
const { Cluster, debug } = require('zigbee-clusters');
const { ZCL_DEBUG } = require('./lib/constants');
const TuyaE000Cluster = require('./lib/TuyaE000Cluster');
const TuyaPowerOnStateCluster = require('./lib/TuyaPowerOnStateCluster');
const TuyaSpecificCluster = require('./lib/TuyaSpecificCluster');
const ExtendedOnOffCluster = require('./lib/ExtendedOnOffCluster');

module.exports = class NovaDigitalApp extends Homey.App {

  async onInit() {
    // Flip ZCL_DEBUG in lib/constants.js for verbose ZCL frame logging.
    debug(ZCL_DEBUG);

    // Must run before any ZigBeeDevice initialises — ExtendedOnOffCluster overrides
    // the stock OnOff cluster (ID 6) so powerOnStateGlobal/indicatorMode/childLock
    // are recognised instead of throwing "not a valid attribute of onOff".
    Cluster.addCluster(ExtendedOnOffCluster);
    Cluster.addCluster(TuyaE000Cluster);
    Cluster.addCluster(TuyaPowerOnStateCluster);
    Cluster.addCluster(TuyaSpecificCluster);
    this.log('NovaDigital app initialized');
  }

};
