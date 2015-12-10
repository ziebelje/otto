


/**
 * Generic thermostat card.
 *
 * @param {layer.dashboard} dashboard
 *
 * @constructor
 */
component.thermostat = function(dashboard) {
  component.apply(this, arguments);
  this.dashboard_ = dashboard;
};
$.inherits(component.thermostat, component);

component.thermostat.prototype.dashboard_;


/**
 * Decorate
 *
 * @param {rocket.Elements} parent
 */
component.thermostat.prototype.decorate = function(parent) {
  var card = $.createElement('div').addClass('card');
  parent.appendChild(card);

  // Main table
  var main_table = new jex.table({'rows': 1, 'columns': 3});
  card.appendChild(main_table.table());
  main_table.table().addClass('main_table');
  main_table.td(0, 0).addClass('setpoints');
  main_table.td(2, 0).addClass('right_spacer');

  // Setpoints
  var part_setpoint_heat_container = $.createElement('div').addClass('setpoint_container');
  main_table.td(0, 0).appendChild(part_setpoint_heat_container);
  var part_setpoint_heat = new component.thermostat.part.setpoint(this, 'heat');
  part_setpoint_heat.render(part_setpoint_heat_container);

  var part_setpoint_cool_container = $.createElement('div').addClass('setpoint_container');
  main_table.td(0, 0).appendChild(part_setpoint_cool_container);
  var part_setpoint_cool = new component.thermostat.part.setpoint(this, 'cool');
  part_setpoint_cool.render(part_setpoint_cool_container);

  // Temperature
  var part_temperature = new component.thermostat.part.temperature(this);
  part_temperature.render(main_table.td(1, 0));

  // Mode
  var part_mode_container = $.createElement('div').addClass('mode');
  card.appendChild(part_mode_container);
  var part_mode = new component.thermostat.part.mode(this);
  part_mode.render(part_mode_container);

  // Footer
  var footer = $.createElement('div').addClass('footer');
  card.appendChild(footer);

  var footer_table = new jex.table({'rows': 1, 'columns': 3});
  footer.appendChild(footer_table.table());

  footer_table.td(0, 0).addClass('weather');
  footer_table.td(1, 0).addClass('program');
  footer_table.td(2, 0).addClass('history');

  // Weather
  var part_weather = new component.thermostat.part.weather(this);
  part_weather.render(footer_table.td(0, 0));

  // Program
  var part_program = new component.thermostat.part.program(this);
  part_program.render(footer_table.td(1, 0));
};


component.thermostat.prototype.get_temperature = function() {};

component.thermostat.prototype.get_weather = function() {};

component.thermostat.prototype.get_program = function() {};
component.thermostat.prototype.resume_schedule = function() {};

component.thermostat.prototype.get_heat_cool_delta = function() {};

component.thermostat.prototype.get_max_heat = function() {};
component.thermostat.prototype.get_min_heat = function() {};

component.thermostat.prototype.get_max_cool = function() {};
component.thermostat.prototype.get_min_cool = function() {};

component.thermostat.prototype.get_mode = function() {};
component.thermostat.prototype.set_mode = function() {};

component.thermostat.prototype.get_heat_setpoint = function() {};
component.thermostat.prototype.set_heat_setpoint = function() {};

component.thermostat.prototype.get_cool_setpoint = function() {};
component.thermostat.prototype.set_cool_setpoint = function() {};

component.thermostat.prototype.dispatch = function() {};


/**
 * Get the effective thermostat mode. This basically just guesses what the
 * mode actually is when the thermostat is set to auto.
 *
 * @return {string} aux|cool|heat|off
 */
component.thermostat.prototype.get_effective_mode = function() {
  var mode = this.get_mode();

  if (mode === 'auto') {
    var heat_setpoint = this.get_heat_setpoint();
    var cool_setpoint = this.get_cool_setpoint();
    var temperature = this.get_temperature();
    if (temperature <= (heat_setpoint + 1)) {
      return 'heat';
    }
    else if (temperature >= (cool_setpoint - 1)) {
      return 'cool';
    }
    else {
      return 'off';
    }
  }
  else {
    return mode;
  }
};
