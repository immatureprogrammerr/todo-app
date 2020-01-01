const express = require('express'),
  router = express.Router(),
  config = require(__base + 'config'),
  callAndResponse = require(__base + 
    'components/core/to-do/callAndResponse'),
  DVStatus = require(__base + 'components/core/helper/http-status-codes');

module.exports = () => {
  return {
    list: (userId, callback) => {
      listFn(userId, (e, r) => {
        if (e) {
          callback(e, null);
        }
        if (r) {
          callback(null, r);
        } else {
          callback(null, 'No tasks found');
        }
      });
    },
    create: (postData, callback) => {
      createFn(postData, (e, r) => {
        if (e) {
          callback(e, null);
        }
        if (r) {
          callback(null, r);
        } else {
          callback(null, 'No tasks found');
        }
      });
    },
    delete: (postData, callback) => {
      deleteFn(postData, (e, r) => {
        if (e) {
          callback(e, null);
        }
        if (r) {
          callback(null, r);
        } else {
          callback(null, 'No tasks found');
        }
      });
    }
  }
};

const listFn = async (userId, callback) => {
  try {
    if (typeof type == 'undefined') {
      const list = await callAndResponse.getToDoList(userId);
      callback(null, list);
    }
  } catch (e) {
    console.log(e.stack);
    callback(e, null);
  }
};

const createFn = async (postData, callback) => {
  try {
    if (typeof type == 'undefined') {
      const list = await callAndResponse.createToDo(postData);
      callback(null, list);
    }
  } catch (e) {
    console.log(e.stack);
    callback(e, null);
  }
};

const deleteFn = async (postData, callback) => {
  try {
    if (typeof type == 'undefined') {
      const list = await callAndResponse.deleteToDo(postData);
      callback(null, list);
    }
  } catch (e) {
    console.log(e.stack);
    callback(e, null);
  }
};