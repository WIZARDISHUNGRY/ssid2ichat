#!/usr/bin/env node
/*!
 * Module dependencies.
 */
var child_process = require('child_process'),
  fs = require('fs'),
  sleep = require('sleep').sleep,
  YAML = require('yamljs');

/*!
 * Parse the process name and input
 */

var name = process.argv[1].replace(/^.*[\\\/]/, '').replace('.js', '');
var input = process.argv[2];
var files = [process.env['HOME']+"/."+name+".yml", process.cwd()+"/"+name+".yml"];
var airport = "/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport";

/*!
 * Display help
 */

if (input === '-h' || input === '--help') {
    help();
    process.exit();
}

/*!
 * Display version
 */

if (input === '-v' || input === '--version') {
    version();
    process.exit();
}

for (let value of files) {
  if(fs.existsSync(value)) input = value;
}
if (input == undefined) input = files[0];

/*!
 * Get ready to run
 */

console.log("Going to load "+input);
if(!fs.existsSync(input)) {
  console.log("File not found");
  process.exit();
}

var ssid;
do {
  go(input);
  sleep(60);
}while(1);

/*!
 * This is the meat
 */
function go(file) {
  var ssid_old = ssid;
  var stdout = child_process.execFileSync(airport, ["-I"] ).toString();
  var lines = stdout.split("\n");
  var no_match = true;
  lines.forEach((line) => {
    var match = line.match(/ SSID: (.*)/);
    if(match) {
      ssid = match[1];
      console.log(ssid);
    }
    no_match = no_match && !match;
  });

  if(no_match) { // fall through for ethernet or USB tether
    console.log
    ssid = '';
  }

  if(ssid_old == ssid) return;
  console.log(`SSID changed: ${ssid_old} => ${ssid}`);
  var data = YAML.load(file);
  for (let key in data) {
    var match = ssid.match(key);
    if(match) {
      console.log(`"${key}" matched SSID "${ssid}"`);
      var osascript = `osascript -e "tell application \\"Messages\\" to set the status message to \\"${data[key]}\\""`;
      console.log(osascript);
      child_process.exec(osascript, () => {});
      break;
    }
  }
}

/*!
 * Helper functions
 */

function help() {
    console.log([
        '',
        'Usage: ' + name + ' [file]',
        '',
        'Options:',
        '  -h, --help           output usage information',
        '  -v, --version        output version number',

        ''
    ].join('\n'));
}

function version() {
    var packagePath = path.join(__dirname, '..', 'package.json'),
        packageJSON = JSON.parse(fs.readFileSync(packagePath), 'utf8');

    console.log(packageJSON.version);
}
