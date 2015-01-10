var fs = require('fs');
var saved = JSON.parse(fs.readFileSync('./save.json', {encoding:'utf8'}));

var data = require('./platform/data');
data.setAll(saved);
for (var i in saved) {
    data.save(i);
};