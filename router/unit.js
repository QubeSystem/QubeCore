var async = require('async');
var Unit = require('../unit');
var key = require('../key');
var data = require('../platform/data');
var scale = require('../platform/scale');
var setting = require('../setting');

var tickms = Math.floor(1000/setting.maxTPS);

var Router = module.exports = function Router(language, policy) {
    this.language = language || 'Javascript';
    this.policy = policy || {};
    this.policy.trigerUp = this.policy.trigerUp || 1.5;
    this.policy.actionUp = this.policy.actionUp || 2.0;
    this.policy.trigerDown = this.policy.trigerDown || 0.5;
    this.policy.actionDown = this.policy.actionDown || 0.5;

    this.units = [];
    this.tasks = [];
    this.callback = function(){};

    this.list = [];
    this.working = [];
    this.done = [];
}

Router.prototype.work = function work(tasks, callback) {
    var self = this;
    self.tasks = tasks.slice(0);
    self.list = Object.keys(self.tasks);
    self.tickStart = new Date().getTime();
    self.callback = function(tickEnd) {
        scale(self.policy, tickms, tickEnd - self.tickStart);
        self.done = [];
        callback();
    }
    if (self.units.length <= 0 || self.tasks.length <= 0) {
        self.callback(new Date().getTime())
        return;
    }
    while (self.units.length > 0 && self.list.length > 0) {
        self.order();
    }
}

Router.prototype.order = function order() {
    var self = this;
    if (self.units.length <= 0 || self.list.length <= 0) {
        return;
    }
    var unit = self.units.shift();
    var id = self.list.shift();

    unit.emit('order', {
        if : id,
        event : self.tasks[id].event,
        info : self.tasks[id].info
    });
}

Router.prototype.answer = function answer() {
    var self = this;
    if (self.units.length <= 0 || self.working.length <= 0) {
        return;
    }
    var unit = self.units.shift();
    var workFlag = true;
    async.whilst(function() {
        return workFlag;
    }, function(callback) {
        var work = self.working.shift();
        async.each(work.data, function(each, cb) {
            if (key.isUsed(each)) {
                self.working.push(work);
                callback()
                return;
            }
            cb();
        }, function() {
            workFlag = false;
            var dataset = {};
            work.data.forEach(function(each) {
                dataset[each] = data.get(each);
            });
            unit.emit('answer', {
                id : work.id,
                event : self.tasks[work.id].event,
                info : self.tasks[work.id].info,
                data : dataset
            });
            callback();
        });
    }, function() {

    });
}

Router.prototype.addUnit = function addUnit(connection, onDisconnect) {
    var self = this;
    var unit = new Unit(connection, function() {
        delete self.units[self.units.indexOf(unit)];
        onDisconnect();
    });
    function action() {
        self.units.push(unit);
        if (self.list.length > 0) {
            self.order();
        } else if (self.working.length > 0) {
            self.answer();
        } else if (self.done.length >= self.tasks.length) {
            self.callback();
        }
    }
    unit.on('result', function(msg) {
        self.done.push({
            id : msg.id
        });
        if (msg.data)
        for (var i in msg.data) {
            key.setUsed(i, false);
            data.set(i, msg.data[i]);
        }
        if (msg.event) {
            msg.event.forEach(addEvent)
        }
        if (msg.load) {
            msg.load.forEach(addDataToLoad)
        }
        if (msg.save) {
            msg.save.forEach(addDataToSave);
        }
        action();
    });
    unit.on('log', function(msg) {
        console.log(msg.log);
    });
    unit.on('err', function(msg) {
        console.error(msg.log);
    });
}

var eventQueue = [];
var loadQueue = [];
var saveQueue = [];
function addEvent(event) {
    eventQueue.push(event);
}
function addDataToLoad(key) {
    loadQueue.push(key);
}
function addDataToSave(key) {
    saveQueue.push(key);
}
Router.registerMain = function(funcAddEvent, funcAddDataToLoad, funcAddDataToSave) {
    addEvent = funcAddEvent;
    addDataToLoad = funcAddDataToLoad;
    addDataToSave = funcAddDataToSave;
    eventQueue.forEach(function(each) {
        addEvent(each);
    });
    loadQueue.forEach(function(each) {
        addDataToLoad(each);
    });
    saveQueue.forEach(function(each) {
        addDataToSave(each);
    });
}