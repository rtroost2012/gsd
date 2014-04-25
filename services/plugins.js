var fs = require('fs');

var plugins = {};
fs.readdirSync("./services/plugins").forEach(function(file){
    if (file.slice(-3) == ".js"){
      path = "./plugins/" + file;
      if (fs.lstatSync("./services/plugins/" + file).isFile()){
	console.log('Loading plugin ' + file);
	plugins[file] = require(path);
      }
    }
});

exports.plugins = plugins;