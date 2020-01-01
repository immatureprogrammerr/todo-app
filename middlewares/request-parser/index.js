let isJSON    = require('is-valid-json'),
DVStatus = require(__base + 
  'components/core/helper/http-status-codes');
module.exports = (req, res, next) => {
  if(req.get('content-type').indexOf('application/vnd.paras.v1+json') != 0) {
    res.status(406).send();
  } else {
    if(req.method!=='GET' && req.method!=='DELETE') {
      let body = (req.body).toString();
      if(isJSON(body)) {
        req.body = JSON.parse(body);
        next();
      } else {
          res
          .status(DVStatus.NOT_ACCEPTABLE)
          .send({
              status: false,
              message: DVStatus.getMessage(DVStatus.REQUEST_BODY_NOT_ACCEPTABLE,
              'Request'),
              description: 'Request body is not a valid JSON',
              data: [],
              response_tag: DVStatus.REQUEST_BODY_NOT_ACCEPTABLE
          });   
        }
    } else {
      console.log('Entered in else condition @ oneauth rp middleware');
      next();
    }
  }
};