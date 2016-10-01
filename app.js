

var express = require('express');
var http = require('http');
var socketIO = require('socket.io');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs  = require('express-handlebars');

var routes = require('./routes/index');

var app = express();
var server = http.Server(app);
var io = socketIO(server);

var env = process.env.NODE_ENV || 'development';
app.locals.ENV = env;
app.locals.ENV_DEVELOPMENT = env == 'development';

// view engine setup

app.engine('handlebars', exphbs({
  defaultLayout: 'main',
  partialsDir: ['views/partials/']
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');

// app.use(favicon(__dirname + '/public/img/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace

if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err,
            title: 'error'
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {},
        title: 'error'
    });
});

var lastSocketId;
var opponentMap = {};

io.on('connection', function (socket) {
  function handleConnection () {
      if(!lastSocketId) {
          lastSocketId = socket.id;
      } else {
          opponentMap[lastSocketId] = socket.id;
          opponentMap[socket.id] = lastSocketId;
          var second = Math.floor(Math.random() + 1) ? lastSocketId : socket.id;
          lastSocketId = undefined;

          io.to(second).emit('battleship:challenge-accepted');
      }
  }
  handleConnection();
    
  socket.on('battleship:message', function (data) {
    if(data && data.message === 'battleship:reset') {
        opponentMap[opponentMap[socket.id]] = undefined;
        opponentMap[socket.id] = undefined;
        handleConnection();
    } else if(opponentMap[socket.id] && data && data.message) {
        io.to(opponentMap[socket.id]).emit(data.message, data.data);
    }
  });
});

var port = process.env.PORT || 80;
server.listen(process.env.PORT || 80);
console.log('listening on port ' + port);

module.exports = app;
