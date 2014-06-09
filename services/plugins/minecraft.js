mcping = require('mcquery');
fs = require('fs');
pathlib = require('path');
glob = require('glob')
copyFolder = require('../create.js').copyFolder;
var async = require('async');
var Gamedig = require('gamedig');

var settings = {};
settings.name = "Minecraft"
settings.stop_command = 'stop'
settings.started_trigger = ')! For help, type "help" or "?"'
settings.defaultvariables = {"-Djline.terminal=":"jline.UnsupportedTerminal", "-Xmx":"512M", "-jar":"minecraft_server.jar"}
settings.exe = "java",
settings.defaultPort = 25565;
settings.joined = ["-Xmx", "-XX:PermSize=", "-Djline.terminal="];

settings.query = function query(self){
  Gamedig.query(
    {
        type: 'minecraft',
        host: self.config.gamehost,
        port: self.config.gameport,
        port_query: self.config.gameport
    },
    function(res) {
        if(res.error){
	  self.emit('crash');
	}else{
	  self.hostname = res['name'];	
	  self.numplayers = res['players'].length;
	  self.maxplayers = res['maxplayers'];
	  self.map        = res['map'];
	  self.players    = res['players'];
	  self.lastquerytime = new Date().getTime();
	}
    }
);
  
};
settings.commands = {
  'player':{
    'kick':'kick {{player}}',
    'ban':'ban {{player}}',
    'kill':'kill {{player}}',
    'clearinventory':'clearinventory {{player}}'
  }
}

settings.preflight = function(server){
  console.log(server.config.variables);
  if ('-jar' in server.config.variables){
    var jar = server.config.variables['-jar']
  }else{
    var jar = server.plugin.defaultvariables['-jar']
  }

  if (!fs.existsSync(pathlib.join(server.config.path, jar))){
    var err = new Error('Jar doesn\'t exist');
    throw err;
  }

}

settings.install = function(server, callback){
  copyFolder(server, "/mnt/MC/CraftBukkit/", function(){callback()});
}

settings.maplist = function maplist(self){
    maps = [];

    fs.readdirSync(self.config.path).forEach(function(directory){
      
      path = pathlib.join(self.config.path, directory); 
      
      if (fs.lstatSync(path).isDirectory()){
	if (fs.existsSync(pathlib.join(path, "level.dat"))){
	  maps.push(directory)
	}
      }
    });
    
    return maps;
};

settings.configlist = function configlist(self){
  var configs = {};
  configs['core'] = [];
  
  glob("*.txt", {'cwd':self.config.path, 'sync':true}, function (er, files) {
    configs['core'] = configs['core'].concat(files);
  });
  
  if (fs.existsSync(pathlib.join(self.config.path, "server.properties"))){
    configs['core'] = configs['core'].concat("server.properties")
  }
  
  if (fs.existsSync(pathlib.join(self.config.path, "plugins"))){
    glob("plugins/*/*.yml", {'cwd':self.config.path, 'sync':true}, function (er, files) {
      configs['plugins'] = files;
    });
  }
  
  return configs;
};

settings.addonlist = function addonlist(self){
  var addons = {};
  
  if (fs.existsSync(pathlib.join(self.config.path, "plugins"))){
    glob("plugins/*.jar", {'cwd':self.config.path, 'sync':true}, function (er, files) {
      addons['bukkit'] = files;
    });
  }
  
  return addons;
};

module.exports = settings;