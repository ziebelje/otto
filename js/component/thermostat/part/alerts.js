


/**
 * Small alerts container in the top left corner.
 *
 * @param {component.thermostat} thermostat
 *
 * @constructor
 */
component.thermostat.part.alerts = function(thermostat) {
  component.thermostat.part.apply(this, arguments);
  this.thermostat_ = thermostat;
};
$.inherits(component.thermostat.part.alerts, component.thermostat.part);


component.thermostat.part.alerts.prototype.displayed_alert_;
component.thermostat.part.alerts.prototype.bell_;
component.thermostat.part.alerts.prototype.text_;
component.thermostat.part.alerts.prototype.text_slider_;
component.thermostat.part.alerts.prototype.text_slider_displayed_alert_;
component.thermostat.part.alerts.prototype.text_slider_next_alert_;
component.thermostat.part.alerts.prototype.cycle_interval_;


/**
 * Decorate
 *
 * @param {rocket.Elements} parent
 */
component.thermostat.part.alerts.prototype.decorate = function(parent) {
  var self = this;

  this.bell_ = $.createElement('div').addClass('bell').innerHTML('🔔');
  parent.appendChild(this.bell_);

  this.text_ = $.createElement('div').addClass('text');
  parent.appendChild(this.text_);

  this.text_slider_ = $.createElement('div').addClass('text_slider');
  this.text_.appendChild(this.text_slider_);

  this.text_slider_displayed_alert_ = $.createElement('div').addClass('text_slider');
  this.text_slider_.appendChild(this.text_slider_displayed_alert_);

  this.text_slider_next_alert_ = $.createElement('div').addClass('text_slider');
  this.text_slider_.appendChild(this.text_slider_next_alert_);

  this.envoy.addEventListener('thermostat_alerts_change', this.thermostat_alerts_change_.bind(this));
};


/**
 * Move the alerts background slider around.
 *
 * @param {Event} e
 *
 * @private
 */
component.thermostat.part.alerts.prototype.thermostat_alerts_change_ = function(e) {
  if (e.detail.component === this.thermostat_) {
    var self = this;

    // Stop cycling through alerts temporarily
    clearInterval(this.cycle_interval_);

    var new_alerts = this.thermostat_.get_alerts();
    console.log(new_alerts);

    // Show or hide the alerts
    if (new_alerts.length > 0) {
      this.bell_.addClass('show');
      this.text_.addClass('show');
      if (this.displayed_alert_ === undefined) {
        self.text_slider_displayed_alert_.innerHTML(new_alerts[0].text);
        this.displayed_alert_ = new_alerts[0];
      }
    }
    else {
      this.bell_.removeClass('show');
      this.text_.removeClass('show');
      delete this.displayed_alert_;
    }

    if (new_alerts.length > 1) {
      this.cycle_interval_ = setInterval(function() {
        // Always try to cycle through to the next alert in sequence by looking
        // to see where the currently displayed alert is in the current alerts.
        // If, by chance, the currently displayed alert is no longer listed,
        // just start at the top.
        var next_alert = self.current_alerts_[0];
        for (var i = 0; i < self.current_alerts_.length; i++) {
          if (self.current_alerts_[i].alert_id === self.displayed_alert_.alert_id) {
            next_alert = self.current_alerts_[(i + 1) % self.current_alerts_.length];
            break;
          }
        }

        // Set the innerHTML of the next alert, then shift the slider up.
        self.text_slider_next_alert_.innerHTML(next_alert.text);
        self.text_slider_.addClass(['transition', 'slide']);

        // After that slide transition is complete, replace the text in the
        // alert div that's out of sight and instantly shift the margin back
        // down. This is done by removing the transition
        setTimeout(function() {
          self.text_slider_displayed_alert_.innerHTML(self.text_slider_next_alert_.innerHTML());
          self.text_slider_.removeClass(['transition', 'slide']);
        }, 500); // Run this after the original slide effect is done

        self.displayed_alert_ = next_alert;

      }, 5000); // Switch alerts every 5 seconds

    }

    this.current_alerts_ = new_alerts;
  }
};
