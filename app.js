
/**
 * Dependencies
 */

var cookieParser = require('cookie-parser'),
    bodyParser   = require('body-parser'),
    config       = require('./config'),
    express      = require('express'),
    logger       = require('morgan'),
    path         = require('path');

var mongoose = require('mongoose'),
    app      = express();

/**
 * Routes
 */

var routes = require('./routes/index'),
    api    = require('./routes/api');

mongoose.connect(config.mongoURI);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/api', api);

/**
 * 404 handler
 */
app.use(function(req, res, next) {

    return res.status(404).end();

});

/**
 * 5xx handler
 */
app.use(function(err, req, res, next) {

    res.status(err.status || 500);
    return res.end();

});

module.exports = app;
