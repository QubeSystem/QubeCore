process.on('uncaughtException', function(err) {
    console.error('ERROR!!!!!!!', err, err.stack);
});

process.on('exit', function(code) {
    console.log('process exit with code ' + code);
    require('child_process').spawn('node', ['exit'], {
        detached : true,
        stdio : 'ignore'
    });
});

var server = require('./server');
var client = require('./router/client');

var eventQueue = [];
var loadQueue = [];
var saveQueue = [];

function addEvent(event) {
    if (event.target) {
        client.emit(event);
    }
    eventQueue.push(event);
}

client.registerMain(addEvent);
require('./router/unit').registerMain(addEvent, loadQueue.push, saveQueue.push);

var async = require('async');
var data = require('./platform/data');
var worker = require('./router/worker');
var setting = require('./setting');

var shutdown = exports.shutdown = false;

var tickTime = Math.floor(1000/setting.maxTPS);
var lastTime = 0;

var timeFlag = true;
var eventFlag = true;

var tickCount = 0;
var lastTickTime = tickTime;

function loop() {
    if (!timeFlag || !eventFlag) return;
    timeFlag = eventFlag = false;

    if (shutdown) {
        eventQueue.push({
            event : 'core.shutdown',
            info : {}
        });
        worker.work(eventQueue, function() {
            process.exit();
        })
        return;
    }

    var time = new Date().getTime();
    if (lastTime) lastTickTime = time - lastTime;
    lastTime = time;

    setTimeout(function() {
        timeFlag = true;
        loop();
    }, tickTime);

    eventQueue.push({
        event : 'core.tick',
        info : {
            time : ++tickCount,
            ltt : lastTickTime
        }
    });

    async.each(loadQueue, function(key, cb) {
        data.load(key, cb);
    }, function(err) {
        if (err) {
            console.error('Error on loading data', err, err.stack);
        }
        worker.work(eventQueue, function() {
            async.each(saveQueue, function(key, cb) {
                data.save(key, cb);
            }, function(err) {
                if (err) {
                    console.error('Error on saving data', err, err.stack);
                }
                eventQueue = [];
                eventFlag = true;
                loop();
            });
        });
    });
}