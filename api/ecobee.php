<?php

namespace api;

class ecobee extends \yinaf\api {

  /**
   * Send an API call to ecobee and return the response.
   *
   * @param string $method GET or POST
   * @param string $endpoint The API endpoint
   * @param array $arguments POST or GET parameters
   * @param boolean $auto_refresh_token Whether or not to automatically get a
   * new token if the old one is expired.
   *
   * @return array The response of this API call.
   */
  private function ecobee($method, $endpoint, $arguments, $auto_refresh_token = true) {
    $curl_handle = curl_init();

    // Attach the client_id to all requests.
    $arguments['client_id'] = \yinaf\configuration::$ecobee_client_id;

    // Authorize/token endpoints don't use the /1/ in the URL. Everything else
    // does.
    $actual_endpoint = $endpoint;
    if($endpoint !== 'authorize' && $endpoint !== 'token') {
      $actual_endpoint = '/1/' . $endpoint;

      // Get the most recent token - everything else should already be marked as
      // deleted.
      $ecobee_tokens = $this->api('ecobee_token', 'read');
      $ecobee_token = end($ecobee_tokens);

      // For non-authorization endpoints, add the access_token header.
      curl_setopt($curl_handle, CURLOPT_HTTPHEADER , array(
        'Authorization: Bearer ' . $ecobee_token['access_token']
      ));
    }
    else {
      $actual_endpoint = '/' . $endpoint;
    }
    $url = 'https://api.ecobee.com' . $actual_endpoint;

    if($method === 'GET') {
      $url .= '?' . http_build_query($arguments);
    }

    curl_setopt($curl_handle, CURLOPT_URL, $url);
    curl_setopt($curl_handle, CURLOPT_RETURNTRANSFER, true);

    if($method === 'POST') {
      curl_setopt($curl_handle, CURLOPT_POST, true);
      curl_setopt($curl_handle, CURLOPT_POSTFIELDS, http_build_query($arguments));
    }

    $curl_response = curl_exec($curl_handle);

    // Log this request and response
    if(\yinaf\configuration::$ecobee_api_auditing === true) {
      $this->api('ecobee_api_log', 'create', array(
        'method' => $method,
        'endpoint' => $actual_endpoint,
        'arguments' => $arguments,
        'response' => $curl_response
      ));
    }

    if($curl_response === false || curl_errno($curl_handle) !== 0) {
      throw new \Exception('cURL error: ' . curl_error($curl_handle));
    }

    $response = json_decode($curl_response, true);
    if($response === false) {
      throw new \Exception('Invalid JSON');
    }

    curl_close($curl_handle);

    // If the token was expired, refresh it and try again. Trying again sets
    // auto_refresh_token to false to prevent accidental infinite refreshing if
    // something bad happens.
    if(isset($response['status']) === true && $response['status']['code'] === 14) {
      $this->refresh_token($ecobee_token['refresh_token']);
      return $this->ecobee($method, $endpoint, $arguments, false);
    }
    else {
      return $response;
    }
  }

  /**
   * Perform the first-time authorization for this app.
   *
   * @see https://www.ecobee.com/home/developer/api/documentation/v1/auth/pin-api-authorization.shtml
   *
   * @return array The response of this API call. Included will be the code
   * needed for the grant_token API call.
   */
  public function authorize() {
    return $this->ecobee(
      'GET',
      'authorize',
      array(
        'response_type' => 'ecobeePin',
        'scope' => 'smartWrite'
      )
    );
  }

  /**
   * Given a code returned by the authorize endpoint, obtain an access token
   * for use on all future API calls.
   *
   * @see https://www.ecobee.com/home/developer/api/documentation/v1/auth/auth-req-resp.shtml
   * @see https://www.ecobee.com/home/developer/api/documentation/v1/auth/authz-code-authorization.shtml
   *
   * @param string $code
   *
   * @return array The response of the API call. Included will be the
   * access_token needed for the API call and the refresh_token to use if the
   * access_token ends up being expired.
   */
  public function grant_token($code) {
    $response = $this->ecobee(
      'POST',
      'token',
      array(
        'grant_type' => 'ecobeePin',
        'code' => $code
      )
    );

    if(isset($response['access_token']) === false || isset($response['refresh_token']) === false) {
      throw new \Exception('Could not grant token');
    }

    $this->api('ecobee_token', 'create', array(
      'access_token' => $response['access_token'],
      'refresh_token' => $response['refresh_token']
    ));

    return $response;
  }

  /**
   * Given the latest refresh token, obtain a fresh access token for use in
   * all future API calls.
   *
   * @param string $refresh_token
   *
   * @return array The response of the API call.
   */
  public function refresh_token($refresh_token) {
    $ecobee_token = $this->api('ecobee_token', 'get', array(
      'refresh_token' => $refresh_token
    ));

    $response = $this->ecobee(
      'POST',
      'token',
      array(
        'grant_type' => 'refresh_token',
        'refresh_token' => $refresh_token
      )
    );

    if(isset($response['access_token']) === false || isset($response['refresh_token']) === false) {
      throw new \Exception('Could not refresh token');
    }

    $this->api('ecobee_token', 'create', array(
      'access_token' => $response['access_token'],
      'refresh_token' => $response['refresh_token']
    ));

    // Delete the current token
    $this->api(
      'ecobee_token',
      'delete',
      $ecobee_token['ecobee_token_id']
    );

    return $response;
  }

  /**
   * This is the main polling function and can be called fairly frequently.
   * This will get a list of all thermostats and their revisions, then return
   * any revision value that has changed so that other API calls can be made.
   *
   * @see https://www.ecobee.com/home/developer/api/documentation/v1/operations/get-thermostat-summary.shtml
   *
   * @return array An array of thermostat identifiers pointing at an array of
   * revision columns that changed.
   */
  public function get_thermostat_summary() {
    $response = $this->ecobee(
      'GET',
      'thermostatSummary',
      array(
        'body' => json_encode(array(
          'selection' => array(
            'selectionType' => 'registered',
            'selectionMatch' => ''
          )
        ))
      )
    );

    $return = array();

    // Update revisions and a few other columns. Also create/delete new/old
    // thermostats on the fly.
    foreach($response['revisionList'] as $thermostat) {
      // Mutate the return data into what is essentially the essence of a
      // thermostat.
      $thermostat = explode(':', $thermostat);
      $thermostat = array(
        'identifier' => $thermostat[0],
        'name' => $thermostat[1],
        'connected' => $thermostat[2] === 'true' ? '1' : '0',
        'thermostat_revision' => $thermostat[3],
        'alert_revision' => $thermostat[4],
        'runtime_revision' => $thermostat[5],
        'internal_revision' => $thermostat[6]
      );

      // Check to see if this thermostat already exists.
      $ecobee_thermostat = $this->api('ecobee_thermostat', 'get', array(
        'identifier' => $thermostat['identifier']
      ));

      // If this thermostat does not already exist, create it.
      if($ecobee_thermostat === null) {
        $ecobee_thermostat = $this->api('ecobee_thermostat', 'create', array(
          'identifier' => $thermostat['identifier'],
          'name' => $thermostat['name'],
          'connected' => $thermostat['connected'],
          'thermostat_revision' => $thermostat['thermostat_revision'],
          'alert_revision' => $thermostat['alert_revision'],
          'runtime_revision' => $thermostat['runtime_revision'],
          'internal_revision' => $thermostat['internal_revision'],
        ));

        $ecobee_thermostat_id = $ecobee_thermostat['ecobee_thermostat_id'];
      }
      else {
        // If this thermostat already exists, update it.
        $ecobee_thermostat = $this->api(
          'ecobee_thermostat',
          'get',
          array('identifier' => $thermostat['identifier'])
        );

        $this->api('ecobee_thermostat', 'update', array(
          'ecobee_thermostat_id' => $ecobee_thermostat['ecobee_thermostat_id'],
          'name' => $thermostat['name'],
          'connected' => $thermostat['connected'],
          'thermostat_revision' => $thermostat['thermostat_revision'],
          'alert_revision' => $thermostat['alert_revision'],
          'runtime_revision' => $thermostat['runtime_revision'],
          'internal_revision' => $thermostat['internal_revision']
        ));

        $ecobee_thermostat_id = $ecobee_thermostat['ecobee_thermostat_id'];
      }

      // Strip out unwanted columns, especially since $ecobee_thermostat will be
      // multi-dimensional which will break array_diff.
      $keys = array('thermostat_revision', 'alert_revision', 'runtime_revision', 'internal_revision');
      $return[$ecobee_thermostat_id] = array_diff(
        array_intersect_key($thermostat, array_flip($keys)),
        array_intersect_key($ecobee_thermostat, array_flip($keys))
      );
    }

    // Return the most recent values for any revision columns that have changed.
    // If it's a new thermostat, all of them will be returned. Keyed by
    // ecobee_thermostat_id.
    return $return;
  }

  /**
   * Given a list of thermostats, get and update the runtime data in the
   * thermostat table.
   *
   * @see https://www.ecobee.com/home/developer/api/documentation/v1/operations/get-thermostats.shtml
   * @see https://www.ecobee.com/home/developer/api/documentation/v1/objects/Selection.shtml
   */
  public function sync_thermostats() {
    $response = $this->ecobee(
      'GET',
      'thermostat',
      array(
        'body' => json_encode(array(
          'selection' => array(
            'selectionType' => 'registered',
            'selectionMatch' => '',
            'includeRuntime' => true,
            'includeExtendedRuntime' => true,
            'includeElectricity' => true,
            'includeSettings' => true,
            'includeLocation' => true,
            'includeProgram' => true,
            'includeEvents' => true,
            'includeDevice' => true,
            'includeTechnician' => true,
            'includeUtility' => true,
            'includeManagement' => true,
            'includeAlerts' => true,
            'includeWeather' => true,
            'includeHouseDetails' => true,
            'includeOemCfg' => true,
            'includeEquipmentStatus' => true,
            'includeNotificationSettings' => true,
            'includeVersion' => true,
            'includeSensors' => true
          )
        ))
      )
    );

    // Update each thermostat with the actual and desired values.
    foreach($response['thermostatList'] as $thermostat) {
      $ecobee_thermostat = $this->api(
        'ecobee_thermostat',
        'get',
        array('identifier' => $thermostat['identifier'])
      );

      $this->api('ecobee_thermostat', 'update', array(
        'ecobee_thermostat_id' => $ecobee_thermostat['ecobee_thermostat_id'],
        'runtime' => $thermostat['runtime'],
        'extended_runtime' => $thermostat['extendedRuntime'],
        'electricity' => $thermostat['electricity'],
        'settings' => $thermostat['settings'],
        'location' => $thermostat['location'],
        'program' => $thermostat['program'],
        'events' => $thermostat['events'],
        'device' => $thermostat['devices'], // TODO DEVICE VS DEVICES?
        'technician' => $thermostat['technician'],
        'utility' => $thermostat['utility'],
        'management' => $thermostat['management'],
        'alerts' => $thermostat['alerts'],
        'weather' => $thermostat['weather'],
        'house_details' => $thermostat['houseDetails'],
        'oem_cfg' => $thermostat['oemCfg'],
        'equipment_status' => trim($thermostat['equipmentStatus']) !== '' ? explode(',', $thermostat['equipmentStatus']) : array(),
        'notification_settings' => $thermostat['notificationSettings'],
        'version' => $thermostat['version'],
        'remote_sensors' => $thermostat['remoteSensors'],
        'deleted' => 0
      ));
    }
  }

  /**
   * Get the runtime report data for a specified thermostat. Updates the
   * runtime_report table.
   *
   * @param int $ecobee_thermostat_id
   */
  public function sync_runtime_report($ecobee_thermostat_id) {
    $columns = array(
      'auxHeat1' => 'auxiliary_heat_1',
      'auxHeat2' => 'auxiliary_heat_2',
      'auxHeat3' => 'auxiliary_heat_3',
      'compCool1' => 'compressor_cool_1',
      'compCool2' => 'compressor_cool_2',
      'compHeat1' => 'compressor_heat_1',
      'compHeat2' => 'compressor_heat_2',
      'dehumidifier' => 'dehumidifier',
      'dmOffset' => 'demand_management_offset',
      'economizer' => 'economizer',
      'fan' => 'fan',
      'humidifier' => 'humidifier',
      'outdoorHumidity' => 'outdoor_humidity',
      'outdoorTemp' => 'outdoor_temperature',
      'sky' => 'sky',
      'ventilator' => 'ventilator',
      'wind' => 'wind',
      'zoneAveTemp' => 'zone_average_temperature',
      'zoneCalendarEvent' => 'zone_calendar_event',
      'zoneCoolTemp' => 'zone_cool_temperature',
      'zoneHeatTemp' => 'zone_heat_temperature',
      'zoneHumidity' => 'zone_humidity',
      'zoneHumidityHigh' => 'zone_humidity_high',
      'zoneHumidityLow' => 'zone_humidity_low',
      'zoneHvacMode' => 'zone_hvac_mode',
      'zoneOccupancy' => 'zone_occupancy',
    );

    $ecobee_thermostat = $this->api('ecobee_thermostat', 'get', $ecobee_thermostat_id);

    // Get the start time. That is always going to be the most recent row minus
    // an hour or two. This because ecobee updates the runtimeReport data every
    // 5 minutes for weather and then every 15 minutes for other data. Past
    // that, the data seems to lag an hour behind sometimes. This just helps
    // ensure we have everything.
    $query = 'select * from ecobee_runtime_report order by ecobee_runtime_report_id desc limit 1';
    $result = $this->database->query($query) or die($this->database->error);
    if($result->num_rows === 0) {
      $start_gmt = time() - date('Z') - (3600 * 2);
    }
    else {
      $row = $result->fetch_assoc();
      $start_gmt = strtotime($row['timestamp']) - date('Z') - (3600 * 2);
    }

    $start_date = date('Y-m-d', $start_gmt);
    $start_interval = date('H', $start_gmt) * 12 + round(date('i', $start_gmt) / 5);

    // End time
    $end_gmt = time() - date('Z');
    $end_date = date('Y-m-d', $end_gmt);
    $end_interval = date('H', $end_gmt) * 12 + round(date('i', $end_gmt) / 5);

    $response = $this->ecobee(
      'GET',
      'runtimeReport',
      array(
        'body' => json_encode(array(
          'selection' => array(
            'selectionType' => 'thermostats',
            'selectionMatch' => $ecobee_thermostat['identifier'] // This is required by this API call
          ),
          'startDate' => $start_date,
          'startInterval' => $start_interval,
          'endDate' => $end_date,
          'endInterval' => $end_interval,
          'columns' => implode(',', array_keys($columns))
        ))
      )
    );

    $inserts = array();
    $on_duplicate_keys = array();
    foreach($response['reportList'][0]['rowList'] as $row) {
      $row = substr($row, 0, -1); // Strip the trailing comma from the array.
      $row = explode(',', $row);
      $row = array_map('trim', $row);
      $row = array_map(array($this->database, 'real_escape_string'), $row);

      // Date and time are first two columns
      list($date, $time) = array_splice($row, 0, 2);
      array_unshift($row, $ecobee_thermostat_id, date('Y-m-d H:i:s', strtotime($date . ' ' . $time)));

      $insert = '("' . implode('","', $row) . '")';
      $insert = str_replace('""', 'null', $insert);
      $inserts[] = $insert;
    }

    foreach(array_merge(array('ecobee_thermostat_id' => 'ecobee_thermostat_id', 'timestamp' => 'timestamp'), $columns) as $column) {
      $on_duplicate_keys[] = '`' . $column . '` = values(`' . $column . '`)';
    }

    $query = 'insert into ecobee_runtime_report(`' . implode('`,`', array_merge(array('ecobee_thermostat_id', 'timestamp'), array_values($columns))) . '`) values' . implode(',', $inserts) . ' on duplicate key update ' . implode(',', $on_duplicate_keys);
    $this->database->query($query) or die($this->database->error);
  }

  /**
   * Set just the cool temperature, leaving the cool where it currently is.
   *
   * @param int $ecobee_thermostat_id
   * @param float $temperature
   */
  public function set_cool_temperature($arguments) {
    $this->set_temperatures(
      $arguments['ecobee_thermostat_id'],
      $arguments['temperature'],
      null
    );
  }

  /**
   * Set just the heat temperature, leaving the cool where it currently is.
   *
   * @param int $ecobee_thermostat_id
   * @param float $temperature
   */
  public function set_heat_temperature($arguments) {
    $this->set_temperatures(
      $arguments['ecobee_thermostat_id'],
      null,
      $arguments['temperature']
    );
  }

  /**
   * Set the heat/cool temperatures. Setting just one will leave the other one
   * what it's currently set to. Setting both will change them both. Setting
   * neither will hold at the current temperatures and disable any active
   * schedule.
   *
   * @param int $ecobee_thermostat_id
   * @param float $cool_temperature
   * @param float $heat_temperature
   */
  private function set_temperatures($ecobee_thermostat_id, $cool_temperature = null, $heat_temperature = null) {
    $ecobee_thermostat = $this->api('ecobee_thermostat', 'get', $ecobee_thermostat_id);

    // If cool or heat are unspecified, set them to be whatever they currently
    // happen to be.
    if($cool_temperature === null) {
      $cool_temperature = $ecobee_thermostat['runtime']['desiredCool'] / 10;
    }
    if($heat_temperature === null) {
      $heat_temperature = $ecobee_thermostat['runtime']['desiredHeat'] / 10;
    }

    // Format the way ecobee wants them.
    $cool_temperature = round($cool_temperature, 1) * 10;
    $heat_temperature = round($heat_temperature, 1) * 10;

    $this->ecobee(
      'POST',
      'thermostat',
      array(
        'format' => 'json',
        'body' => json_encode(array(
          'selection' => array(
            'selectionType' => 'thermostats',
            'selectionMatch' => $ecobee_thermostat['identifier']
          ),
          'functions' => array(
            array(
              'type' => 'setHold',
              'params' => array(
                'holdType' => 'indefinite',
                'coolHoldTemp' => $cool_temperature,
                'heatHoldTemp' => $heat_temperature
              )
            )
          )
        ))
      )
    );

    // After any change, sync the thermostat data again. Otherwise the database
    // will still reflect the old temperature.
    $this->sync_thermostats();

  }

  public function resume_schedule($ecobee_thermostat_id) {
    $ecobee_thermostat = $this->api('ecobee_thermostat', 'get', $ecobee_thermostat_id);

    $this->ecobee(
      'POST',
      'thermostat',
      array(
        'format' => 'json',
        'body' => json_encode(array(
          'selection' => array(
            'selectionType' => 'thermostats',
            'selectionMatch' => $ecobee_thermostat['identifier']
          ),
          'functions' => array(
            array(
              'type' => 'resumeProgram',
            )
          )
        ))
      )
    );

    // After any change, sync the thermostat data again. Otherwise the database
    // will still reflect the old temperature.
    $this->sync_thermostats();
  }

  /**
   * Set the current HVAC mode.
   *
   * @param int $ecobee_thermostat_id
   * @param string $hvac_mode off|auto|heat|cool|aux
   */
  public function set_hvac_mode($arguments) {
    $ecobee_thermostat = $this->api('ecobee_thermostat', 'get', $ecobee_thermostat_id);

    // For simplicity
    if($arguments['hvac_mode'] === 'aux') {
      $arguments['hvac_mode'] = 'auxHeatHonly';
    }

    $this->ecobee(
      'POST',
      'thermostat',
      array(
        'format' => 'json',
        'body' => json_encode(array(
          'selection' => array(
            'selectionType' => 'registered',
            'selectionMatch' => $ecobee_thermostat['identifier']
          ),
          'thermostat' => array(
            'settings' => array(
              'hvacMode' => $arguments['hvac_mode']
            )
          )
        ))
      )
    );

    // After any change, sync the thermostat data again. Otherwise the database
    // will still reflect the old temperature.
    $this->sync_thermostats();
  }

  public function cron() {
    // Poll for the thermostat summary. The response of this determines if
    // additional API calls are necessary.
    $response = $this->api('api\ecobee', 'get_thermostat_summary');

    // Run this one regardless since it's not clear what revisions are used for all
    // of this data.
    $this->sync_thermostats();
    // $this->api('api\ecobee', 'sync_thermostats');

    foreach($response as $thermostat_id => $changed_revisions) {
      if(array_key_exists('runtime_revision', $changed_revisions) === true) {
        $this->sync_runtime_report($thermostat_id);
        // $this->api('api\ecobee', 'sync_runtime_report', $thermostat_id);
      }
    }

  }

}


// Setup:
// jonziebell.com/otto/yinaf/?class=api\ecobee&function=authorize&arguments=null
// jonziebell.com/otto/yinaf/?class=api\ecobee&function=grant_token&arguments="put_code_here"

/*# sqlbee

## About
sqlbee is an incredibly simple application that queries the ecobee API and extracts thermostat and runtime report data into a mySQL database. This is essentially the data from the System Monitor section of ecobee Home IQ. If you want your ecobee data available to you for querying or display but don't want to mess with their API, then this is for you. It was written for personal use but I'll be happy to answer questions or add support for other things if I have time.

_This project uses the MIT License, which means you can do whatever you want with the code and that I am not liable for anything. Have fun!_

### What does it do?
- Extracts current thermostat data like temperature, humidity, setpoints, etc (supports multiple thermostats)
- Extracts runtime report data using the ecobee runtimeReport API endpoint
- Provides a simple means of running common thermostat operations like setting the temperature and resuming the schedule (more functions to come)
- [TODO] Provides a basic means of connecting up custom endpoints to meaningful events like temperature or setpoint changes

### What does it NOT do?
- Does **NOT** offer a means of reading the extracted data
- Does **NOT** analyze or display the data

## Requirements
- An ecobee thermostat
- An ecobee developer account
- A server with PHP and mySQL (any recent versions should probably work)

## Getting Started
1. Create the sqlbee database and tables on your mySQL database by running `sqlbee.sql`
2. Rename configuration.example.php to configuration.php
3. Set the `$database_*` variables in configuration.php to match your mySQL connection properties
4. Create an ecobee developer account (https://www.ecobee.com/developers/)
5. Create your own ecobee app and get the API key and set that as the `$client_id` variable in `configuration.php`
6. Execute setup.php by running `php -f setup.php` and follow the instruction*/
