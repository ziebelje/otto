var $ = rocket.extend(rocket.$, rocket);

$.ready(function() {
  (new layer.load()).render();
});

var otto = {};

// api.prototype.url = 'api/';
