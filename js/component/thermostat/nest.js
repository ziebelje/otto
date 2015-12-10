/**
 * Nothing to see here. This is just a quick file to remind me of how I would
 * build this if I wanted to add support for additional thermostats. Each card
 * variation would get it's own separate component that would then override
 * generic functions like set_temerature() or resume_schedule() by calling the
 * appropriate function in the API.
 *
 * When returning data from the API to JS (like for thermostat history), it's
 * the responsiblity of the API to convert each thermostat's data into a
 * common form for the web.
 */
