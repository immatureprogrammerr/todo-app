let express = require('express'),
router = express.Router(),
sql = require(__base + 
  'components/db-master/sql-queries'),
toDo = require(__base + 
  'components/core/to-do')({}),
ResStatus = require(__base + 
  'components/core/helper/http-status-codes');

/* GET :::: To Do List */
router.get('/list/', (req, res, next) => {
  toDo.list(userId = 1, (e, r) => {
    if(e) {
      console.log(e);
      res
      .status(ResStatus.OK)
      .send({
        status: false,
        message: ResStatus.getMessage(ResStatus.OK,
        'To Do'),
        data: [JSON.stringify(e)],
        response_tag: ResStatus.OK
      });
    }
    if(r) {
      res
      .status(ResStatus.OK)
      .send({
        status: true,
        message: ResStatus.getMessage(ResStatus.OK,
        'To Do'),
        data: r,
        response_tag: ResStatus.OK
      });
    }
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