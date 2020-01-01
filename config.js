const fs = require('fs');
let externalCredentials, databaseCredentials;

module.exports = ( () => {
  externalCredentials = JSON.parse(fs.readFileSync(
    './server-config/app-config.json'));
  databaseCredentials = JSON.parse(fs.readFileSync(
    './server-config/database-config.json'));
  return {
    boot: {
      retryTime: 3 // in seconds
    },
    sql: {
      host: databaseCredentials.app.host,
      user: databaseCredentials.app.user,
      password: databaseCredentials.app.password,
      database: databaseCredentials.app.database,
      pool: {
        min: databaseCredentials.app.pool.min,
        max: databaseCredentials.app.pool.max
      },
      debugmode: false,
      port: databaseCredentials.app.port,
      multipleStatements: true
    },
    app: {
      environment: externalCredentials.environment,
      server: {
        port: externalCredentials.app.core,
        logs: {
          path: {
            accesslog: './logs/access_log.log',
            debuglog: './logs/team_debug.log'
          }
        },
        ssl: {
          certificate: {
            key: externalCredentials.certificates.key,
            pem: externalCredentials.certificates.cert,
            ca: externalCredentials.certificates.ca,
            requestCert: externalCredentials.app.requestCert,
            rejectUnauthorized: externalCredentials.app.rejectUnauthorized
          },
        },
        proxy: {
          core: externalCredentials.app.proxy.core,
          hcore: externalCredentials.app.proxy.http.core
        },
        protocol: externalCredentials.app.request_scheme
      },
      headers: {
        contentType: 'application/vnd.paras.v1+json'
      },
      is_proxy: externalCredentials.app.is_proxy,
      proxy: {
        core: externalCredentials.app.proxy.core
      }
    }
  }
})();