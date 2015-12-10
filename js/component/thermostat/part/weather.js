


/**
 * Current weather according to the thermostat.
 *
 * @param {component.thermostat} thermostat
 *
 * @constructor
 */
component.thermostat.part.weather = function(thermostat) {
  component.thermostat.part.apply(this, arguments);
  this.thermostat_ = thermostat;
};
$.inherits(component.thermostat.part.weather, component.thermostat.part);

component.thermostat.part.weather.temperature_container_;


/**
 * Decorate
 *
 * @param {rocket.Elements} parent
 */
component.thermostat.part.weather.prototype.decorate = function(parent) {
  var icon_container = $.createElement('div').addClass('icon_container');
  icon_container.appendChild($.createElement('img').setAttribute('src', 'img/component/thermostat/thermometer.png'));
  parent.appendChild(icon_container);

  this.temperature_container_ = $.createElement('div').addClass('temperature_container');
  parent.appendChild(this.temperature_container_);

  this.envoy.addEventListener('thermostat_weather_change', this.thermostat_weather_change_.bind(this));
};


/**
 * Weather change.
 *
 * @param {Event} e
 *
 * @private
 */
component.thermostat.part.weather.prototype.thermostat_weather_change_ = function(e) {
  if (e.detail.component === this.thermostat_) {
    this.temperature_container_.innerHTML(this.thermostat_.get_weather().temperature + '° outside');
  }
};
