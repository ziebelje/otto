


/**
 * Ecobee.
 *
 * @param {layer.dashboard} dashboard
 * @param {Number} ecobee_thermostat_id
 *
 * @constructor
 */
component.thermostat.ecobee = function(dashboard, ecobee_thermostat_id) {
  component.thermostat.apply(this, arguments);
  this.ecobee_thermostat_id_ = ecobee_thermostat_id;
};
$.inherits(component.thermostat.ecobee, component.thermostat);


/**
 * The ecobee_thermostat_id
 *
 * @type {Number}
 *
 * @private
 */
component.thermostat.ecobee.prototype.ecobee_thermostat_id_;


/**
 * Normalized thermostat modes and what they map to on the ecobee.
 *
 * @type {Object}
 */
component.thermostat.ecobee.modes = {
  'auto': 'auto',
  'aux': 'auxHeatOnly',
  'cool': 'cool',
  'heat': 'heat',
  'off': 'off'
};


/**
 * Alert map. The default ecobee alert text is a bit too verbose so I'm using
 * the codes to display shorter alerts.
 *
 * Leaving these code ranges out because I don't happen to need them and I don't
 * want to bother implementing code range support. Any code that is not listed
 * here will still show up - it will just say see ecobee for message.
 *
 * 4100 - 4199 ClimateTalk device alert major/minor fault codes
 * 4200 - 4299 ClimateTalk device lost communications
 * 4300 - 4399 ClimateTalk system message from device
 * 6002 - 6005 DR voluntary alerts
 * 8300 - 8599 ClimateMaster Heatpump/hardware Unit Alerts
 * 8000 - 8299 Daikin Indoor/Outdoor Unit Alerts
 *
 * @see https://www.ecobee.com/home/developer/api/documentation/v1/objects/Alert.shtml
 *
 * @type {Object}
 */
component.thermostat.ecobee.alerts = {
  '611': 'Invalid registration password',
  '1000': 'Indoor temperature low',
  '1001': 'Indoor temperature high',
  '1002': 'Sensor activated shutting down compressor',
  '1003': 'Problem with furnace/boiler heating',
  '1004': 'Problem with heatpump heating',
  '1005': 'Problem with heatpump heating',
  '1006': 'Problem with cooling',
  '1007': 'Communication to EI failed',
  '1009': 'Problem with aux heat, running too much',
  '1010': 'Aux heat used with high outdoor temp',
  '1011': 'Sensor activated switching to occupied',
  '1012': 'Sensor activated switching to unoccupied',
  '1013': 'Sensor activated disabling AC',
  '1014': 'Sensor activated setting temp up/down',
  '1015': 'Sensor activated',
  '1016': 'Sensor activated opening/closing relay',
  '1017': 'Sensor activated turning on fan',
  '1018': 'Sensor activated shutting down aux heat',
  '1019': 'Sensor activated shutting down heating/cooling',
  '1020': 'Low humidity alert',
  '1021': 'High humidity alert',
  '1022': 'Sensor activated shutting down heat',
  '1024': 'Sensor activated humidifier',
  '1025': 'Sensor activated dehumidifier',
  '1026': 'Low battery',
  '1027': 'Sensor detected',
  '1028': 'Sensor not communicating',
  '1029': 'Sensor re-established',
  '1030': 'Invalid current temp reading',
  '1031': 'Current temp reading restored',
  '1032': 'Faulty humidity sensor',
  '1033': 'Faulty humidity sensor',
  '1034': 'Incorrect Zigbee module installed',
  '3130': 'Need furnace maintenance',
  '3131': 'Need humidifier maintenance',
  '3132': 'Need ventilator maintenance',
  '3133': 'Need dehumidifier maintenance',
  '3134': 'Need economizer maintenance',
  '3135': 'Need UV maintenance',
  '3136': 'Need AC maintenance',
  '3137': 'Air filter reminder (ClimateMaster only)',
  '3138': 'Air cleaner reminder (ClimateMaster only)',
  '3140': 'Need HVAC maintenance',
  '4000': 'ClimateTalk',
  '6000': 'DR voluntary alert',
  '6001': 'DR voluntary utility message',
  '6100': 'DR mandatory alert',
  '6101': 'DR mandatory message',
  '6102': 'DR mandatory alert',
  '6200': 'Monthly cost exceeded',
  '6201': 'Monthly projected cost exceeded',
  '6300': 'Network join successful',
  '6301': 'Network join failed',
  '7000': 'Registration confirmation',
  '7001': 'Registration Remind me alert',
  '7002': 'Web initiated messages - such as Utility welcome message or similar',
  '9000': 'ClimateMaster fault',
  '9255': 'ClimateMaster fault max',
  '9500': 'ClimateMaster disconnected',
  '9755': 'ClimateMaster disconnected max'
};


/**
 * Get the current indoor temperature seen by the ecobee.
 *
 * @param {Object=} opt_data Data to read from. If not provided, will use the
 * cache.
 *
 * @return {Number}
 */
component.thermostat.ecobee.prototype.get_temperature = function(opt_data) {
  var data = opt_data !== undefined ? opt_data : cache.cache;
  var temperature;

  if (
    data.ecobee_thermostat &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_] &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_].runtime &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_].runtime.actualTemperature
  ) {
    temperature = data.ecobee_thermostat[this.ecobee_thermostat_id_].runtime.actualTemperature;
    temperature = Math.round(temperature / 10);
  }

  return temperature;
};


/**
 * Get the current heat setpoint.
 *
 * @param {Object=} opt_data Data to read from. If not provided, will use the
 * cache.
 *
 * @return {Number}
 */
component.thermostat.ecobee.prototype.get_heat_setpoint = function(opt_data) {
  var data = opt_data !== undefined ? opt_data : cache.cache;
  var heat_setpoint;

  if (
    data.ecobee_thermostat &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_] &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_].runtime &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_].runtime.desiredHeat
  ) {
    heat_setpoint = data.ecobee_thermostat[this.ecobee_thermostat_id_].runtime.desiredHeat;
    heat_setpoint = Math.round(heat_setpoint / 10);
  }

  return heat_setpoint;
};


/**
 * Get the current cool setpoint.
 *
 * @param {Object=} opt_data Data to read from. If not provided, will use the
 * cache.
 *
 * @return {Number}
 */
component.thermostat.ecobee.prototype.get_cool_setpoint = function(opt_data) {
  var data = opt_data !== undefined ? opt_data : cache.cache;
  var cool_setpoint;

  if (
    data.ecobee_thermostat &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_] &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_].runtime &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_].runtime.desiredCool
  ) {
    cool_setpoint = data.ecobee_thermostat[this.ecobee_thermostat_id_].runtime.desiredCool;
    cool_setpoint = Math.round(cool_setpoint / 10);
  }

  return cool_setpoint;
};


/**
 * Get the current thermostat mode.
 *
 * @param {Object=} opt_data Data to read from. If not provided, will use the
 * cache.
 *
 * @return {String} auto|aux|cool|heat|off
 */
component.thermostat.ecobee.prototype.get_mode = function(opt_data) {
  var self = this;

  var data = opt_data !== undefined ? opt_data : cache.cache;
  var mode;

  if (
    data.ecobee_thermostat &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_] &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_].settings &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_].settings.hvacMode
  ) {
    // Look up normalized mode from ecobee.mode
    mode = Object.keys(component.thermostat.ecobee.modes)
      .filter(function(key) {
        return component.thermostat.ecobee.modes[key] === data.ecobee_thermostat[self.ecobee_thermostat_id_].settings.hvacMode;
      })[0];
  }

  return mode;
};


/**
 * Get the current thermostat weather.
 *
 * @param {Object=} opt_data Data to read from. If not provided, will use the
 * cache.
 *
 * @return {Object}
 */
component.thermostat.ecobee.prototype.get_weather = function(opt_data) {
  var self = this;

  var data = opt_data !== undefined ? opt_data : cache.cache;
  var weather = {};

  if (
    data.ecobee_thermostat &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_] &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_].weather &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_].weather.forecasts &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_].weather.forecasts[0] &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_].weather.forecasts[0].temperature
  ) {
    weather.temperature = Math.round(data.ecobee_thermostat[this.ecobee_thermostat_id_].weather.forecasts[0].temperature / 10);
  }

  return weather;
};


/**
 * Get the current thermostat alerts.
 *
 * @param {Object=} opt_data Data to read from. If not provided, will use the
 * cache.
 *
 * @return {Array.<Object>}
 */
component.thermostat.ecobee.prototype.get_alerts = function(opt_data) {
  var self = this;

  var data = opt_data !== undefined ? opt_data : cache.cache;
  var alerts = [];

  if (
    data.ecobee_thermostat &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_] &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_].alerts
  ) {
    data.ecobee_thermostat[this.ecobee_thermostat_id_].alerts.forEach(function(alert) {
      alerts.push({
        'alert_id': alert.acknowledgeRef,
        'code': alert.alertNumber,
        'text': (component.thermostat.ecobee.alerts[alert.alertNumber] !== undefined) ?
          component.thermostat.ecobee.alerts[alert.alertNumber] :
          'See ecobee for alert'
      });
    });
  }

  return alerts;
};


/**
 * The minimum temperature difference between the heat and cool values. Used
 * to ensure that when thermostat is in auto mode, the heat and cool values
 * are separated by at least this value.
 *
 * @param {Object=} opt_data Data to read from. If not provided, will use the
 * cache.
 *
 * @return {Number}
 */
component.thermostat.ecobee.prototype.get_heat_cool_delta = function(opt_data) {
  var data = opt_data !== undefined ? opt_data : cache.cache;
  var heat_cool_delta;

  if (
    data.ecobee_thermostat &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_] &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_].settings &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_].settings.heatCoolMinDelta
  ) {
    heat_cool_delta = data.ecobee_thermostat[this.ecobee_thermostat_id_].settings.heatCoolMinDelta / 10;
  }

  return heat_cool_delta;
};


/**
 * Get the maximum heat temperature.
 *
 * @param {Object=} opt_data Data to read from. If not provided, will use the
 * cache.
 *
 * @return {Number}
 */
component.thermostat.ecobee.prototype.get_max_heat = function(opt_data) {
  var data = opt_data !== undefined ? opt_data : cache.cache;
  var max_heat;

  if (
    data.ecobee_thermostat &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_] &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_].settings &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_].settings.heatMaxTemp
  ) {
    max_heat = data.ecobee_thermostat[this.ecobee_thermostat_id_].settings.heatMaxTemp / 10;
  }

  return max_heat;
};


/**
 * Get the minimum heat temperature.
 *
 * @param {Object=} opt_data Data to read from. If not provided, will use the
 * cache.
 *
 * @return {Number}
 */
component.thermostat.ecobee.prototype.get_min_heat = function(opt_data) {
  var data = opt_data !== undefined ? opt_data : cache.cache;
  var min_heat;

  if (
    data.ecobee_thermostat &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_] &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_].settings &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_].settings.heatMinTemp
  ) {
    min_heat = data.ecobee_thermostat[this.ecobee_thermostat_id_].settings.heatMinTemp / 10;
  }

  return min_heat;
};


/**
 * Get the maximum cool temperature.
 *
 * @param {Object=} opt_data Data to read from. If not provided, will use the
 * cache.
 *
 * @return {Number}
 */
component.thermostat.ecobee.prototype.get_max_cool = function(opt_data) {
  var data = opt_data !== undefined ? opt_data : cache.cache;
  var max_cool;

  if (
    data.ecobee_thermostat &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_] &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_].settings &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_].settings.coolMaxTemp
  ) {
    max_cool = data.ecobee_thermostat[this.ecobee_thermostat_id_].settings.coolMaxTemp / 10;
  }

  return max_cool;
};


/**
 * Get the minimum cool temperature.
 *
 * @param {Object=} opt_data Data to read from. If not provided, will use the
 * cache.
 *
 * @return {Number}
 */
component.thermostat.ecobee.prototype.get_min_cool = function(opt_data) {
  var data = opt_data !== undefined ? opt_data : cache.cache;
  var min_cool;

  if (
    data.ecobee_thermostat &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_] &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_].settings &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_].settings.coolMinTemp
  ) {
    min_cool = data.ecobee_thermostat[this.ecobee_thermostat_id_].settings.coolMinTemp / 10;
  }

  return min_cool;
};


/**
 * Get the currently running program. If there is an event running, use those
 * event details to determine the program. Otherwise use whatever the program
 * currently says.
 *
 * @param {Object=} opt_data Data to read from. If not provided, will use the
 * cache.
 *
 * @return {String} home|away|sleep|vacation|manual
 */
component.thermostat.ecobee.prototype.get_program = function(opt_data) {
  var self = this;

  var data = opt_data !== undefined ? opt_data : cache.cache;
  var program;

  var current_event;
  if (
    data.ecobee_thermostat &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_] &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_].events &&
    data.ecobee_thermostat[this.ecobee_thermostat_id_].events.length > 0
  ) {
    for (var i = 0; i < data.ecobee_thermostat[this.ecobee_thermostat_id_].events.length; i++) {
      if (data.ecobee_thermostat[this.ecobee_thermostat_id_].events[i].running === true) {
        current_event = data.ecobee_thermostat[this.ecobee_thermostat_id_].events[i];
      }
    }
  }

  if (current_event !== undefined) {
    if (current_event.holdClimateRef !== '') {
      program = current_event.holdClimateRef;
    }
    else if (current_event.type === 'vacation') {
      program = 'vacation';
    }
    else {
      program = 'manual';
    }
  }
  else {
    if (
      data.ecobee_thermostat &&
      data.ecobee_thermostat[this.ecobee_thermostat_id_] &&
      data.ecobee_thermostat[this.ecobee_thermostat_id_].program &&
      data.ecobee_thermostat[this.ecobee_thermostat_id_].program.currentClimateRef
    ) {
      program = data.ecobee_thermostat[this.ecobee_thermostat_id_].program.currentClimateRef;
    }
  }

  return program;
};


/**
 * Set the current thermostat mode.
 *
 * @param {string} mode auto|aux|cool|heat|off
 */
component.thermostat.ecobee.prototype.set_mode = function(mode) {
  var data = {'ecobee_thermostat': {}};
  data.ecobee_thermostat[this.ecobee_thermostat_id_] = {
    'settings': {
      'hvacMode': component.thermostat.ecobee.modes[mode]
    }
  };
  this.dashboard_.dispatch(data);

  // TODO: API CALL
/*  api(
    'api\\lib\\ecobee\\ecobee',
    'set_hvac_mode',
    {
      'ecobee_thermostat_id': this.ecobee_thermostat_id_,
      'hvac_mode': mode
    },
    function() {
      if (callback !== undefined) {
        callback();
      }
    }
  );*/
};


/**
 * Resume the default schedule. This will effectively delete any active
 * events. Vacations and manual holds are both included. Also puts the
 * setpoints back at where they belong for the resumed schedule.
 */
component.thermostat.ecobee.prototype.resume_schedule = function() {
  var self = this;

  var data = {'ecobee_thermostat': {}};
  data.ecobee_thermostat[this.ecobee_thermostat_id_] = {
    'events': JSON.parse(JSON.stringify(cache.cache.ecobee_thermostat[this.ecobee_thermostat_id_].events)),
    'program': { // Not changing this, just including it for the get_program() function call
      'currentClimateRef': cache.cache.ecobee_thermostat[this.ecobee_thermostat_id_].program.currentClimateRef
    }
  };

  // Disable all of the events.
  data.ecobee_thermostat[this.ecobee_thermostat_id_].events.forEach(function(event) {
    event.running = false;
  });

  // Grab the current climate heat and cool setpoints and update those.
  cache.cache.ecobee_thermostat[this.ecobee_thermostat_id_].program.climates.forEach(function(climate) {
    if (climate.climateRef === cache.cache.ecobee_thermostat[self.ecobee_thermostat_id_].program.currentClimateRef) {
      data.ecobee_thermostat[self.ecobee_thermostat_id_].runtime = {
        'desiredHeat': climate.heatTemp,
        'desiredCool': climate.coolTemp
      };
    }
  });

  this.dashboard_.dispatch(data);

  // TODO: API CALL
};


/**
 * Set the current heat setpoint.
 *
 * @param {Number} setpoint
 */
component.thermostat.ecobee.prototype.set_heat_setpoint = function(setpoint) {
  setpoint = Math.min(setpoint, this.get_max_heat()); // TODO: These values don't seem quite right. The thresholds should be a lot less big.
  setpoint = Math.max(setpoint, this.get_min_heat());

  var data = {'ecobee_thermostat': {}};
  data.ecobee_thermostat[this.ecobee_thermostat_id_] = {
    'runtime': {
      'desiredHeat': setpoint * 10,
      'desiredCool': Math.max(this.get_cool_setpoint() * 10, (setpoint + this.get_heat_cool_delta()) * 10)
    }
  };

  // Clone the current events array
  data.ecobee_thermostat[this.ecobee_thermostat_id_].events =
    JSON.parse(JSON.stringify(cache.cache.ecobee_thermostat[this.ecobee_thermostat_id_].events));

  // And then add a new one onto the front of it.
  data.ecobee_thermostat[this.ecobee_thermostat_id_].events.unshift({
    'type': 'hold',
    'running': true,
    'holdClimateRef': ''
  });

  this.dashboard_.dispatch(data);

  // TODO: API CALL
};


/**
 * Set the current cool setpoint.
 *
 * @param {Number} setpoint
 */
component.thermostat.ecobee.prototype.set_cool_setpoint = function(setpoint) {
  setpoint = Math.min(setpoint, this.get_max_cool()); // TODO: These values don't seem quite right. The thresholds should be a lot less big.
  setpoint = Math.max(setpoint, this.get_min_cool());

  var data = {'ecobee_thermostat': {}};
  data.ecobee_thermostat[this.ecobee_thermostat_id_] = {
    'runtime': {
      'desiredHeat': Math.min(this.get_heat_setpoint() * 10, (setpoint - this.get_heat_cool_delta()) * 10),
      'desiredCool': setpoint * 10
    }
  };

  // Clone the current events array
  data.ecobee_thermostat[this.ecobee_thermostat_id_].events =
    cache.cache.ecobee_thermostat[this.ecobee_thermostat_id_].events.slice(0);

  // And then add a new one onto the front of it.
  data.ecobee_thermostat[this.ecobee_thermostat_id_].events.unshift({
    'type': 'hold',
    'running': true,
    'holdClimateRef': ''
  });

  this.dashboard_.dispatch(data);

  // TODO: API CALL
};


/**
 * Look at a set of new data, compare it to the cache, then dispatch
 * appropriate events for any values that have changed.
 *
 * @param {Object} data
 *
 * @return {Array.<Object>} Events that need to be dispatched.
 */
component.thermostat.ecobee.prototype.dispatch = function(data) {
  var events = [];

  // Mode change
  var current_mode = this.get_mode();
  var new_mode = this.get_mode(data);

  if (new_mode !== undefined && new_mode !== current_mode) {
    events.push({
      'type': 'thermostat_mode_change',
      'detail': {'ecobee_thermostat_id': this.ecobee_thermostat_id_, 'component': this}}
    );
  }

  // Temperature change
  var current_temperature = this.get_temperature();
  var new_temperature = this.get_temperature(data);

  if (new_temperature !== undefined && new_temperature !== current_temperature) {
    events.push({
      'type': 'thermostat_temperature_change',
      'detail': {'ecobee_thermostat_id': this.ecobee_thermostat_id_, 'component': this}}
    );

    // Since the effective mode is basically just a guess when in auto, it's
    // possible the effective mode could change with a temperature change.
    events.push({
      'type': 'thermostat_mode_change',
      'detail': {'ecobee_thermostat_id': this.ecobee_thermostat_id_, 'component': this}}
    );
  }

  // Weather change
  var current_weather = this.get_weather();
  var new_weather = this.get_weather(data);

  if ($.isEmpty(new_weather) === false && new_weather.temperature !== current_weather.temperature) {
    events.push({
      'type': 'thermostat_weather_change',
      'detail': {'ecobee_thermostat_id': this.ecobee_thermostat_id_, 'component': this}}
    );

    // Since the effective mode is basically just a guess when in auto, it's
    // possible the effective mode could change with a temperature change.
    events.push({
      'type': 'thermostat_mode_change',
      'detail': {'ecobee_thermostat_id': this.ecobee_thermostat_id_, 'component': this}}
    );
  }

  // Heat setpoint change
  var current_heat_setpoint = this.get_heat_setpoint();
  var new_heat_setpoint = this.get_heat_setpoint(data);

  if (new_heat_setpoint !== undefined && new_heat_setpoint !== current_heat_setpoint) {
    events.push({
      'type': 'thermostat_heat_setpoint_change',
      'detail': {'ecobee_thermostat_id': this.ecobee_thermostat_id_, 'component': this}}
    );

    // Since the effective mode is basically just a guess when in auto, it's
    // possible the effective mode could change with a setpoint change.
    events.push({
      'type': 'thermostat_mode_change',
      'detail': {'ecobee_thermostat_id': this.ecobee_thermostat_id_, 'component': this}}
    );
  }

  // Cool setpoint change
  var current_cool_setpoint = this.get_cool_setpoint();
  var new_cool_setpoint = this.get_cool_setpoint(data);

  if (new_cool_setpoint !== undefined && new_cool_setpoint !== current_cool_setpoint) {
    events.push({
      'type': 'thermostat_cool_setpoint_change',
      'detail': {'ecobee_thermostat_id': this.ecobee_thermostat_id_, 'component': this}}
    );

    // Since the effective mode is basically just a guess when in auto, it's
    // possible the effective mode could change with a setpoint change.
    events.push({
      'type': 'thermostat_mode_change',
      'detail': {'ecobee_thermostat_id': this.ecobee_thermostat_id_, 'component': this}}
    );
  }

  // Program change
  var current_program = this.get_program();
  var new_program = this.get_program(data);

  if (new_program !== undefined && new_program !== current_program) {
    events.push({
      'type': 'thermostat_program_change',
      'detail': {'ecobee_thermostat_id': this.ecobee_thermostat_id_, 'component': this}}
    );
  }

  // Alerts change
  var current_alerts = this.get_alerts();
  var new_alerts = this.get_alerts(data);

  if (new_alerts !== undefined && $.equal(new_alerts, current_alerts) === false) {
    events.push({
      'type': 'thermostat_alerts_change',
      'detail': {'ecobee_thermostat_id': this.ecobee_thermostat_id_, 'component': this}}
    );
  }

  return events;
};
