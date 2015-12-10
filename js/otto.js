var $ = rocket.extend(rocket.$, rocket);

$.ready(function() {
  (new layer.dashboard()).render();
});

var otto = {};


/**
 * Extend the cache with some data.
 *
 * @param {Object} source
 */
cache.prototype.extend = function(source) {
  this.extend_deep_(cache.cache, source);
};


/**
 * Deep extend an object.
 *
 * @param {Object} target
 * @param {Object} source
 *
 * @private
 *
 * @return {Object} The updated target.
 */
cache.prototype.extend_deep_ = function(target, source) {
  for (var key in source) {
    if (jex.type(source[key]) === 'object') {
      target[key] = this.extend_deep_(target[key] || {}, source[key]);
    }
    else if (jex.type(source[key]) === 'array') {
      target[key] = source[key].slice(0);
    }
    else {
      target[key] = source[key];
    }
  }
  return target;
};
