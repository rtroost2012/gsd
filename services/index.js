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

exports.servers = servers;