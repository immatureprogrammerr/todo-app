let express = require('express'),
router = express.Router(),
config = require(__base + 'config'),
jwt = require('jsonwebtoken'),
sql = require(__base + 
  'components/db-master/sql-queries'),
toDo = require(__base + 
  'components/core/to-do')({}),
ResStatus = require(__base + 
  'components/core/helper/http-status-codes');

/* GET :::: To Do List */
router.get('/', (req, res, next) => {
  jwt.verify(req.token, config.app.secret, (err, authData) => {
    if(err) {
      res
      .status(ResStatus.UNAUTHORIZED)
      .send({
          status: false,
          message: 'Request Unauthorized',
          description: '',
          data: [],
          response_tag: ResStatus.UNAUTHORIZED
      });
    } else {
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
            response_tag: authData
          });
        }
      });
    }
  });
});

/* POST :::: Create a To Do */
router.post('/', (req, res, next) => {
  jwt.verify(req.token, config.app.secret, (err, authData) => {
    if(err) {
      res
      .status(ResStatus.UNAUTHORIZED)
      .send({
          status: false,
          message: 'Request Unauthorized',
          description: '',
          data: [],
          response_tag: ResStatus.UNAUTHORIZED
      });
    } else {
      let title = req.body.title;
      toDo.create({
        title
      }, (e, r) => {
        if(e) {
          console.log(e);
          res
          .status(ResStatus.RECORD_CREATION_FAILURE)
          .send({
            status: false,
            message: ResStatus.getMessage(ResStatus.RECORD_CREATION_FAILURE,
            'To Do'),
            data: [JSON.stringify(e)],
            response_tag: ResStatus.RECORD_CREATION_FAILURE
          });
        }
        if(r) {
          res
          .status(ResStatus.RECORD_CREATION_SUCCESS)
          .send({
            status: true,
            message: ResStatus.getMessage(ResStatus.RECORD_CREATION_SUCCESS,
            'To Do'),
            data: '',
            response_tag: authData
          });
        }
      });
    }
  });
});

/* POST :::: Delete To Do */
router.delete('/:todoID', (req, res, next) => {
  jwt.verify(req.token, config.app.secret, (err, authData) => {
    if(err) {
      res
      .status(ResStatus.UNAUTHORIZED)
      .send({
          status: false,
          message: 'Request Unauthorized',
          description: '',
          data: [],
          response_tag: ResStatus.UNAUTHORIZED
      });
    } else {
      let todoID = req.params.todoID;
      toDo.delete({
        todoID
      }, (e, r) => {
        if(e) {
          console.log(e);
          res
          .status(ResStatus.RECORD_DELETION_FAILURE)
          .send({
            status: false,
            message: ResStatus.getMessage(ResStatus.RECORD_DELETION_FAILURE,
            'To Do'),
            data: [JSON.stringify(e)],
            response_tag: ResStatus.RECORD_DELETION_FAILURE
          });
        }
        if(r) {
          res
          .status(ResStatus.RECORD_DELETION_SUCCESS)
          .send({
            status: true,
            message: ResStatus.getMessage(ResStatus.RECORD_DELETION_SUCCESS,
            'To Do'),
            data: r,
            response_tag: authData
          });
        }
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