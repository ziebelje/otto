


/**
 * Large circle in the center of the thermostat card with the current
 * temperature.
 *
 * @param {component.thermostat} thermostat
 *
 * @constructor
 */
component.thermostat.part.mode = function(thermostat) {
  component.thermostat.part.apply(this, arguments);
  this.thermostat_ = thermostat;
};
$.inherits(component.thermostat.part.mode, component.thermostat.part);

component.thermostat.part.mode.prototype.parent_;
component.thermostat.part.mode.prototype.thermostat_;
component.thermostat.part.mode.prototype.current_mode_;
component.thermostat.part.mode.prototype.options_;
component.thermostat.part.mode.prototype.slider_;


/**
 * Decorate
 *
 * @param {rocket.Elements} parent
 */
component.thermostat.part.mode.prototype.decorate = function(parent) {
  var self = this;

  this.parent_ = parent;
  this.current_mode_ = this.thermostat_.get_mode(); // TODO: Why am I setting this twice?

  var modes = ['off', 'auto', 'heat', 'cool', 'aux'];
  // TODO: component.thermostat.ecobee.modes (this.thermostat_.modes?) would
  // need to make modes a prototype
  // Actually needs to be this.thermostat_.modes to avoid referencing vendor-specific thermostat

  var foo = $.createElement('div').style('position', 'relative');
  parent.appendChild(foo);

  this.slider_ = $.createElement('div').addClass('slider');
  foo.appendChild(this.slider_);

  this.options_ = [];
  modes.forEach(function(desired_mode) {
    var option = $.createElement('div')
      .dataset('mode', desired_mode)
      .innerHTML(desired_mode)
      .addClass('option')
      .addEventListener('click', function() {
        self.thermostat_.set_mode(desired_mode);
      });

    self.options_.push(option);

    parent.appendChild(option);
  });

  this.current_mode_ = this.thermostat_.get_effective_mode(); // TODO: Why am I setting this twice?
  this.envoy.addEventListener('thermostat_mode_change', this.thermostat_mode_change_.bind(this));
};


/**
 * Move the mode background slider around.
 *
 * @param {Event} e
 *
 * @private
 */
component.thermostat.part.mode.prototype.thermostat_mode_change_ = function(e) {
  if (e.detail.component === this.thermostat_) {
    var self = this;

    var current_mode = this.current_mode_;
    var new_mode = this.thermostat_.get_mode();

    this.options_.forEach(function(option) {
      option.removeClass('active');
      if (option.dataset('mode') === new_mode) {
        option.addClass('active');

        var f = function() {
          var option_rect = option.getBoundingClientRect();
          var parent_rect = self.parent_.getBoundingClientRect();

          self.slider_.style({
            'top': option_rect.top - parent_rect.top,
            'width': option_rect.width,
            'height': option_rect.height,
            'opacity': 1
          });
        };

        // This is less than ideal but it works. The bounding client rect calls
        // are getting bad info because not everything is completely rendered
        // when they run. Calling this on a delay fixes that. It seems to only
        // happen on remote connections and a short delay usually works but on
        // slower connections or when ctrl+shift+r-ing sometimes a longer delay
        // is needed.
        f();                // First try
        setTimeout(f, 50);  // Usually works
        setTimeout(f, 200); // Still looks nice and handles 99% of situations
        setTimeout(f, 500); // Effect is jumpy at this point, just a failsafe
      }
    });

    this.current_mode_ = new_mode;
  }
};
