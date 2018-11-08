/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Facebook bot built with Botkit.

# RUN THE BOT:
  Follow the instructions here to set up your Facebook app and page:
    -> https://developers.facebook.com/docs/messenger-platform/implementation
  Run your bot from the command line:
    page_token=<MY PAGE TOKEN> verify_token=<MY_VERIFY_TOKEN> node bot.js



~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
var env = require('node-env-file');
env(__dirname + '/.env');


if (!process.env.page_token) {
    console.log('Error: Specify a Facebook page_token in environment.');
    usage_tip();
    process.exit(1);
}

if (!process.env.verify_token) {
    console.log('Error: Specify a Facebook verify_token in environment.');
    usage_tip();
    process.exit(1);
}

var bot_options = {
    verify_token: process.env.verify_token,
    access_token: process.env.page_token,
    studio_token: process.env.studio_token,
    studio_command_uri: process.env.studio_command_uri,
    studio_stats_uri: process.env.studio_command_uri,
    replyWithTyping: true,
};

// Use a mongo database if specified, otherwise store in a JSON file local to the app.
// Mongo is automatically configured when deploying to Heroku
if (process.env.MONGO_URI) {
  // create a custom db access method
  var db = require(__dirname + '/components/database.js')({});
  bot_options.storage = db;
} else {
    bot_options.json_file_store = __dirname + '/.data/db/'; // store user data in a simple JSON format
}


var Botkit = require('botkit');
var debug = require('debug')('botkit:main');

var botType = process.env.bot_type;

var controller = null;

// Create the Botkit controller, which controls all instances of the bot.

if (botType == 'facebook') { 
    console.log ('starting facebook bot');
    controller = Botkit.facebookbot(bot_options);
    // Set up an Express-powered webserver to expose oauth and webhook endpoints
    var webserver = require(__dirname + '/components/express_webserver.js')(controller, botType);
    // Tell Facebook to start sending events to this application
    require(__dirname + '/components/subscribe_events.js')(controller);
    // Set up Facebook "thread settings" such as get started button, persistent menu
    require(__dirname + '/components/thread_settings.js')(controller);
    // Send an onboarding message when a user activates the bot
    require(__dirname + '/components/onboarding.js')(controller);
    // Load in some helpers that make running Botkit on Glitch.com better
    require(__dirname + '/components/plugin_glitch.js')(controller);
} else {
    console.log ('starting socket bot');
    controller = Botkit.socketbot(bot_options);
    // Set up an Express-powered webserver to expose oauth and webhook endpoints
    var webserver = require(__dirname + '/components/express_webserver.js')(controller, botType);
    console.log ('starting socket bot 1');
    // Load in some helpers that make running Botkit on Glitch.com better
    require(__dirname + '/components/plugin_glitch.js')(controller);
    // Load in a plugin that defines the bot's identity
    require(__dirname + '/components/plugin_identity.js')(controller);
    // enable advanced botkit studio metrics
    // and capture the metrics API to use with the identity plugin!
    controller.metrics = require('botkit-studio-metrics')(controller);
    console.log ('starting socket bot 2');
    // Open the web socket server
    controller.openSocketServer(controller.httpserver);
    console.log ('starting socket bot 3');
    // Start the bot brain in motion!!
    controller.startTicking();    
    console.log ('starting socket bot 4');
}



var normalizedPath = require("path").join(__dirname, "skills");
require("fs").readdirSync(normalizedPath).forEach(function(file) {
  require("./skills/" + file)(controller);
});


function usage_tip() {
    console.log('~~~~~~~~~~');
    console.log('Botkit Studio Starter Kit');
    console.log('Execute your bot application like this:');
    console.log('page_token=<MY PAGE TOKEN> verify_token=<MY VERIFY TOKEN> studio_token=<MY BOTKIT STUDIO TOKEN> node bot.js');
    console.log('Get Facebook token here: https://developers.facebook.com/docs/messenger-platform/implementation')
    console.log('Get a Botkit Studio token here: https://studio.botkit.ai/')
    console.log('~~~~~~~~~~');
}
