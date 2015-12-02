


/**
 * Load Otto.
 *
 * @constructor
 */
layer.load = function() {
  layer.apply(this, arguments);
};
$.inherits(layer.load, layer);


/**
 * Decorate
 *
 * @param {rocket.Elements} parent
 */
layer.load.prototype.decorate = function(parent) {
  parent.innerHTML('Otto');
};
