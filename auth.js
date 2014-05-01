var config = require('./config.json');
var restify = require('restify');       
var keys = require('./keys.json');

function hasPermission(permission, key, service){
  if (config.tokens.indexOf(key) > -1){
    return true;
  }
  
  service = Number(service);
  if (key in keys){
    if (keys[key].services.indexOf(service) >= 0 || service == -1){
      if (keys[key].permissions.indexOf(permission) >= 0){
	  console.log("B");
	return true;
      }
    }
  }
  return false;
}

exports.hasPermission = hasPermission;

