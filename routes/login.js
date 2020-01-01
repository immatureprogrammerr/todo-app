let express = require('express'),
jwt = require('jsonwebtoken'),
config = require(__base + 'config'),
router = express.Router(),
sql = require(__base + 
  'components/db-master/sql-queries'),
ResStatus = require(__base + 
  'components/core/helper/http-status-codes');

/* POST :::: Login */
router.post('/', (req, res, next) => {
  const postData = req.body;
    const user = {
        "email": postData.email,
        "password": postData.password
    };
    // do the database authentication here, with user name and password combination.
    const token = jwt.sign(
      user, 
      config.app.secret, (err, token) => {
        res.json({
          token
        });
      });
});

router.get('*', function(req, res){
  res
  .status(ResStatus.NOT_FOUND)
  .send({
    status: false,
    message: ResStatus.getMessage(ResStatus.NOT_FOUND,
    'To Do'),
    data: [],
    response_tag: ResStatus.NOT_FOUND
  });
});

/* Middleware for error handling */
router.use((err, req, res, next) => {
  console.log(err.stack);
  res
  .status(ResStatus.INTERNAL_SERVER_ERROR)
  .send({
    status: false,
    message: ResStatus.getMessage(ResStatus.INTERNAL_SERVER_ERROR,
    'Flight Stats - Time Table'),
    data: JSON.stringify([err.stack]),
    response_tag: ResStatus.INTERNAL_SERVER_ERROR
  });
});

/* Exporting module */
module.exports = router;