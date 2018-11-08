var debug = require('debug')('botkit:incoming_webhooks');

module.exports = function(webserver, controller) {

    debug('Configured POST /facebook/receive url for receiving events');
    webserver.post('/facebook/receive', function(req, res) {

        // NOTE: we should enforce the token check here

        // respond to Slack that the webhook has been received.
        res.status(200);
        res.send('ok');

        var bot = controller.spawn({});

        // log
        var data = req.body;
        data.entry.forEach(function(entry) {
          var pageID = entry.id;
          var timeOfEvent = entry.time;
          console.log('pageID: ' + pageID + ' time: ' + timeOfEvent);

          // Iterate over each messaging event
          entry.messaging.forEach(function(event) {
            if (event.message) {
              console.log('message: ', event);
            } else if (event.postback) {
              console.log('postback: ', event);   
            } else if (event.account_linking) {
              console.log('account linking: ', event);
            } else {
              console.log("unknown event: ", event);
            }
          });
        });

        // Now, pass the webhook into be processed
        controller.handleWebhookPayload(req, res, bot);

    });

    debug('Configured GET /facebook/receive url for verification');
    webserver.get('/facebook/receive', function(req, res) {
        if (req.query['hub.mode'] == 'subscribe') {
            if (req.query['hub.verify_token'] == controller.config.verify_token) {
                res.send(req.query['hub.challenge']);
            } else {
                res.send('OK');
            }
        }
    });

}
