var gameserver = require('./gameprocess');
var restify = require('restify');
var config = require('./config.json');
var unknownMethodHandler = require('./utls.js').unknownMethodHandler;
var saveconfig = require('./utls.js').saveconfig;
var authenticate = require('./auth.js').authenticate;
var fs = require('fs');
var servers = [];
var plugins = require('./plugins').plugins;

Object.keys(config.servers).forEach(function(item, index) {
    initServer(index);
});



function initServer(index){
    data = config.servers[index];
    servers[index] = new gameserver(data);
    servers[index].console = require('socket.io').listen(data.consoleport);

    servers[index].on('console', function(data){
	servers[index].console.sockets.emit('console', {'l':data.toString()});
    });
    
    servers[index].on('statuschange', function(data) {
	servers[index].console.sockets.emit('statuschange', {'status':servers[index].status});
    });
    
    servers[index].console.on('sendconsole', function (command) {
	console.log(command);
    });
}

var restserver = restify.createServer();
restserver.use(restify.bodyParser());
restserver.use(restify.authorizationParser());
restserver.on('MethodNotAllowed', unknownMethodHandler);
restserver.use(authenticate);

restserver.use(
  function crossOrigin(req,res,next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    return next();
  }
);

restserver.get('/', function info(req, res, next){
  _plugins = {}
  for (var key in plugins) {
    settings = plugins[key];
    _plugins[settings.name] = {"file":key.slice(0, -3)};
  }
  response = {'plugins':_plugins};
  res.send(response);
});


restserver.get('/gameservers/', function info(req, res, next){
  response = [];
  servers.forEach(
    function(service){
      response.push(service.info());
    });
  res.send(response);
});

restserver.post('/gameservers/', function info(req, res, next){
  id = config.servers.push(JSON.parse(req.params['settings']));

  // Stupid java indexes
  id = id - 1;
  saveconfig(config); 
  initServer(id);
  service = servers[id];
  service.create();
  res.send({"id":String(id)});
});

restserver.del('/gameservers/:id', function info(req, res, next){
  service = servers[req.params.id];
  // TODO: if on, turn off
  service.delete();

  id = config.servers.splice(req.params.id,1);
  saveconfig(config);
  res.send("ok");
});

restserver.get('/gameservers/:id', function (req, res, next){
  service = servers[req.params.id];
  res.send(service.info());
});


restserver.put('/gameservers/:id', function info(req, res, next){
  service = servers[req.params.id];

  config.servers[req.params.id].variables = req.params['variables'];
  saveconfig(config);
  
  res.send(service.info());
});




restserver.get('/gameservers/:id/on', function on(req, res, next){service = servers[req.params.id]; service.turnon();res.send('ok')});
restserver.get('/gameservers/:id/off', function off(req, res, next){service = servers[req.params.id]; service.turnoff();res.send('ok')});
restserver.get('/gameservers/:id/restart', function restart(req, res, next){service = servers[req.params.id]; service.restart();res.send('ok')});
restserver.get('/gameservers/:id/configlist', function configlist(req, res, next){service = servers[req.params.id]; res.send(service.configlist());});
restserver.get('/gameservers/:id/maplist', function maplist(req, res, next){service = servers[req.params.id]; res.send(service.maplist());});
restserver.get('/gameservers/:id/query', function query(req, res, next){service = servers[req.params.id]; res.send(service.lastquery());});

restserver.post('/gameservers/:id/console', function command(req, res, next){service = servers[req.params.id]; service.send(req.params.command); res.send('ok');});

restserver.get('/gameservers/:id/addonsinstalled', function command(req, res, next){service = servers[req.params.id]; res.send(service.addonlist());});

restserver.get(/^\/gameservers\/(\d+)\/file\/(.+)/, function(req, res, next) {service = servers[req.params[0]];res.send({'contents':service.readfile(req.params[1])});});
restserver.put(/^\/gameservers\/(\d+)\/file\/(.+)/, function(req, res, next) {
  if ('contents' in req.params){
    service = servers[req.params[0]];res.send(service.writefile(req.params[1], req.params['contents']));
  }
  if ('url' in req.params){
    service = servers[req.params[0]];res.send(service.downloadfile(req.params['url'], req.params[1]));
  }
});
// TODO : put send

restserver.get('/gameservers/:id/gamemodes', function command(req, res, next){service = servers[req.params.id]; service.getgamemodes(res);});
restserver.put('/gameservers/:id/gamemodes', function command(req, res, next){service = servers[req.params.id]; service.installgamemode(req.params['gamemode']); res.send("ok");});
restserver.del('/gameservers/:id/gamemodes', function command(req, res, next){service = servers[req.params.id]; service.getgamemode(res);});


restserver.listen(config.daemon.listenport, function() {
  console.log('%s listening at %s', restserver.name, restserver.url);
});