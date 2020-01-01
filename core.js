/**
 * @author Paras Sahu <parasworkspace@gmail.com>
 * @package To Do App Starter Services
 */

// Global base directory
global.__base = __dirname + '/';

// Default Max Listeners to avoid memory leak
require('events').EventEmitter.defaultMaxListeners = 50;

// Config and File system modules
const fs = require("fs");
const moment = require('moment');

// load uncached module
const requireUncached = module => {
  delete require.cache[require.resolve(module)]
  return require(module)
}

let config = require(__base + 'config.js');

var log = console.log;
console.log = function(){
  log.apply(
    console, ['\n \x1b[36m[' + 
  moment().format('dddd, MMMM Do YYYY, h:mm:ss a') + 
  ']\x1b[0m \n\n'].concat(arguments[0]));
};

// LOGS
if (config.app.environment != 'development') {
  let dir = './logs';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  if (fs.existsSync(config.app.server.logs.path.debuglog)) {
    fs.renameSync(config.app.server.logs.path.debuglog, config.app.server.logs.path.debuglog + '-' + (moment().format('YYYY, MMMM Do, h:mm:ss a')) + '.bk');
  }
  let access = fs.createWriteStream(config.app.server.logs.path.debuglog);
  process.stdout.write = process.stderr.write = access.write.bind(access);
}

// Including required node modules
const https = require('https'),
  express = require('express'),
  app = express(),
  cors = require('cors'),
  server = https.createServer({
    // REQUIRED KEY, CERTIFICATE and CA file for HTTPS SETUP
    key: fs.readFileSync(
      config.app.server.ssl.certificate.key
    ),
    cert: fs.readFileSync(
      config.app.server.ssl.certificate.pem
    ),
    ca: (config.app.server.ssl.certificate.ca != false)
      ? fs.readFileSync(config.app.server.ssl.certificate.ca) : false,
    rejectUnauthorized: config.app.server.ssl.certificate.rejectUnauthorized
  }, app),
  // WS PATH CONFIGURATION - Conditional behaviour as per Reverse proxy VALUE
  wsPath = (config.app.is_proxy) ? 
  { wsEngine: 'ws', path: '/node-core' } : '',
  io = require('socket.io').listen(server, wsPath),
  bodyParser = require('body-parser'),
  serverPort = config.app.server.port,
  
  // MIDDLEWARES
  requestParser = require('./middlewares/request-parser'),
  authCheck = require('./middlewares/auth'),
  
  // ROUTES
  login = require('./routes/login'),
  toDo = require('./routes/to-do');

app.use(cors());

// parse application/json
app.use(bodyParser.raw({ 
  type: config.app.headers.contentType
}));

app.use(requestParser);
app.use('/login', login);

app.use(authCheck);
app.use('/todo', toDo);

app.use(function (err, req, res, next) {
  //if(!err.statusCode) err.statusCode = 500;
  console.log(err.stack);
  res.status(401).send('<h2>Unauthorized Access !</h2>');
});

// Disabling  x-powered-by Response header of Express HTTP Server
app.disable('x-powered-by');

const socketAuth = function socketAuth(socket, next) {
  try {
    let access_token = socket.handshake.query.access_token;
  } catch (e) {
    e.getMessage();
    return next(new Error(JSON.stringify({
      status: false,
      message: "Not Authenticated",
      data: [],
      response_tag: 1
    })));
  }
  return next();
};

// // CONSTANT FOR ALL SERVICES
const ioPrefix = config.app.is_proxy ? '/' + 
config.app.server.proxy.core : '';

/** Starting to listen Express HTTP Server on defined port (in config.js) */
server.listen(serverPort, () => {
  log('Server started listening on port = ' + serverPort);
}); // starting web server

module.exports = server;