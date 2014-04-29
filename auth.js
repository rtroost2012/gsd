var config = require('./config.json');
var restify = require('restify');       
var keys = require('./keys.json');

// This is very very simple auth to be replaced later with something like username / password http auth, oauth or jwt, feel free to do so !

function authenticate(req, res, next) {
    // Don't run auth on options requests, this messes with angularjs
    if (req.method.toLowerCase() === 'options') {
      return next();
    }
    
    if (!('X-Access-Token' in req.headers) && 'x-access-token' in req.headers){
      req.headers['X-Access-Token'] = req.headers['x-access-token']
    }
    
    if (!('X-Access-Token' in req.headers)){
      console.log('not authenticated, missing header');
      res.writeHead(403);
      res.end('Sorry you are not authorized');
      return next();
    }
       
    token = req.headers['X-Access-Token']
       
    if (config.tokens.indexOf(token) > -1){
      return next();
    }else{
      console.log('not authenticated, wrong auth');
      res.writeHead(403);
      res.end('Sorry you are not authorized');      
    }

    return next();
      
}

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
exports.authenticate = authenticate;
