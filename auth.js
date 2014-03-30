var config = require('./config.json');
var restify = require('restify');

// This is very very simple auth to be replaced later with something like username / password http auth, oauth or jwt, feel free to do so !

function authenticate(req, res, next) {
    //
    if (!('x-access-token' in req.headers)){
      console.log('notauth');
      return new restify.NotAuthorizedError()
    }
       
    token = req.headers['x-access-token']
       
    if (config.tokens.indexOf(token) > -1){
      return next();
    }else{
      return new restify.NotAuthorizedError()
    }
}

exports.authenticate = authenticate;