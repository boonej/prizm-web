// Users Controller
var express     = require('express');
var router      = express.Router();
var mongoose    = require('mongoose');
var ObjectId    = require('mongoose').Types.ObjectId;
var User        = mongoose.model('User');
var Post        = mongoose.model('Post');
var config      = require('../config');
var passport    = require('passport');
var jade        = require('jade');
var fs          = require('fs');
var path        = require('path');
var _           = require('underscore');
var _time       = require('../lib/helpers/date_time');
var _trusts     = require('../controllers/trusts');
// var _posts      = require('../controllers/posts');
var _profile    = require('../lib/helpers/profile');
var _organizations = require('../controllers/organizations');
var rejectMail  = fs.readFileSync(path.join(__dirname +
                  '/../views/reject_mail.jade'), 'utf8');
var acceptMail  = fs.readFileSync(path.join(__dirname +
                  '/../views/accept_mail.jade'), 'utf8');
var mandrill    = require('node-mandrill')(config.mandrill.client_secret);
var mandrillEndpointSend = '/messages/send';

// User Methods
exports.passwordReset = function(req, res){
  var id = req.params.id;
  var resetKey = req.query.reset_key;
  User.findOne({_id: new ObjectId(id)}, function(err, user){
    if (err) {
      console.log(err);
      res.render('reset', {success: false});
    }
    if (user) {
      if (user.reset_key && user.reset_key == resetKey && user.password_reset) {
        user.password = user.password_reset;
        if (user.hashPassword()){
          user.password_reset = null;
          user.reset_key = null;
          user.reset_date = null;
          user.save(function(err,result){
            if (err) {
              res.render('reset', {success: false});
            } else {
              res.render('reset', {success: true});
            }
          });
        } else {
          res.render('reset', {success: false});
        }
      } else {
        res.render('reset', {success: false});
      } 
    } else {
      res.render('reset', {success: false});
    }
  }); 
};

exports.shortPasswordReset = function(req, res){
  var email = req.body.email || false;
  var password = req.body.password || false;
  console.log(email + ':' + password);
  User.findOne({email: email}, function(err, user){
    if (err) {
      console.log(err);
      res.render('reset', {success: false});
    }
    if (user && password){
      user.password = password;
      if (user.hashPassword()){
        user.save(function(err, result){
          if (err) {
            res.render('reset', {success: false});
          } else {
            res.render('reset', {success: true});
          }
        });
      } else {
        res.render('reset',{success: false});
      }
    } else {
      console.log('missing user or password');
      res.render('reset', {success: false});
    }
  });
};

exports.fetchUsers = function(req, res){
  var limit = req.query.limit || 50;
  if (req.query.name) {
    var search = new RegExp(req.query.name, 'i');
    User.find({name: search}).limit(limit).exec(function(err, users) {
      if (err) {
        res.send(500);
      }
      res.send(users);
    });
  }
};

exports.institutionApproval = function(req, res){
  var id = req.params.id;
  var approval = req.query.approval;
  var review_key = req.query.review_key;
  User.findOne({_id: new ObjectId(id)}, function(err, user){
    if (err) {
      console.log(err);
      res.send(401);
    }
    if (user.review_key == review_key && user.type == 'institution'){
      var html = '';
      var subject = '';
      if (approval == 'yes') {
        user.type = 'institution_verified';
        user.review_key = null;
        user.save();
        subject = 'You have been approved!';
        html = jade.render(acceptMail, {user: user});
      } else if (approval == 'no') {
        user.type = 'user';
        user.review_key = null;
        user.save();
        subject = 'Thank you for your interest.';
        html = jade.render(rejectMail,  {user: user}); 
      }
      console.log(user.email);
      mandrill(mandrillEndpointSend, {
        message: {
                  to: [{email: user.email}],
                  from_email: 'info@prizmapp.com',
                  subject: subject,
                  html: html
               }   
       }, function(err, response) {
         if (err) {
           console.log(response);
            res.render('error', err);
         }
        res.render('approve_deny');
       });
    } else {
      res.render('error', err); 
    }
  });
};

// User Partner Methods (Organizations)

exports.getTrustedLuminariesForUserId = function(userId, next) {
  var trustedUserIds = [];
  _trusts.findTrustsByUserId(userId, function(err, trusts) {
    if (err) {
      next(err);
    }
    if (trusts) {
      _.each(trusts, function(trust, index, list) {
        trustedUserIds.push(trust.to);
      });
      console.log("These are the trusted users: " + trustedUserIds);
      User
      .find({_id: { $in: trustedUserIds}})
      .where('subtype').equals('luminary')
      .exec(function(err, users) {
        if (err) {
          next(err);
        }
        if (users) {
          next(null, users);
        }
        else {
          next({error: "UserId has not trusted Luminaries"});
        }
      });
    }
    else({error: "UserId has no trusts"});
  });
}

// User Authentication Methods

exports.authRequired = function (req, res, next) {
  if (req.isAuthenticated()) {
   return next(); 
 }
  res.redirect('/login')
}

exports.displayLogin = function(req, res) {
  res.render('login/login');
};

exports.handlePrizmLogin = function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err) }
    if (!user) {
      req.session.messages =  [info.message];
      return res.redirect('/login')
    }
    req.logIn(user, function(err) {
      if (err) { 
        return next(err); 
      }
      if (user.type == 'institution_verified') {
        _organizations.getNamespaceByOwnerId(user.id, function(err, namespace) {
          if (namespace) {
            return res.redirect('/' + namespace);
          }
        });
      }
      else {
        return res.redirect('/profile');
      }
    });
  })(req, res, next);
};

exports.handleFacebookLogin = function(req, res, next) {
  // Check to determine if this is orginal auth call to facebook or callback
  if (!req.query.code) {
    // If callback query 'code' is not present request facebook authorization
    passport.authenticate('facebook')(req, res, next);
  }
  else {
    // Handle Facebook callback
    passport.authenticate('facebook', function(err, user, info) {
      if (err) { return next(err) }
      if (!user) {
        req.session.messages =  [info.message];
        return res.redirect('/login');
      }
      req.logIn(user, function(err) {
        if (err) { 
          return next(err); 
        }
        if (user.type == 'institution_verified') {
          _organizations.getNamespaceByOwnerId(user.id, function(err, namespace) {
            if (namespace) {
              return res.redirect('/' + namespace);
            }
          });
        }
        else {
          return res.redirect('/profile');
        }
      });
    })(req, res, next);
  }
};

exports.handleTwitterLogin = function(req, res, next) {
  // Check to determine if this is orginal auth call to twitter or callback
  if (!req.query.oauth_token) {
    // If callback query 'code' is not present request twitter authorization
    passport.authenticate('twitter')(req, res, next);
  }
  else {
    // Handle Twitter callback
    passport.authenticate('twitter', function(err, user, info) {
      if (err) { return next(err) }
      if (!user) {
        req.session.messages =  [info.message];
        return res.redirect('/login');
      }
      req.logIn(user, function(err) {
        if (err) { 
          return next(err); 
        }
        if (user.type == 'institution_verified') {
          _organizations.getNamespaceByOwnerId(user.id, function(err, namespace) {
            if (namespace) {
              return res.redirect('/' + namespace);
            }
          });
        }
        else {
          return res.redirect('/profile');
        }
      });
    })(req, res, next);
  }
};

exports.handleLogout = function(req, res) {
  req.logout();
  res.redirect('/login');
};

// User Profile Methods
exports.displayProfile = function(req, res) {
  var id = req.user.id
  User.findOne({_id: ObjectId(id)}, function(err, user) {
    if (err) {
      res.send(400);
    }
    if (user) {
      Post.findPostsForProfileByUserId(user.id, true, true, function(err, posts) {
        var headerImages;
        if (err) {
          posts = [];
          headerImages = [];
        }
        posts = _time.addTimeSinceFieldToObjects(posts);
        headerImages =_profile.shufflePostImagesForProfileHeader(posts);
        res.render('profile/profile', {
          auth: true,
          currentUser: req.user,
          user: user,
          headerImages: headerImages,
          posts: posts
        });
      });
    }
    else {
      res.status(400).send({error: "User can not be found"})
    }
  });
}

exports.displayProfileById = function(req, res) {
  var id = req.params.id
  var auth = false
  var currentUser = {};
  var isCurrent = false;
  var isTrust = false;
  if (req.isAuthenticated()) {
    auth = true;
    currentUser = req.user;
    if (req.params.id == currentUser._id.toString()){
      isCurrent = true;
    }
  }
  User.findOne({_id: ObjectId(id)}, function(err, user) {
    if (err) {
      res.send(400);
    }
    if (user) {
      Post.findPostsForProfileByUserId(user.id, isCurrent, isTrust, function(err, posts) {
        var headerImages;
        if (err) {
          posts = [];
          headerImages = [];
        }
        posts = _time.addTimeSinceFieldToObjects(posts);
        headerImages =_profile.shufflePostImagesForProfileHeader(posts);
        res.render('profile/profile', {
          auth: auth,
          currentUser: currentUser,
          user: user,
          headerImages: headerImages,
          posts: posts
        });
      });
    }
    else {
      res.status(400).send({error: "User can not be found"})
    }
  });
}

