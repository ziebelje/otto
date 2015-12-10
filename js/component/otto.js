


/**
 * Ecobee.
 *
 * @param {layer.dashboard} dashboard
 *
 * @constructor
 */
component.otto = function(dashboard) {
  component.apply(this, arguments);
  this.dashboard_ = dashboard;
};
$.inherits(component.otto, component);

component.otto.prototype.dashboard_;


/**
 * Decorate
 *
 * @param {rocket.Elements} parent
 */
component.otto.prototype.decorate = function(parent) {
  var card = $.createElement('div').addClass('card');
  parent.appendChild(card);

  card.appendChild(
    $.createElement('div').addClass('hello').innerHTML('Hi, I\'m Otto')
  );

  var otto = $.createElement('div').addClass('otto');
  card.appendChild(otto);

  var wheel = $.createElement('div').addClass('wheel');
  otto.appendChild(wheel);

  var body = $.createElement('div').addClass('body');
  otto.appendChild(body);
};


/**
 * Look at a set of new data, compare it to the cache, then dispatch
 * appropriate events for any values that have changed.
 *
 * @param {Object} data
 *
 * @return {Array.<Object>} Events that need to be dispatched.
 */
component.otto.prototype.dispatch = function(data) {
  return [];
};
