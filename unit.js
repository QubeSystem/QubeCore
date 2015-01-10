var Unit = module.exports = function Unit(connection, onDisconnect) {
    var self = this;
    self.connection = connection;
    self.listenerList = {};
    self.connection.on('close', onDisconnect || function(){});
    self.connection.on('message', function(message) {
        console.log('Websocket message: ' + message);
        var msg = JSON.parse(message);
        if (!msg.type || !msg.data || !self.listenerList[msg.type]) return;
        self.listenerList[msg.type](msg.data);
    });
}

Unit.prototype.on = function on(type, listener) {
    this.listenerList[type] = listener;
}

Unit.prototype.emit = function emit(type, data) {
    console.log('Websocket output: ', type, data);
    this.connection.send(JSON.stringify({
        type : type,
        data : data
    }));
}