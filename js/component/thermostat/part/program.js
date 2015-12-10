


/**
 * Current thermostat program.
 *
 * @param {component.thermostat} thermostat
 *
 * @constructor
 */
component.thermostat.part.program = function(thermostat) {
  component.thermostat.part.apply(this, arguments);
  this.thermostat_ = thermostat;
};
$.inherits(component.thermostat.part.program, component.thermostat.part);

component.thermostat.part.program.flip_container_;
component.thermostat.part.program.front_icon_;
component.thermostat.part.program.back_icon_;
component.thermostat.part.program.program_container_;


/**
 * Decorate
 *
 * @param {rocket.Elements} parent
 */
component.thermostat.part.program.prototype.decorate = function(parent) {
  var self = this;

  // Flippy image
  this.flip_container_ = $.createElement('div').addClass('flip_container');
  parent.appendChild(this.flip_container_);

  var flipper = $.createElement('div').addClass('flipper');
  this.flip_container_.appendChild(flipper);

  var front = $.createElement('div').addClass('front');
  flipper.appendChild(front);

  var back = $.createElement('div').addClass('back');
  flipper.appendChild(back);

  this.front_icon_ = $.createElement('img').setAttribute('src', 'img/blank.png');
  front.appendChild(this.front_icon_);

  this.back_icon_ = $.createElement('img').setAttribute('src', 'img/blank.png');
  back.appendChild(this.back_icon_);

  // Program text
  this.program_container_ = $.createElement('div').addClass('program_container');
  parent.appendChild(this.program_container_);

  parent.addEventListener('mousedown', function() {
    self.thermostat_.resume_schedule();
  });

  this.envoy.addEventListener('thermostat_program_change', this.thermostat_program_change_.bind(this));
};


/**
 * Program change.
 *
 * @param {Event} e
 *
 * @private
 */
component.thermostat.part.program.prototype.thermostat_program_change_ = function(e) {
  if (e.detail.component === this.thermostat_) {
    var program = this.thermostat_.get_program();

    if (this.flip_container_.hasClass('flip') === true) {
      this.front_icon_.setAttribute('src', 'img/component/thermostat/' + program + '.png');
    }
    else {
      this.back_icon_.setAttribute('src', 'img/component/thermostat/' + program + '.png');
    }

    this.flip_container_.toggleClass('flip');

    this.program_container_.innerHTML(program);
  }
};
