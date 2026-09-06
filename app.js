'use strict';

const Homey = require('homey');
const { Cluster } = require('zigbee-clusters');
const TuyaE000Cluster = require('./lib/TuyaE000Cluster');
const TuyaPowerOnStateCluster = require('./lib/TuyaPowerOnStateCluster');
const TuyaSpecificCluster = require('./lib/TuyaSpecificCluster');

module.exports = class NovaDigitalApp extends Homey.App {

  async onInit() {
    Cluster.addCluster(TuyaE000Cluster);
    Cluster.addCluster(TuyaPowerOnStateCluster);
    Cluster.addCluster(TuyaSpecificCluster);
    this.log('NovaDigital app initialized');
  }

};
