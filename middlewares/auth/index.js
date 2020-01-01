let config = require(__base + 'config'),
//oneAuth = require(__base + 'components/one-auth/')({}),
ResStatus = require(__base + 'components/core/helper/http-status-codes'),
log = require(__base + 'components/logger').consoleLog;

module.exports = (req, res, next) => {
  
  // Get auth header value
  const bearerHeader = req.headers['authorization'];

  // Check if bearer is undefined
  if(typeof bearerHeader !== 'undefined') {
    // Split at the space
    const bearer = bearerHeader.split(' ');
    // Get token from array
    const bearerToken = bearer[1];
    // Set the token
    req.token = bearerToken;
    // Next middleware
    next();

  } else {
    // Forbidden
    res
    .status(ResStatus.UNAUTHORIZED)
    .send({
        status: false,
        message: 'Request Unauthorized',
        description: '',
        data: [],
        response_tag: ResStatus.UNAUTHORIZED
    });
  }
};

// FORMAT OF TOKEN
// Authorization: Bearer <access_token>