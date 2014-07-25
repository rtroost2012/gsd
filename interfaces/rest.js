var restify = require('restify');
var unknownMethodHandler = require('../utls.js').unknownMethodHandler;
var hasPermission = require('../auth.js').hasPermission;

var config = require('../config.json');
var plugins = require("../services/plugins.js").plugins;
var saveconfig = require('../utls.js').saveconfig;
var servers = require('../services/index.js').servers;
var initServer = require('../services/index.js').initServer;
var restserver = restify.createServer();

restserver.use(restify.bodyParser());
restserver.use(restify.authorizationParser());
restserver.on('MethodNotAllowed', unknownMethodHandler);

restserver.use(
    function crossOrigin(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        return next();
    }
)

restserver.get('/', function info(req, res, next) {
    _plugins = {}
    for (var key in plugins) {
        settings = plugins[key];
        _plugins[settings.name] = {
            "file": key.slice(0, -3)
        };
    }
    response = {
        'gsd_version': "0.001",
        'plugins': _plugins,
        'settings': {
            'consoleport': config.daemon.consoleport
        }
    };
    res.send(response);
});

function restauth(req, service, permission) {
 if (!('X-Access-Token' in req.headers) && 'x-access-token' in req.headers){
    req.headers['X-Access-Token'] = req.headers['x-access-token']
  }
    
  if (!('X-Access-Token' in req.headers)){
    return false;
  }

  if (!hasPermission(permission, req.headers['X-Access-Token'], service)){
    return false;
  }else{
    return true;
  }
  console.log("DONE");
}

function unauthorized(res) {
    console.log('not authenticated, missing header');
    res.writeHead(403);
    res.end('Sorry you are not authorized');
    return res;
}

restserver.get('/gameservers/', function info(req, res, next) {
    if (!restauth(req, -1, "services:list")) {
        res = unauthorized(res);
        return next();
    }

    response = [];
    servers.forEach(
        function(service) {
            response.push(service.info());
        });
    res.send(response);
});

restserver.post('/gameservers/', function info(req, res, next) {
    if (!restauth(req, -1, "services:new")) {
        res = unauthorized(res);
        return next();
    }

    id = config.servers.push(JSON.parse(req.params['settings']));
    id = id - 1;
    saveconfig(config);
    initServer(id);

    service = servers[id];
    service.create();

    res.send({
        "id": String(id)
    });
});

restserver.del('/gameservers/:id', function info(req, res, next) {
    if (!restauth(req, req.params.id, "service:delete")) {
        res = unauthorized(res);
        return next();
    }
    service = servers[req.params.id];
    // TODO: if on, turn off
    service.delete();
    var ftpd = require('ftpd');
    id = config.servers.splice(req.params.id, 1);
    saveconfig(config);
    res.send("ok");
});

restserver.get('/gameservers/:id', function(req, res, next) {
    if (!restauth(req, req.params.id, "service:get")) {
        res = unauthorized(res);
        return next();
    }
    service = servers[req.params.id];
    res.send(service.info());
});


restserver.put('/gameservers/:id', function info(req, res, next) {
    if (!restauth(req, req.params.id, "service:update")) {
        res = unauthorized(res);
        return next();
    }
    service = servers[req.params.id];
    service.updatevariables(JSON.parse(req.params['variables']), true);
    saveconfig(config);

    res.send(service.info());
});


restserver.get('/gameservers/:id/on', function on(req, res, next) {
    if (!restauth(req, req.params.id, "service:power")) {
        res = unauthorized(res);
        return next();
    }

    service = servers[req.params.id];

    if (!service.turnon()) {
        res.send('already_on');
    } else {
        res.send('ok')
    }
});

restserver.get('/gameservers/:id/off', function off(req, res, next) {
    if (!restauth(req, req.params.id, "service:power")) {
        res = unauthorized(res);
        return next();
    }
    service = servers[req.params.id];
    service.turnoff();
    res.send('ok')
});

restserver.get('/gameservers/:id/restart', function restart(req, res, next) {
    if (!restauth(req, req.params.id, "service:power")) {
        res = unauthorized(res);
        return next();
    }
    service = servers[req.params.id];
    service.restart();
    res.send('ok')
});
restserver.get('/gameservers/:id/configlist', function configlist(req, res, next) {
    if (!restauth(req, req.params.id, "service:file")) {
        res = unauthorized(res);
        return next();
    }
    service = servers[req.params.id];
    res.send(service.configlist());
});
restserver.get('/gameservers/:id/maplist', function maplist(req, res, next) {
    if (!restauth(req, req.params.id, "service:file")) {
        res = unauthorized(res);
        return next();
    }
    service = servers[req.params.id];
    res.send(service.maplist());
});
restserver.get('/gameservers/:id/query', function query(req, res, next) {
    if (!restauth(req, req.params.id, "service:query")) {
        res = unauthorized(res);
        return next();
    }
    service = servers[req.params.id];
    res.send(service.lastquery());

});

restserver.post('/gameservers/:id/console', function command(req, res, next) {
    if (!restauth(req, req.params.id, "service:console")) {
        res = unauthorized(res);
        return next();
    }

    service = servers[req.params.id];
    res.send(service.send(req.params.command))
});

restserver.get('/gameservers/:id/addonsinstalled', function command(req, res, next) {
    if (!restauth(req, req.params.id, "service:addons")) {
        res = unauthorized(res);
        return next();
    }
    service = servers[req.params.id];
    res.send(service.addonlist());
});

restserver.get('/gameservers/:id/file/:filename', function(req, res, next) {
  if (!restauth(req, req.params.id, "service:file")) {
  	res = unauthorized(res);
    return next();
  }
  service = servers[req.params.id];
  res.send({'contents':service.readfile(req.params.filename)});
});

restserver.put('/gameservers/:id/file/:filename', function(req, res, next) {
    if (!restauth(req, req.params.id, "service:file")) {
        res = unauthorized(res);
        return next();
    }
    if ('contents' in req.params) {
        service = servers[req.params.id];
        res.send(service.writefile(req.params.filename, req.params['contents']));
    }
    if ('url' in req.params) {
        service = servers[req.params.id];
        res.send(service.downloadfile(req.params['url'], req.params.filename));
    }
});

restserver.get('/gameservers/:id/gamemodes', function command(req, res, next) {
    if (!restauth(req, req.params.id, "gamemodes:get")) {
        res = unauthorized(res);
        return next();
    }
    service = servers[req.params.id];
    service.getgamemodes(res);
});

restserver.put('/gameservers/:id/gamemodes', function command(req, res, next) {
    if (!restauth(req, req.params.id, "gamemodes:edit")) {
        res = unauthorized(res);
        return next();
    }
    service = servers[req.params.id];
    service.installgamemode(req.params['gamemode']);
    res.send("ok");
});
restserver.del('/gameservers/:id/gamemodes', function command(req, res, next) {
    if (!restauth(req, req.params.id, "gamemodes:edit")) {
        res = unauthorized(res);
        return next();
    }
    service = servers[req.params.id];
    service.getgamemode(res);
});


restserver.listen(config.daemon.listenport, function() {
    console.log('%s listening at %s', restserver.name, restserver.url);
});
