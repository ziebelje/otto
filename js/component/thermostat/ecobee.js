


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

  return events;
};
