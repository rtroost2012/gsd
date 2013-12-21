var WsServer    = require('ws').Server;
var config = require('./config');
var gameserver = require('./gameprocess');

gameconsole = new WsServer({port: 8080});

gameconsole.broadcast = function(data) {
    for(var i in this.clients)
        this.clients[i].send(data);
};

var potato = new gameserver();
potato.turnon();

// Stream everything out to the console
potato.on('data', function(data){
    gameconsole.broadcast(data.toString());
});


setTimeout(function(){
    potato.restart()
}, 5 * 1000);
