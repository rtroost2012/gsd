
srcdsquery = require('gamedig');
fs = require('fs');
pathlib = require('path');
glob = require('glob')

var settings = {};
settings.stop_command = 'stop'
settings.started_trigger = 'Connection to Steam servers successful'
settings.defaultvariables = {"+map":"ctf_2fort", "-game":"tf"}
settings.exe = "./srcds_wrap",

settings.query = function query(self){
  Gamedig.query(
    {
        type: 'tf2',
        host: self.config.gamehost,
	port: self.config.gameport
    },
    function(res) {
        if(res.error){
	  self.emit('crash');
	}else{
	  self.hostname = res['name'];	
	  self.numplayers = res['numplayers'];
	  self.maxplayers = res['maxplayers'];
	  self.map        = res['map'];
	  self.players    = res['players'];
	  self.lastquerytime = new Date().getTime();
	}
    }
);
  
};


settings.maplist = function maplist(self){
    maps = [];
    mapspath = pathlib.join(self.config.path, "tf/maps/*.bsp"); 
    
    if (fs.existsSync(mapspath)){
      glob("*.bsp", {'cwd':mapspath, 'sync':true}, function (er, files) {
	maps = files
      });
    }
    
    return maps;
};

settings.configlist = function configlist(self){
  var configs = {};
  configs['core'] = [];
  
  glob("tf/cfg/*.cfg", {'cwd':self.config.path, 'sync':true}, function (er, files) {
    configs['core'] = configs['core'].concat(files);
  });
  
  
  return configs;
};

settings.addonlist = function addonlist(self){
  var addons = {};
  
  
  return addons;
};

module.exports = settings;