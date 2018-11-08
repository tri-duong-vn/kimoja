var express = require('express');
var bodyParser = require('body-parser');
var querystring = require('querystring');
var debug = require('debug')('botkit:webserver');
var http = require('http');
var fs = require('fs');
var hbs = require('express-hbs');


module.exports = function(controller, botType) {

    var webserver = express();
    webserver.use(bodyParser.json());
    webserver.use(bodyParser.urlencoded({ extended: true }));

    // set up handlebars ready for tabs
    if (botType != 'facebook') { 
        webserver.engine('hbs', hbs.express4({partialsDir: __dirname + '/../views/partials'}));
        webserver.set('view engine', 'hbs');
        webserver.set('views', __dirname + '/../views/');
    }
    // import express middlewares that are present in /components/express_middleware
    var normalizedPath = require("path").join(__dirname, "express_middleware");
    fs.readdirSync(normalizedPath).forEach(function(file) {
        require("./express_middleware/" + file)(webserver, controller);
    });

    webserver.use(express.static('public'));

    if (botType == 'facebook') { 
        webserver.listen(process.env.PORT || 3000, null, function() {
            debug('Express webserver configured and listening at http://localhost:' + process.env.PORT || 3000);
        });
    } else {
        var server = http.createServer(webserver);
        server.listen(process.env.PORT || 3000, null, function() {
            debug('Express webserver configured and listening at http://localhost:' + process.env.PORT || 3000);
        });
    }

    if (botType == 'facebook') { 
        var normalizedPath = require("path").join(__dirname, "routes");
        require("./routes/facebook")(webserver, controller);
    } else {
        var normalizedPath = require("path").join(__dirname, "routes");
        fs.readdirSync(normalizedPath).forEach(function(file) {
          require("./routes/" + file)(webserver, controller);
        });
    }

    controller.webserver = webserver;
    if (botType != 'facebook') { 
        controller.httpserver = server;
    }

    return webserver;

}
