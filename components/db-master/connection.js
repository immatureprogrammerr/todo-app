/* **** DATABASE CONNECTION **** */

/* Component for Database Connectivity
*  is for providing a Database Object to, then Controller
*  assign it to any module it wants.
*/

let log = require(__base + 'components/logger').consoleLog;

const requireUncached = module => {
  delete require.cache[require.resolve(module)]
  return require(module)
}

let config  = requireUncached(__base + '/config'),
db          = requireUncached('knex')({
    client: 'mysql',
    connection: {
      host: config.sql.host,
      user: config.sql.user,
      password: config.sql.password,
      database: config.sql.database,
      debug: config.sql.debugmode,
      port: config.sql.port
    },
    pool: {
        min: config.sql.pool.min,
        max: config.sql.pool.max
    },
    log: {
      warn(message) {
        log(message, 'info');
      },
      error(message) {
        log(message, 'error');
      },
      deprecate(message) {
        log(message, 'info');
      },
      debug(message) {
        log(message, 'debug');
      },
    }
});
module.exports = db;
