


/**
 * Large circle in the center of the thermostat card with the current
 * temperature.
 *
 * @param {component.thermostat} thermostat
 *
 * @constructor
 */
component.thermostat.part.temperature = function(thermostat) {
  component.thermostat.part.apply(this, arguments);
  this.thermostat_ = thermostat;
};
$.inherits(component.thermostat.part.temperature, component.thermostat.part);

component.thermostat.part.temperature.prototype.thermostat_;
component.thermostat.part.temperature.prototype.circle_;
component.thermostat.part.temperature.prototype.current_temperature_;
component.thermostat.part.temperature.prototype.current_effective_mode_;
component.thermostat.part.temperature.prototype.thermostat_temperature_change_interval_;


/**
 * Decorate
 *
 * @param {rocket.Elements} parent
 */
component.thermostat.part.temperature.prototype.decorate = function(parent) {
  var self = this;

  this.circle_ = $.createElement('div').addClass('circle');
  parent.appendChild(this.circle_);

  this.current_effective_mode_ = this.thermostat_.get_effective_mode();
  this.envoy.addEventListener('thermostat_mode_change', this.thermostat_mode_change_.bind(this));

  this.current_temperature_ = this.thermostat_.get_temperature();
  this.envoy.addEventListener('thermostat_temperature_change', this.thermostat_temperature_change_.bind(this));
};


/**
 * Change the currently displayed temperature to the new one. This changes the
 * display degree by degree over a short interval and then does a quick "push"
 * or "pull" at the end of the effect to draw focus.
 *
 * @param {Event} e
 *
 * @private
 */
component.thermostat.part.temperature.prototype.thermostat_temperature_change_ = function(e) {
  if (e.detail.component === this.thermostat_) {
    var self = this;

    var current_temperature = this.current_temperature_ !== undefined ? this.current_temperature_ : 0;
    var new_temperature = this.thermostat_.get_temperature();

    var effect_class = new_temperature > current_temperature ? 'push' : 'pull';
    var math_function = new_temperature > current_temperature ? 'floor' : 'ceil';

    clearInterval(this.thermostat_temperature_change_interval_);
    this.thermostat_temperature_change_interval_ = $.step(function(percentage, sine) {
      var temperature = Math[math_function](current_temperature + ((new_temperature - current_temperature) * percentage));
      if (temperature === new_temperature) {
        self.circle_.addClass(effect_class);
        setTimeout(function() { self.circle_.removeClass(effect_class); }, 200); // 200 ms to match the length of the css transition
      }
      self.current_temperature_ = temperature;
      self.circle_.innerHTML(temperature);
    }, 500, null, 60);
  }
};


/**
 * Change the background color of the circle to reflect the new mode. The
 * circle is always showing the effective mode, so when in auto it better
 * shows heat or cool.
 *
 * @param {Event} e
 *
 * @private
 */
component.thermostat.part.temperature.prototype.thermostat_mode_change_ = function(e) {
  if (e.detail.component === this.thermostat_) {
    var current_effective_mode = this.current_effective_mode_;
    var new_effective_mode = this.thermostat_.get_effective_mode();

    this.circle_.removeClass(current_effective_mode);
    this.circle_.addClass(new_effective_mode);

    this.current_effective_mode_ = new_effective_mode;
  }
};
