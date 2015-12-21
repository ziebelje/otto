


/**
 * List of currently running equipment.
 *
 * @param {component.thermostat} thermostat
 *
 * @constructor
 */
component.thermostat.part.equipment = function(thermostat) {
  component.thermostat.part.apply(this, arguments);
  this.thermostat_ = thermostat;
};
$.inherits(component.thermostat.part.equipment, component.thermostat.part);


component.thermostat.part.equipment.prototype.parent_;
component.thermostat.part.equipment.prototype.icons_;
component.thermostat.part.equipment.prototype.current_equipment_;


/**
 * Decorate
 *
 * @param {rocket.Elements} parent
 */
component.thermostat.part.equipment.prototype.decorate = function(parent) {
  var self = this;

  this.icons_ = {};

  // TODO: add generic support for "other" equipment
  ['fan', 'heat_pump', 'aux'].forEach(function(equipment) {
    // Because "aux" is a reserved word in Windows filenames...
    var icon_filename = (equipment === 'aux') ? 'aux_' : equipment;

    var icon = $.createElement('img')
      .addClass('hide')
      .setAttribute('src', 'img/component/thermostat/' + icon_filename + '.png');

    parent.appendChild(icon);
    self.icons_[equipment] = icon;
  });

  this.current_equipment_ = this.thermostat_.get_equipment();

  this.parent_ = parent;

  this.envoy.addEventListener('thermostat_equipment_change', this.thermostat_equipment_change_.bind(this));
};


/**
 * Move the equipment background slider around.
 *
 * @param {Event} e
 *
 * @private
 */
component.thermostat.part.equipment.prototype.thermostat_equipment_change_ = function(e) {
  if (e.detail.component === this.thermostat_) {
    var self = this;

    var current_equipment = this.current_equipment_;
    var new_equipment = this.thermostat_.get_equipment();

    // Hide any equipment that is currently shown but no longer running.
    for (var i = 0; i < current_equipment.length; i++) {
      if (new_equipment.indexOf(current_equipment[i]) === -1) {
        this.icons_[current_equipment[i]][0].className = 'hide';
      }
    }

    var i = 0;
    new_equipment.forEach(function(equipment) {
      var start_radians = parseFloat(self.icons_[equipment].dataset('radians')) || 0;

      var end_degrees = 55 - (i * 18);
      var end_radians = end_degrees * Math.PI / 180;

      var radius = 100;
      var center_x = 100;
      var center_y = 100;

      // If the equipment is not currently displayed, pop it into place with no
      // sliding.
      if (current_equipment.indexOf(new_equipment[i]) === -1) {
        self.icons_[equipment][0].className = 'show';

        var left = radius * Math.cos(end_radians) + center_x;
        var top = radius * Math.sin(end_radians) + center_y;

        self.icons_[equipment]
          .dataset('radians', end_radians)
          .style({
            'top': top + 'px',
            'left': left + 'px'
          });

        start_radians = end_radians;
      }
      else {
        // Move stuff around as necessary.
        $.step(function(percentage, sine) {
          var radians = start_radians + ((end_radians - start_radians) * sine);
          var left = radius * Math.cos(radians) + center_x;
          var top = radius * Math.sin(radians) + center_y;

          self.icons_[equipment]
            .dataset('radians', radians)
            .style({
              'top': top + 'px',
              'left': left + 'px'
            });
        }, 500, null, 60);
      }

      i++;
    });

    this.current_equipment_ = new_equipment;
  }
};
