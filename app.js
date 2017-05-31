// modules =================================================
var express        = require('express');
var app            = express();
var mongoose       = require('mongoose');
mongoose.Promise = require('bluebird'); //TODO: Added 8/12/16 to account for Mongoose's Deprecated Promise Lib
var bodyParser     = require('body-parser');
var methodOverride = require('method-override');
var path = require('path');
var favicon = require('static-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
//var session = require('express-session')

// added comment for testing of creating a branch
// added another comment for testing of creating a branch
// comment added on 05/17 at 3:38 pm
// comment added on 05/17 at 4:06 pm
// comment added on 05/31 at 2:09 pm
const http = require('http');
const https = require('https');
const fs = require('fs');

var flash = require('connect-flash');
var winston = require('winston');

// configuration ===========================================
var config = {};
config = require('./config/config');

var port = process.env.PORT || config.web.port;
var apiPrefix = config.web.apiPrefix;

winston.level = config.logging.level;
var logger = new (winston.Logger)({
    datePattern: config.logging.datePattern,
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: config.logging.filename, maxsize: config.logging.maxsize, maxFiles: config.logging.maxFiles})
    ]
});

//TODO: FUll list
// Table indexes
// Log Rotation
// Logout timer
// Phases - us?vgm? other?
// filter all request via single method below (uid headers, etc)
// modular code
// alerts moved but auto scroll (OK?)
// Reviews Pages

app.use(bodyParser.json()); // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(methodOverride('X-HTTP-Method-Override')); // override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT

app.set('trust proxy', 1) // trust first proxy

app.use(express.static(__dirname + '/public')); // set the static files location
app.use('/bower_components',  express.static(__dirname + '/bower_components'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, '/public/views'));

var router = express.Router();
var routes = require('./app/routes')(app, config, logger); // pass our application into our routes

// db ==================================================
try{
    var Schema = mongoose.Schema;

    var AdminAccount = require("./app/models/AdminAccount");
    var Employee = require("./app/models/Employee"); //TODO: Remove if not used.
    var EmployeeInfo = require("./app/models/EmployeeInfo");
    var Location = require("./app/models/Location");
    var Question = require("./app/models/Question"); //TODO: Remove if not used.
    var Report = require("./app/models/Report");
    var Review = require("./app/models/Reviews");
    var Role = require("./app/models/Role");
    var Salary = require("./app/models/Salary"); //TODO: Remove if not used.
    var Setting = require("./app/models/Setting");

    var dbUri = config.mongo.dbUri;
    mongoose.connect(dbUri);
    var db = mongoose.connection;
    db.on('error', function(cb){ logger.error("Error connecting to Mongo DB (master): " + cb); });
    db.once('open', function (callback) { logger.info("MongoDB Connection Established(master)!") });
}
catch(dbEx){
    logger.error("Exception connecting to Mongo DB: " + dbEx)
}


// routes ==================================================
var router = express.Router();

//console.log(db)
var routes = require('./app/routes')(app, config, logger); // pass our application into our routes
var auth_routes = require('./app/routes/auth.js')(config, db);
//var data_routes = require('./app/routes/data.js')(config, db);

var data_adminAccounts_routes = require('./app/routes/data/adminAccounts.js')(config, db, logger, router);
var data_employeeInfo_routes = require('./app/routes/data/employeeInfo.js')(config, db, logger, router);
var data_employees_routes = require('./app/routes/data/employees.js')(config, db, logger, router);
var data_locations_routes = require('./app/routes/data/locations.js')(config, db, logger, router);
var data_misc_routes = require('./app/routes/data/misc.js')(config, db, logger, router);
var data_questions_routes = require('./app/routes/data/questions.js')(config, db, logger, router);
var data_reports_routes = require('./app/routes/data/reports.js')(config, db, logger, router);
var data_reviews_routes = require('./app/routes/data/reviews.js')(config, db, logger, router);
var data_roles_routes = require('./app/routes/data/roles.js')(config, db, logger, router);
var data_settings_routes = require('./app/routes/data/settings.js')(config, db, logger, router);

//app.all('/*', function(req, res, next) {
//    // CORS headers
//    res.header("Access-Control-Allow-Origin", "*"); // restrict it to the required domain
//    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
//    res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key,Origin, X-Requested-With');// Set custom headers for CORS
//
//    console.log("all")
//    console.log("---")
//    console.log("all")
//    if (req.method == 'OPTIONS') {
//      res.status(200).end();
//    } else {
//        var uid = req.headers.uid;
//        var url = req.url;
//        if (req.url.indexOf('api')>-1){
//            if (uid){
//                //TODO: Ensure it is a valid UID
//                next();
//            }
//        }
//        else{
//            next();
//        }
//    }
//});


app.use('/api/auth', auth_routes);
//app.use('/api/data', data_routes);
app.use('/api/data', data_adminAccounts_routes);
app.use('/api/data', data_employeeInfo_routes);
app.use('/api/data', data_employees_routes);
app.use('/api/data', data_locations_routes);
app.use('/api/data', data_misc_routes);
app.use('/api/data', data_questions_routes);
app.use('/api/data', data_reports_routes);
app.use('/api/data', data_reviews_routes);
app.use('/api/data', data_roles_routes);
app.use('/api/data', data_settings_routes);
app.use('/', routes);

// start app ===============================================
//app.set('port', port);

const options = {
  key: fs.readFileSync('privatekey.pem'),
  cert: fs.readFileSync('server.crt')
};

app.listen(port);
console.log('App Started on port: ' + port);

exports = module.exports = app;