var async = require('async');
var Router = require('./unit');
var factory = require('../platform/factory');
var setting = require('../setting');

var routers = {};

exports.addUnit = function addUnit(language, connection, onDisconnect) {
    if (!routers[language]) {
        routers[language] = new Router(language, setting.policy);
    }
    routers[language].addUnit(connection, onDisconnect);
}

exports.work = function work(tasks, callback) {
    async.each(Object.keys(routers), function(each, cb) {
        var router = routers[each];
        router.work(tasks, cb);
    }, function(err) {
        if (err) {
            console.error('Error on game loop', err, err.stack);
        }
        callback();
    });
}