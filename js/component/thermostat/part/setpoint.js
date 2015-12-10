


/**
 * Heat or cool setpoint.
 *
 * @param {component.thermostat} thermostat
 * @param {String} type heat|cool
 *
 * @constructor
 */
component.thermostat.part.setpoint = function(thermostat, type) {
  component.thermostat.part.apply(this, arguments);
  this.thermostat_ = thermostat;
  this.type_ = type;
};
$.inherits(component.thermostat.part.setpoint, component.thermostat.part);


component.thermostat.part.setpoint.prototype.thermostat_;
component.thermostat.part.setpoint.prototype.type_;
component.thermostat.part.setpoint.prototype.setpoint_container_;


/**
 * Decorate
 *
 * @param {rocket.Elements} parent
 */
component.thermostat.part.setpoint.prototype.decorate = function(parent) {
  var self = this;

  var container = $.createElement('div').addClass(this.type_);
  parent.appendChild(container);

  // Up
  var arrow_up = $.createElement('div').innerHTML('▲').addClass(['arrow', this.type_]);
  container.appendChild(arrow_up);

  arrow_up.addEventListener('mousedown', function() {
    self.thermostat_['set_' + self.type_ + '_setpoint'](self.thermostat_['get_' + self.type_ + '_setpoint']() + 1);
  });

  // Value
  this.setpoint_container_ = $.createElement('div').addClass('setpoint');
  container.appendChild(this.setpoint_container_);

  // Down
  var arrow_down = $.createElement('div').innerHTML('▼').addClass(['arrow', this.type_]);
  container.appendChild(arrow_down);
  arrow_down.addEventListener('mousedown', function() {
    self.thermostat_['set_' + self.type_ + '_setpoint'](self.thermostat_['get_' + self.type_ + '_setpoint']() - 1);
  });

  // this.current_setpoint_ = this.thermostat_['get_' + this.type_ + '_setpoint']();
  this.envoy.addEventListener('thermostat_heat_setpoint_change', this.thermostat_setpoint_change_.bind(this));
  this.envoy.addEventListener('thermostat_cool_setpoint_change', this.thermostat_setpoint_change_.bind(this));
};


/**
 * Change the currently displayed heat setpoint to the new one.
 *
 * @param {Event} e
 *
 * @private
 */
component.thermostat.part.setpoint.prototype.thermostat_setpoint_change_ = function(e) {
  if (e.detail.component === this.thermostat_ && e.type.indexOf(this.type_) !== -1) {
    this.setpoint_container_.innerHTML(this.thermostat_['get_' + this.type_ + '_setpoint']());
  }
};
