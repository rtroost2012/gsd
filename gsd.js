var WsServer    = require('ws').Server;
var gameserver = require('./gameprocess');
var restify = require('restify');
var config = require('./config.json');

var servers = [];

Object.keys(config.servers).forEach(function(item, index) {
    data = config.servers[index];
    servers[index] = new gameserver(data);
    servers[index].console = new WsServer({port: data.consoleport});

    servers[index].on('data', function(data){
        servers[index].broadcast(data.toString());
    });
});

var restserver = restify.createServer();
restserver.get('/gameserver/:id', function info(req, res, next){gameserver = servers[req.params.id]; res.send(gameserver.info());});
restserver.get('/gameserver/:id/on', function on(req, res, next){gameserver = servers[req.params.id]; gameserver.turnon();res.send('ok')});
restserver.get('/gameserver/:id/off', function off(req, res, next){gameserver = servers[req.params.id]; gameserver.turnoff();res.send('ok')});
restserver.get('/gameserver/:id/restart', function restart(req, res, next){gameserver = servers[req.params.id]; gameserver.restart();res.send('ok')});
restserver.get('/gameserver/:id/configs', function configlist(req, res, next){gameserver = servers[req.params.id]; res.send(gameserver.configlist());});
restserver.get('/gameserver/:id/maps', function maplist(req, res, next){gameserver = servers[req.params.id]; res.send(gameserver.maplist());});
restserver.get('/gameserver/:id/query', function query(req, res, next){gameserver = servers[req.params.id]; console.log(gameserver.lastquery()); res.send(gameserver.lastquery());});

restserver.listen(config.daemon.listenport, function() {
  console.log('%s listening at %s', restserver.name, restserver.url);
});
