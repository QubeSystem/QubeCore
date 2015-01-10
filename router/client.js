var Unit = require('../unit');

var queue = [];
var addEvent = function addEvent(event) {
    queue.push(event);
}

exports.registerMain = function(realAddEvent) {
    queue.forEach(function(each) {
        realAddEvent(each);
    });
    addEvent = realAddEvent;
}

var clients = {};

exports.addUnit = function(uid, connection, onDisconnect) {
    onDisconnect = onDisconnect || function(){};
    var unit = new Unit(connection, function() {
        delete clients[uid];
        onDisconnect();
    });
    unit.on('event', function(data) {
        data.event = 'client.' + data.event;
        addEvent(data);
    });
    clients[uid] = unit;
}

exports.emit = function(target, type, data) {
    clients[target].eimt(type, data);
}