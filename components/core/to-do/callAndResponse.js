const config = require(__base + "config"),
  sql = require(__base + "components/db-master/sql-queries"),
  isValidJSON = require("is-valid-json");

const callAndResponse = {
  getToDoList: async userId => {
    let tableName = "task_list";
    console.log("tableName = " + tableName);
    return new Promise((resolve, reject) => {
      try {
        console.log("Entered in try block");
        sql.select(
          tableName,
          ["task_id", "title"],
          {
            where: {
              user_id: userId,
              is_active: 1,
              is_deleted: 0
            }
          },
          (e, r) => {
            if (e) {
              reject(e.stack);
            }
            // console.log(r);
            if (r && Array.isArray(r) && r.length > 0) {
              resolve(r);
            } else {
              resolve(false);
            }
          }
        );
      } catch (e) {
        console.log(e.stack);
        reject(e.stack);
      }
    });
  },
  createToDo: async postData => {
    let tableName = "task_list";
    return new Promise((resolve, reject) => {
      try {
        sql.insert(
          tableName,
          {
            title: postData.title,
            user_id: 1 /** It will be fetched by access token via which user logged-in */
          },
          (e, r) => {
            if (e) {
              reject(e.stack);
            }
            // console.log(r);
            if (r && Array.isArray(r) && r.length > 0) {
              resolve(r);
            } else {
              resolve(false);
            }
          }
        );
      } catch (e) {
        console.log(e.stack);
        reject(e.stack);
      }
    });
  },
  deleteToDo: async postData => {
    let tableName = "task_list";
    return new Promise((resolve, reject) => {
      try {
        sql.delete(
          tableName, {
            where: {
              task_id: postData.todoID
            }
          }, {
            is_deleted: 1
          },
          (e, r) => {
            if (e) {
              reject(e.stack);
            }
            // console.log(r);
            resolve(r);
          }
        );
      } catch (e) {
        console.log(e.stack);
        reject(e.stack);
      }
    });
  }
};

module.exports = callAndResponse;
