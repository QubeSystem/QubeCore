

var db = {};

exports.get = function(key) {
    return db[key];
}

exports.set = function(key, value) {
    db[key] = value;
}

//callback(err)
exports.load = function(key, callback) {

}

//callback(err)
exports.save = function(key, callback) {

}

exports.getAll = function() {
    return db;
}

exports.setAll = function(newDb) {
    db = newDb;
}