var keys = {};

exports.isUsed = function(key) {
    return keys[key]
};

exports.setUsed = function(key, used) {
    if (used) keys[key] = true;
    else delete keys[key];
}