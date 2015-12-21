


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
component.thermostat.prototype.current_mode_;
component.thermostat.prototype.part_setpoint_heat_container_;
component.thermostat.prototype.part_setpoint_cool_container_;


/**
 * Decorate
 *
 * @param {rocket.Elements} parent
 */
component.thermostat.prototype.decorate = function(parent) {
  var card = $.createElement('div').addClass('card');
  parent.appendChild(card);

  // Main table
  var setpoint_temperature_table = new jex.table({'rows': 1, 'columns': 3});
  card.appendChild(setpoint_temperature_table.table());
  setpoint_temperature_table.table().addClass('setpoint_temperature_table');
  // setpoint_temperature_table.td(1, 0).addClass('temperature_td');

  // Setpoints
  var setpoint_outer_container = $.createElement('div').addClass('setpoint_outer_container');
  setpoint_temperature_table.td(0, 0).appendChild(setpoint_outer_container);

  this.part_setpoint_heat_container_ = $.createElement('div').addClass('setpoint_inner_container');
  setpoint_outer_container.appendChild(this.part_setpoint_heat_container_);
  var part_setpoint_heat = new component.thermostat.part.setpoint(this, 'heat');
  part_setpoint_heat.render(this.part_setpoint_heat_container_);

  this.part_setpoint_cool_container_ = $.createElement('div').addClass('setpoint_inner_container');
  setpoint_outer_container.appendChild(this.part_setpoint_cool_container_);
  var part_setpoint_cool = new component.thermostat.part.setpoint(this, 'cool');
  part_setpoint_cool.render(this.part_setpoint_cool_container_);

  this.current_mode_ = this.get_mode();

  this.envoy.addEventListener('thermostat_mode_change', this.thermostat_mode_change_.bind(this));

  // Temperature
  var part_temperature_container = $.createElement('div').addClass('temperature');
  setpoint_temperature_table.td(1, 0).appendChild(part_temperature_container);
  var part_temperature = new component.thermostat.part.temperature(this);
  part_temperature.render(part_temperature_container);

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

  // Alerts
  var part_alerts_container = $.createElement('div').addClass('alerts');
  card.appendChild(part_alerts_container);
  var part_alerts = new component.thermostat.part.alerts(this);
  part_alerts.render(part_alerts_container);

  // Equipment
  var part_equipment_container = $.createElement('div').addClass('equipment');
  part_temperature_container.appendChild(part_equipment_container);
  var part_equipment = new component.thermostat.part.equipment(this);
  part_equipment.render(part_equipment_container);
};


component.thermostat.prototype.get_temperature = function() {};

component.thermostat.prototype.get_weather = function() {};

component.thermostat.prototype.get_alerts = function() {};

component.thermostat.prototype.get_equipment = function() {};

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


/**
 * Switch which setpoint components are displayed.
 *
 * @param {Event} e
 *
 * @private
 */
component.thermostat.prototype.thermostat_mode_change_ = function(e) {
  if (e.detail.component === this) {
    var current_mode = this.current_mode_;
    var new_mode = this.get_mode();

    // Whether or not the heat/cool setpoint is currently visible
    var heat_visible = ['heat', 'auto', 'aux'].indexOf(current_mode) !== -1;
    var cool_visible = ['cool', 'auto'].indexOf(current_mode) !== -1;

    var show_heat = ['heat', 'auto', 'aux'].indexOf(new_mode) !== -1;
    var show_cool = ['cool', 'auto'].indexOf(new_mode) !== -1;

    // This is a bit verbose but it's easier than trying to figure out and
    // debug a bunch of dynamic logic which ends up being about the same
    // amount of code, just harder to read.
    if (heat_visible === false && cool_visible === false) {
      if (show_heat === true && show_cool === true) { // off => h,c
        this.part_setpoint_heat_container_[0].className = 'instant_width_transition_opacity setpoint_inner_container';
        this.part_setpoint_cool_container_[0].className = 'instant_width_transition_opacity setpoint_inner_container';
      }
      else if (show_heat === true) { // off => h
        this.part_setpoint_heat_container_[0].className = 'double_width instant_width_transition_opacity setpoint_inner_container';
        this.part_setpoint_cool_container_[0].className = 'transparent no_width instant_width_transition_opacity setpoint_inner_container';
      }
      else if (show_cool === true) { // off => c
        this.part_setpoint_heat_container_[0].className = 'transparent no_width instant_width_transition_opacity setpoint_inner_container';
        this.part_setpoint_cool_container_[0].className = 'double_width instant_width_transition_opacity setpoint_inner_container';
      }
    }
    else if (heat_visible === true && cool_visible === true) {
      if (show_heat === false && show_cool === false) { // h,c => off
        this.part_setpoint_heat_container_[0].className = 'transparent transition_width_transition_opacity setpoint_inner_container';
        this.part_setpoint_cool_container_[0].className = 'transparent transition_width_transition_opacity setpoint_inner_container';
      }
      else if (show_heat === true && show_cool === false) { // h,c => h
        this.part_setpoint_heat_container_[0].className = 'double_width transition_width_transition_opacity setpoint_inner_container';
        this.part_setpoint_cool_container_[0].className = 'transparent no_width transition_width_transition_opacity setpoint_inner_container';
      }
      else if (show_heat === false && show_cool === true) { // h,c => c
        this.part_setpoint_heat_container_[0].className = 'transparent no_width transition_width_transition_opacity setpoint_inner_container';
        this.part_setpoint_cool_container_[0].className = 'double_width transition_width_transition_opacity setpoint_inner_container';
      }
    }
    else if (heat_visible === true && cool_visible === false) {
      if (show_heat === true && show_cool === true) { // h => h,c
        this.part_setpoint_heat_container_[0].className = 'transition_width_transition_opacity setpoint_inner_container';
        this.part_setpoint_cool_container_[0].className = 'transition_width_transition_opacity setpoint_inner_container';
      }
      else if (show_heat === false && show_cool === true) { // h => c
        this.part_setpoint_heat_container_[0].className = 'transparent no_width transition_width_transition_opacity setpoint_inner_container';
        this.part_setpoint_cool_container_[0].className = 'double_width transition_width_transition_opacity setpoint_inner_container';
      }
      else if (show_heat === false && show_cool === false) { // h => off
        this.part_setpoint_heat_container_[0].className = 'transparent setpoint_inner_container';
      }
    }
    else if (heat_visible === false && cool_visible === true) {
      if (show_heat === true && show_cool === true) { // c => h,c
        this.part_setpoint_heat_container_[0].className = 'transition_width_transition_opacity setpoint_inner_container';
        this.part_setpoint_cool_container_[0].className = 'transition_width_transition_opacity setpoint_inner_container';
      }
      else if (show_heat === true && show_cool === false) { // c => h
        this.part_setpoint_heat_container_[0].className = 'double_width transition_width_transition_opacity setpoint_inner_container';
        this.part_setpoint_cool_container_[0].className = 'transparent no_width transition_width_transition_opacity setpoint_inner_container';
      }
      else if (show_heat === false && show_cool === false) { // c => off
        this.part_setpoint_cool_container_[0].className = 'transparent setpoint_inner_container';
      }
    }

    this.current_mode_ = new_mode;
  }
};
