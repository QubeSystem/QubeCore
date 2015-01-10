var http = require('http');
var WSS = require('ws').Server;
var worker = require('./router/worker');
var client = require('./router/client');
var setting = require('./setting');

var server = http.createServer();

var wsWorker = new WSS({
    server : server,
    path : '/worker'
});

wsWorker.on('connection', function connection(ws) {
    console.log('A new worker is arrived!');
    ws.on('message', function(data) {
        if (ws.isRegistered) {
            return;
        }
        worker.addUnit(data, ws);
        ws.isRegistered = true;
    });
});

var wsClient = new WSS({
    server : server,
    path : '/app'
});

wsClient.on('connection', function connection(ws) {
    console.log('A new client is joined!');
    ws.on('message', function(data) {
        if (ws.isRegistered) {
            return;
        }
        client.addUnit(data, ws);
        ws.isRegistered = true;
    });
});

server.listen(setting.port || 80);