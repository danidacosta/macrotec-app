var createError = require('http-errors');
var express = require('express');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var path = require('path');
var app = express();
var bodyParser = require("body-parser");
var logger = require('morgan');
var sassMiddleware = require('node-sass-middleware');
var mysql = require('mysql');
const request = require('./routes/api/connect');
var connection = mysql.createConnection(request);
var flash = require('connect-flash');

var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;

app.use(expressSession({secret: 'mySecretKey'})); 
app.use(flash());

passport.use(new LocalStrategy({
  passReqToCallback : true
},
  function(req, username, password, done) {
    connection.connect();
    connection.query('SELECT username, password FROM users WHERE username = "'+ username +'" AND password = "'+ password +'";',
    function(err,rows){
      if (err)
          return done(err);
       if (!rows.length) {
          return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash
      } 
    if (!( rows[0].password == password))
      return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
    connection.end();
    return done(null, rows[0]);
  });
}));

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});
  
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(sassMiddleware({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: true, // true = .sass and false = .scss
  sourceMap: true
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('*/assets',express.static(path.join(__dirname, 'public/assets')));
app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



module.exports = app;
