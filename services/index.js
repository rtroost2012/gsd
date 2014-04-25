var gameserver = require('./gameprocess');
var servers = [];
var config = require('../config.json');
var io = require('socket.io').listen(config.daemon.consoleport);

Object.keys(config.servers).forEach(function(item, index) {
    initServer(index);
});

function initServer(index){
    data = config.servers[index];
    servers[index] = new gameserver(data);
    servers[index].console = io.of('/'+index);
 
    servers[index].on('console', function(data){
	console.log(data);
	servers[index].console.emit('console', {'l':data.toString()});
    });
    
    servers[index].on('statuschange', function(data) {
	servers[index].console.emit('statuschange', {'status':servers[index].status});
    });
    
    servers[index].on('query', function(data) {
	servers[index].console.emit('query', {"query":servers[index].lastquery()});
    });
    

    servers[index].on('processStats', function(data) {
	servers[index].console.emit('process', {"process":servers[index].usagestats});
    });
    
    servers[index].console.on('sendconsole', function (command) {
    	if(servers[index].status == ON){
		console.log(command);
    	}else{
    		console.log("Server is off. You cannot send command!");
    	}
    });
}

console.log(servers);
exports.servers = servers;