var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;
var Sms = require('../classes/sms');
var SMS = mongoose.model('SMS');
var iPush = require('../classes/i_push');
var _ = require('underscore');
var util = require('util');

var notificationSchema = new mongoose.Schema({
  from:               {type: ObjectId, ref: 'User', required: true},
  to:                 {type: ObjectId, ref: 'User', required: true},
  create_date:        {type: Date},
  text:               {type: String},
  replies:            {type: Array, default: []},
  sms:                {type: ObjectId, ref: 'SMS'},
  type:               {type: String},
  title:              {type: String, required: true, index: true} 
});

notificationSchema.statics.create = function(params, next){
  if (params.from && params.to && params.type && params.title) {
     var note = new this({
       from: params.from,
       to:  params.to,
       type: params.type,
       title: params.title
     });
     note.create_date = Date.now();
     note.text = params.text || '';
     note.save(function(err, n){
       if (err) console.log(err);
       if (n) {
         note.sendNotification(function(success){
           next(err, note);
         });
       }
     });
  } else {
    next(false, false);
  }
};

var sendSMS = function(n, next){
  Sms.sendMessage(n, function(err, response){
    if (response) {
      var s = new SMS(response);
      s.save(function(err, saved){
        n.sms = saved._id;
        n.save(function(err){
          if (err) console.log(err);
        });
        next(true);
      });
    } else {
      next(false);
    }
  });
};

var sendPush = function(n, u, next) {
  iPush.sendNotification({
    device: u.device_token,
    alert: n.text,
    payload: {notification: n._id},
    badge: 1
  }, function(err, result){
    next(err, n);
  });
}

notificationSchema.methods.sendNotification = function(next){
  var User = mongoose.model('User');
  var type = this.type;
  var $this = this;
  User.findOne({_id: $this.to}, function(err, user){
    if (err) console.log(err);
    if (user) {
      var canSMS = user.phone_number && user.phone_number.length == 10;
      var canPush = user.device_token != null;
      if (type == 'auto') {
        if (canPush) {
          sendPush($this, user, next);
        } else if (canSMS) {
          sendSMS($this, next);
        } else {
          next(false);
        }
      } else if (type == 'push') {
        sendPush($this, user, next);
      } else if (type == 'sms') {
        sendSMS($this, next);
      }
    } else {
      next(false);
    }
  });
};

notificationSchema.statics.refreshMessageStatus = function(u, next){
  var complete = [];
  this.find({from: u._id})
  .populate({path: 'to'})
  .populate({path: 'sms'})
  .sort({create_date: -1})
  .exec(function(err, n){
    if (n){
      var queued = _.filter(n, function(o){
        var r = false;
        if (o.sms && o.sms.status && o.sms.status != 'delivered' && o.sms.status !='received') {
          r = true;
        }
        return r;
      });
      if (!queued || queued.length == 0){
        next(err, n);
      }
      _.each(queued, function(s){
        Sms.client.messages(s.sms.sid).get(function(err, m){
          if (m) {
            s.sms.status = m.status;
          }
          s.sms.save(function(err, r){
            complete.push(true);
            if (complete.length == queued.length){
              next(err, n);
            }
          });
        })
      });
    } else {
      next(err, []);
    }
  }); 
};

mongoose.model('Notification', notificationSchema);
