


/**
 * This layer houses all of the cards and other dashboard components. It keeps
 * track of all this stuff and calls all of the dispatchers when necessary.
 *
 * @constructor
 */
layer.dashboard = function() {
  layer.apply(this, arguments);
  this.components_ = [];
};
$.inherits(layer.dashboard, layer);


layer.dashboard.prototype.components_;
layer.dashboard.prototype.poll_timeout_;


/**
 * Decorate
 *
 * @param {rocket.Elements} parent
 */
layer.dashboard.prototype.decorate = function(parent) {
  var foo = $.createElement('div').style({'width': '500px', 'float': 'left', 'margin-right': '10px'});
  parent.appendChild(foo);
  var otto = new component.otto(this, 1);
  otto.render(foo);
  this.components_.push(otto);

  var foo = $.createElement('div').style({'width': '500px', 'float': 'left'});
  parent.appendChild(foo);
  var ecobee = new component.thermostat.ecobee(this, 1);
  ecobee.render(foo);
  this.components_.push(ecobee);

  this.poll_();
};


/**
 * Poll the server for any updates.
 *
 * @private
 */
layer.dashboard.prototype.poll_ = function() {
  var self = this;

  var xhr = api('ecobee_thermostat', 'read', null, function(ecobee_thermostats) {
    self.dispatch({'ecobee_thermostat': ecobee_thermostats});
  });
};


/**
 * All change requests start here, either from the polling or when performing
 * actions on the cards. This dispatcher will call all of the dashboard
 * component dispatchers to get everything updated.
 *
 * @param {Object} data
 */
layer.dashboard.prototype.dispatch = function(data) {
  var self = this;

  clearTimeout(this.poll_timeout_);
  this.poll_timeout_ = setTimeout(this.poll_.bind(this), 5000);

  var events = [];
  this.components_.forEach(function(component) {
    events = events.concat(component.dispatch(data));
  });

  // TODO: De-duplicate events

  self.extend(data);

  events.forEach(function(event) {
    self.envoy.dispatchEvent(
      new CustomEvent(
        event.type,
        {'detail': event.detail}
      )
    );
  });
};
