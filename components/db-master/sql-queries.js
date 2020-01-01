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
	insert: (type, moduleName, insertParam, options={}, callback) => {
		if(type=='general') {
			try {
				let tableName = moduleName + '_' + options.masterTbl;
				dbObj(tableName)
				//.returning('cloud_id')
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
		} else if(type=='master') {
			try {
				if(options.hasOwnProperty('masterTbl')) {
					let assetsTableName = moduleName + '_assets';
					let localeTableName = moduleName + '_locale';
					let masterTableName = moduleName + '_' + options.masterTbl;
					let assetKey = 0;
					let assetInsertParams = [];
						(insertParam.assets).forEach((a) => {
							assetInsertParams.push({
								asset_id: 0,
								asset_key: 0,
								type: a.hasOwnProperty('type') ? a.type : 'image',
								file_path: a.hasOwnProperty('file_path') ? a.file_path : '',
								position: 0,
								hotel_id: a.hasOwnProperty('hotel_id') ? a.hotel_id : 0,
								created_by: a.hasOwnProperty('created_by') ? a.created_by : 0,
							});
						});
						dbObj.batchInsert(assetsTableName, assetInsertParams, 30) // 30 = chunk size
						.returning('asset_id')
						.then(function (idAry) {
							if((Array.isArray(idAry) && idAry.length) > 0) {
								let conditions = {
									where: {
										asset_id: idAry[0]
									}
								};
								let updateParams = {
									asset_key: idAry[0],
									position: idAry[0]
								};
								assetKey = idAry[0]; // Update in assetKey column for the master table entry.
								try {
									module.exports.update(assetsTableName, conditions, updateParams, function(e, r){
										
										if(e) {
											logger.log({level: 'error', message: e});
											callback(e, null);
										}

										if(r) {
											logger.log({level: 'debug', message: 'INSIDE IF CONDITION'});
											let localeInsertParams = [];
											let masterInsertParams = insertParam.master;
											try {
												
												logger.log({level: 'debug', message: insertParam.locale});
												
												let localeFields = {};
												(insertParam.locale).forEach((l) => {
													localeFields = l.fields;
													for(key in localeFields) {
														localeInsertParams.push({
															locale_id: 0,
															lang_code: l.hasOwnProperty('lang_code') ? l.lang_code : 'en',
															string_key: 0,
															string: localeFields[key],
															hotel_id: l.hasOwnProperty('hotel_id') ? l.hotel_id : 0,
															created_by: l.hasOwnProperty('created_by') ? l.created_by : 0
														});
														masterInsertParams[key]
													}
												});
											} catch(err) {
												logger.log({level: 'error', message: err.stack});
												logger.log({level: 'error', message: 'INSIDE IF CONDITION'});
											}

											logger.log({level: 'debug', message: masterInsertParams});
											/* Locale Insertion */
											
											try {
											
											dbObj.batchInsert(localeTableName, localeInsertParams, 30) // 30 = chunk size
											.returning(['locale_id'])
											.then(function (idAry) {
												logger.log({level: 'debug', message: JSON.stringify(idAry)});
												try {
													logger.log({level: 'debug', message: 'Locale returning array'});
													let packLength = localeInsertParams.length - 1;
													logger.log({level: 'debug', message: 'packLength = ' + packLength});
													for(i=0; i<packLength; i++) {
														idAry.push(idAry[0]++);
													}
													idAry.sort();
													logger.log({level: 'debug', message: 'idAry' + JSON.stringify(idAry)});
													if(Array.isArray(idAry) && idAry.length > 0) {
														module.exports.updateRecursiveLocale(localeTableName, idAry, idAry.length, (urE, urR) => {
														if(urR) {
															try {
																let masterInsertParams = insertParam.master;
																let n = 0;
																for(key in (insertParam.locale)[0].fields) {
																	logger.log({level: 'debug', message: '*******KEY******* = ' + key});
																	masterInsertParams[key] = idAry[n];
																	n++;
																}
																
																masterInsertParams['asset_key'] = assetKey;
																dbObj.batchInsert(masterTableName, [masterInsertParams], 30) // 30 = chunk size
																.returning('cloud_id')
																.then(function (idAry) {
																	callback(null, idAry[0]);
																	// let conditions = {
																	// 	where: {
																	// 		cloud_id: idAry[0]
																	// 	}
																	// };
																	// let masterPrimaryKey = options.masterPrimaryKey;
																	// let updateParams = {};
																	// updateParams[options.masterPrimaryKey] = idAry[0];
																	// module.exports.update(masterTableName, conditions, updateParams, function(e, r){
																	// 	logger.log({level: 'debug', message: 'INSIDE this.update'});
																	// 	if(e) {
																	// 		logger.log({level: 'error', message: e});
																	// 		callback(e, null);
																	// 	}
																	// 	callback(null, idAry[0]); // Returning Movie ID.
																	// });
																	// logger.log({level: 'debug', message: 'Success in batch insert of master record'});
																})
																.catch((err) => {
																	logger.log({level: 'error', message: err});
																	callback(err, null);
																});
															} catch(err) {
																logger.log({level: 'error', message: err});
															}
															}
														});
													} else {
														callback(' [ASSETS TABLE] [DATA INSERTION] [ERROR] :: Table name `'+localeTableName+'` :: Returning ID is not in Array format.', null);
														logger.log({level: 'error', message: ' [ASSETS TABLE] [DATA INSERTION] [ERROR] :: Table name `'+localeTableName+'` :: Returning ID is not in Array format.'});
													}
												} catch(err) {
													logger.log({level: 'error', message: err.stack});
												}
											})
											.catch((err) => {
												logger.log({level: 'error', message: err});
												callback(err, null);
											});
											} catch(err) {
												logger.log({level: 'error', message: err.stack});
											}
		
											/**/
										}
									});
								} catch(err) {
									logger.log({level: 'error', message: err.stack});
								}
							} else {
								callback(' [ASSETS TABLE] [DATA INSERTION] [ERROR] :: Table name `'+assetsTableName+'` :: Returning ID is not in Array format.', null);
								logger.log({level: 'error', message: ' [ASSETS TABLE] [DATA INSERTION] [ERROR] :: Table name `'+assetsTableName+'` :: Returning ID is not in Array format.'});
							}
						})
						.catch((err) => {
							logger.log({level: 'error', message: err});
							callback(err, null);
						});
					
				}
			} catch(err) {
				logger.log({level: 'error', message: err.stack});
			}			
		}
	},
	updateRecursiveLocale: (tableName, items, itemCount, callback) => {
		
		let queryUpdate = dbObj(tableName);
		let conditions = {
			where: {
				locale_id: items[itemCount-1]
			}
		};

		let updateParams = {
			string_key: items[itemCount-1]
		};

		queryUpdate.update(updateParams)
		queryUpdate.where(conditions.where)
		.then(function (rows) {
			if(itemCount-1 > 0) {
				module.exports.updateRecursiveLocale(tableName, items, itemCount-1, callback);
			} else {
				callback(null, true);
			}
		})
		.catch((err) => {
			console.log(err);
			callback(err, null);
		});
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
