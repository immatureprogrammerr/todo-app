const requireUncached = module => {
  delete require.cache[require.resolve(module)]
  return require(module)
}

let dbObj = requireUncached('./connection'),
logger = requireUncached(__base + 'components/logger').log(),
logFormat = requireUncached(__base + 'components/logger').format,
log = require(__base + 'components/logger').consoleLog;

module.exports = {
	select: (tableName, what, conditions, callback) => {
		let querySelect = dbObj.select(what)
			.from(tableName);
		if (conditions && conditions.where) {
			querySelect = querySelect.where(conditions.where);
		}
		if (conditions && conditions.whereE) {
			(conditions.whereE).forEach((item) => {
				querySelect.where(item.f, item.m, item.l);
			});
		}
		if(conditions && conditions.orderBy) {
			if(conditions.orderBy.colName && conditions.orderBy.order) {
				querySelect.orderBy(conditions.orderBy.colName, conditions.orderBy.order);
			}
		}
		if(conditions && conditions.between) {
			if(conditions.between.colName && conditions.between.range) {
				querySelect.whereBetween(conditions.between.colName, conditions.between.range);
			}
		}
		if(conditions && conditions.limit) {
			if(conditions.limit.hasOwnProperty('noOfRecords') && conditions.limit.hasOwnProperty('offset')) {
				querySelect.limit(conditions.limit.noOfRecords).offset(conditions.limit.offset);
			}
		}
		console.log(querySelect.toString());
		querySelect.then((rows) => {
			console.log(rows);
			callback(null, rows); 
		})
    .catch((err) => {
			console.log(err);
      callback(err, null);
    });
	},
	selectDistinct: (tableName, what, conditions, callback) => {
		let querySelect = dbObj(tableName)
		.distinct(what)
		.select();
		if (conditions && conditions.where) {
			querySelect = querySelect.where(conditions.where);
		}
		if (conditions && conditions.whereE) {
			(conditions.whereE).forEach((item) => {
				querySelect.where(item.f, item.m, item.l);
			});
		}
 		querySelect.then((rows) => {
			callback(null, rows); 
		})
    .catch((err) => {
        callback(err, null);
    });
	},
	insert: (tableName, insertParam, callback) => {
		try {
			dbObj(tableName)
			//.returning('id')
			.insert(insertParam)
			.then(function (idAry) {
				try {
					if(typeof idAry[0] != 'undefined') {
						callback(null, idAry[0]);
						return;
					}
				} catch(err) {
					logger.log({level: 'debug', message: err});
				}

				callback(null, idAry);
			})
			.catch((err) => {
				console.log(err);
				callback(err, null);
			});
		} catch(err) {
			logger.log({level: 'error', message: err.stack});
		}
	},
	update: (tableName, conditions, updateParam, callback) => {
		let queryUpdate = dbObj(tableName)
		if (conditions && conditions.where) {
			queryUpdate.where(conditions.where);
		}
		if ("where_in" in conditions) {
			queryUpdate.whereIn(
				conditions.where_in.key,
				conditions.where_in.value
			);
		}
		if (conditions && conditions.whereE) {
			(conditions.whereE).forEach((item) => {
				queryUpdate.where(item.f, item.m, item.l);
			});
		}
		queryUpdate.update(updateParam)
		.then(function (rows) {
			callback(null, rows);
		})
		.catch((err) => {
			console.log(err);
			callback(err, null);
		});
	},
	delete: (tableName, conditions, updateParam, callback) => {
		let queryDelete = dbObj(tableName);

		if (conditions && conditions.where) {
			queryDelete.where(conditions.where);
		}
		if (conditions && conditions.whereE) {
			(conditions.whereE).forEach((item) => {
				queryDelete.where(item.f, item.m, item.l);
			});
		}
		
		queryDelete.update(updateParam)
			.then(function (rows) {
				callback(null, rows);
			})
			.catch((err) => {
				console.log(err);
				callback(err, null);
			});
	},
	deleteP: (tableName, deleteParam, callback) => {

		dbObj(tableName)
			.where(deleteParam)
			.del()
			.then(function (rows) {
				callback(null, rows);
			})
			.catch((err) => {
				console.log(err);
				callback(err, null);
			});
	},
	bulkInsert: (tableName, insertParam, chunkSize, callback) => {
	try {
		dbObj.batchInsert(tableName, insertParam, 30)
		.then(function (idAry) {
			callback(null, idAry);
		})
		.catch((err) => {
				console.log(err);
				callback(err, null);
			});
		} catch(err) {
			logger.log({level: 'error', message: err.stack});
		}
	},
	updateRecursive: (tableName, items, itemCount, columnForWhere, primaryKey, callback) => {
		try {
			let obj = {};
			obj[primaryKey] = items[itemCount-1];

			let where = {};
			where[columnForWhere] = items[itemCount-1];

			logger.log({level: 'error', message: 'Under updateRecursive'});
			logger.log({level: 'error', message: obj});
			logger.log({level: 'error', message: where});
			logger.log({level: 'error', message: 'primaryKey = ' + primaryKey});
			module.exports.update(tableName, {
				where: where
			}, obj, function(e, r){
					if(err) {
						logger.log({level: 'error', message: err});
					}
					if(itemCount-1 > 0) {
						updateRecursive(tableName, items, itemCount-1, columnForWhere, primaryKey, callback);
					} else {
						callback(null, true);
					}
			});
		} catch(err) {
			logger.log({level: 'error', message: err});
		}
	},
	bulkDelete: (tableName, deleteParam, callback) => {
		dbObj(tableName)
			.whereIn(columnName, deleteParam)
			.del()
			.then(function (rows) {
				callback(null, rows);
			})
			.catch((err) => {
				console.log(err);
				callback(err, null);
			});
	},
  callStoredProcedure: (spNAme, insertParam, callback) => {
		dbObj.raw("Call " + spNAme + "(" + insertParam + ")")
			.then((rows) => {
				callback(null, rows);
			})
			.catch((err) => {
				console.log(err);
				callback(err, null);
			});
	},
	selectmax: (tableName, columnname, callback) => {
		dbObj(tableName)
		.max(columnname)
		.then(function(rows){
			callback(null, rows);
		})
		.catch((err) => {
			console.log(err);
			callback(err, null);
		});
	},
	joinTables: (distinctCols, tableName, what, conditions, joinConditions, callback) => {
		let queryObj = '';
		if (
			distinctCols &&
			typeof distinctCols === 'object' &&
			distinctCols.constructor === Array &&
			distinctCols.length > 0) {
			queryObj = dbObj
				.distinct(distinctCols.join(','))
				.select(what)
				.from(tableName);
		} else {
			queryObj = dbObj
				.select(what)
				.from(tableName);
		}

		joinConditions.forEach((item) => {
        queryObj
            .innerJoin(
                item.tableName,
                item.leftPart,
                item.rightPart
            )
		});
		queryObj
        .where(conditions.where)
        .then((rows) => {
            callback(null, rows);
        }).
        catch((err) => {
            console.log(err);
            callback(err, null);
        });
	},
	raw: (query, callback) => {
		dbObj.raw(query)
		.then((rows) => {
			if(rows && rows.length > 0) {
				callback(null, rows);
			}
		})
		.catch((err) => {
			console.log(err);
			callback('Mysql ERROR: ' + err.toString(), null);
		})
	},
	hasTable: (table, callback) => {
		log('Check for db\'s table existence');
		log(table);
		if(table && typeof table == 'string') {
			if(dbObj.schema && typeof dbObj.schema.hasTable=='function') {
				dbObj.schema.hasTable(table)
				.then(exists => {
					// Informational logs
					log('hasTable then condition executed for table = ' + table);
					log('exists');
					log(exists);

					// Table name exists or not
					// true = table exists, false = table does not exists
					exists ? callback(true) : callback(false);
				})
				.catch((err) => { // Caught error
					log('Error caught in verifying the existence of hasTable through Knex JS database library', 'error');
					log(err, 'error');
					callback(false);
				})
			}
		}
	}		
};
