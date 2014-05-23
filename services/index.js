var gameserver = require('./gameprocess');
var servers = [];
var config = require('../config.json');

Object.keys(config.servers).forEach(function(item, index) {
    initServer(index);
});

function initServer(index){
    data = config.servers[index];
    servers[index] = new gameserver(data);
    servers[index].initconsole(index);
}

servers.allsettings = function(){
    output = [];
    servers.forEach(function(item) {
        output.push(item.config);
    });
    return output;
}

exports.initServer = initServer;
exports.servers = servers;