var serial = require('serializer');
var utils = require('../utils');
var util = require('util');
var _ = require('underscore');
var moment = require('moment');
var mongoose = require('mongoose');
var ObjectId          = require('mongoose').Types.ObjectId;
var ObjectIdType      = mongoose.Schema.Types.ObjectId;

var orgStatusSchema = new mongoose.Schema({
  organization          : {type: ObjectIdType, ref: 'Organization'},
  status                : {type: String, default: 'pending'},
  create_date           : {type: Date, default: Date.now()},
  groups                : [ObjectIdType],
  role                  : {type: String}
});

var userSchema = new mongoose.Schema({
  age                   : {type: Number, default: 0},
  name                  : {type: String, default: ''},
  first_name            : {type: String, required: true},
  last_name             : {type: String, default: ''},
  contact_email         : {type: String, default: ''},
  contact_first         : {type: String, default: ''},
  contact_last          : {type: String, default: ''},
  email                 : {type: String, required: true,
                          index: {unique: true}, lowercase: true},
  info                  : {type: String, default: null},
  website               : {type: String, default: null},
  ethnicity             : {type: String, default: null},
  religion              : {type: String, default: null},
  phone_number          : {type: String, default: null},
  affiliations          : {type: Array, default:[]},
  password              : {type: String, default: null},
  provider              : {type: String, default: null},
  provider_id           : {type: String, default: null},
  provider_token        : {type: String, default: null},
  provider_token_secret : {type: String, default: null},
  last_provider_auth    : {type: Date, default: null},
  gender                : {type: String, default: null},
  birthday              : {type: String, default: null},
  address               : {type: String, default: null},
  city                  : {type: String, default: null},
  country               : {type: String, default: null},
  state                 : {type: String, default: null},
  zip_postal            : {type: String, default: null},
  cover_photo_url       : {type: String, default: null},
  profile_photo_url     : {type: String, default: null},
  create_date           : {type: Date, default: null},
  modify_date           : {type: Date, default: null},
  delete_date           : {type: Date, default: null},
  last_login_date       : {type: Date, default: null},
  posts_count           : {type: Number, default: 0},
  following             : {type: Array, default: []},
  followers             : {type: Array, default: []},
  following_count       : {type: Number, default: 0},
  followers_count       : {type: Number, default: 0},
  trust_count           : {type: Number, default: 0},
  type                  : {type: String, default: 'user'},
  date_founded          : {type: Date, default: null},
  mascot                : {type: String, default: null},
  enrollment            : {type: Number, default: null},
  instagram_token       : {type: String, default: null},
  instagram_min_id      : {type: String, default: null},
  twitter_token         : {type: String, default: null},
  twitter_min_id        : {type: String, default: null},
  tumblr_token          : {type: String, default: null},
  tumblr_min_id         : {type: String, default: null},
  tumblr_token_secret   : {type: String, default: null},
  review_key            : {type: String, default: null},
  reset_key             : {type: String, default: null},
  reset_date            : {type: String, default: null},
  password_reset        : {type: String, default: null},
  device_token          : {type: String, default: null},
  subtype               : {type: String, default: null},
  badge_count           : {type: Number, default: 0},
  active                : {type: Boolean, default: true},
  program_code          : {type: String, default: null},
  interests             : {type: Array, default: []},
  insight_count         : {type: Number, default: 0},
  unsubscribed          : {type: Boolean, default: false},
  pwd_updated           : {type: Boolean, default: false},
  org_status            : [orgStatusSchema],
  theme                 : {type: ObjectIdType, ref: 'Theme', required: false},
  visibility            : {type: String, default: null},
  push_enabled          : {type: Boolean, default: false},
  google_devices        : {type: Array, default: []}
},{ versionKey          : false });

userSchema.statics.basicFields = function(){
  return '_id name first_name last_name profile_photo_url type active subtype';
};


userSchema.methods.createUserSalt = function(){
  return serial.stringify(this._id+this.create_date.valueOf()+this.email);
};

userSchema.methods.hashPassword = function(){
  if(this.password) {
    var salt = process.env.PRIZM_SALT;
    var pass = this.password;
    this.password = utils.prismEncrypt(this.password, salt);
    this.pwd_updated = true;
    if (this.password != pass){
      return true;
    }
  }
  return false;
};

userSchema.methods.validatePassword = function(password) {
  var salt = process.env.PRIZM_SALT;
  var hashed_password = utils.prismEncrypt(password, salt);
  if (_.isEqual(this.password, hashed_password)) {
    return true;
  }
  else {
    var old_salt = this.createUserSalt();
    hashed_password = utils.prismEncrypt(password, old_salt);
    if (_.isEqual(this.password, hashed_password)) {
      this.password = password;
      this.pwd_updated = true;
      if (this.hashPassword()){
        this.save();
        return true;
      }
    }
  }
  return false;
};

userSchema.methods.mixpanelProperties = function(){
  return {
    $name: this.name,
    $first_name: this.first_name,
    $last_name: this.last_name,
    $create: this.date_created,
    $email: this.email,
    Birthday: this.birthday,
    Age: this.age,
    Gender: this.gender,
    Origin: this.city || 'unknown',
    State: this.state || 'unknown',
    Zip: this.zip || 'unknown',
    'Total Posts': this.posts_count || 0,
    Interests: this.interests,
    Source: 'website'
  };
};

userSchema.methods.heapProperties = function(){
  var interests = _.pluck(this.interests, 'text');
  interests = interests.join(',');
  var orgs = [];
  if (this.org_status && this.org_status.length > 0){
    _.each(this.org_status, function(s, i, l){
      if (s && s.organization && s.organization.name) 
        orgs.push(s.organization.name);
    });
  }
  orgs = orgs.join(',');
  return {
    handle: this.name,
    email: this.email,
    age: this.age,
    gender: this.gender,
    'total posts': this.posts_count || 0,
    source: 'website',
    interests: interests,
    orgs: orgs,
    type: this.type,
    subtype: this.subtype
  }
}

userSchema.methods.userBelongsToOrganization = function(org_id) {
  var match = false;
  _.each(this.org_status, function(org_status) {
    if (org_id == org_status.organization || 
      String(org_id) == String(org_status.organization._id)) {
      match = true
    }
  })
  return match;
};
userSchema.methods.fetchHomeFeedCriteria = function(next){
  var following = _.pluck(this.following, '_id');
  var Trust = mongoose.model('Trust');
  var User = this.model('User');
  var $user = this;
  Trust.find({
    status: 'accepted',
    $or: [
      {to: $user._id},
      {from: $user._id}
    ]
  }, function(err, trusts){
    var trustArray = [];
      if (err) {
      console.log(err);
      next(err);
    }
    else {
      if (_.has(trusts, 'length')){
        _.each(trusts, function(trust, idx, list){
          if (String(trust.to) == String($user._id)){
            trustArray.push(trust.from);
          } else {
            trustArray.push(trust.to);
          }
        });
      }
      var orgs = _.filter($user.org_status, function(org){
        return org.status == 'active';
      });
      var orgArray = _.pluck(orgs, 'organization');
      User.find({org_status: {$elemMatch: {organization: {$in: orgArray}, status: 'active'}}})
      .select({_id: 1})
      .exec(function(err, users){
        if (err) console.log(err);
        var orgUsers = [];
        if (users) {
          orgUsers = _.pluck(users, '_id');
        }
        var criteria = {
        $or: [
          {scope: 'public', category: {$ne: 'personal'}, status: 'active', creator: {$in: following}},
          {scope: {$in: ['trust', 'public']}, category: {$ne: 'personal'}, status: 'active', creator: {$in: trustArray}},
          {scope: {$in: ['trust', 'public']}, category: {$ne: 'personal'}, status: 'active', creator: {$in: orgUsers}},
          {creator: $user._id, status: 'active'}
        ],
        is_flagged: false
      };
      next(null, criteria);

      });
          }
  });
}

var orgFieldset = function(orgId, status){
  return {
    _id: 1,
    name: 1,
    first_name: 1,
    last_name: 1,
    org_status: {$elemMatch: {organization: orgId}},
    subtype: 1,
    profile_photo_url: 1,
    create_date: 1,
    last_login_date: 1,
    email: 1,
    birthday: 1,
    city: 1,
    state: 1,
    zip_postal: 1,
    following_count: 1,
    followers_count: 1,
    posts_count: 1,
    phone_number: 1,
    modify_date: 1,
    interests: 1,
    device_token: 1,
    push_enabled: 1
  };
};

var fetchOrgUsers = function(model, orgId, criteria, sort, next){
  var $this = model;
  $this.model('User').find(criteria, orgFieldset(orgId, criteria.status))
  .populate({path: 'interests', model: 'Interest'})
  .populate({path: 'org_status.groups', model: 'Group'})
  .sort(sort)
  .exec(function(err, users){
    _.each(users, function(u, i, l) {
      _.each(u.org_status, function(os, ind, li){
        os.groups = _.filter(os.groups, function(obj){
          return obj.status != 'inactive';
        });
      });
    }); 
    next(err, users);
});
}

userSchema.statics.allowedFields = function(){
  return [
    'first_name',
    'last_name',
    'info',
    'date_founded',
    'mascot',
    'website',
    'email',
    'zip_postal',
    'phone_number',
    'program_code',
    'ethnicity',
    'religion',
    'birthday',
    'type',
    'contact_first',
    'contact_last',
    'contact_email',
    'enrollment'
  ];
}


userSchema.statics.findOrganizationMembers = function(filters, owner, order, search, next) {
  search = search?search:'';
  console.log('text:' + search);
  var keys = ['ambassador', 'luminary', 'member', 'leader'];
  var dates = ['newest', 'oldest'];
  var needsSort = true;
  var $this = this;
  if (!order) order = '_id';
  var showLuminaries = true;
  var filterLuminary = false;
  if (order == 'leader'){
    filters.role = 'leader';
  }
  var criteria = {
        'org_status': {$elemMatch: filters},
  };
  if (_.contains(keys, order)){
    console.log('contains key');
    if (order != 'luminary') {
      showLuminaries = false;
    } else {
      filterLuminary = true;
    }
    if (order != 'member' && order != 'leader') {
      criteria.subtype = order;
    } else { 
      criteria.subtype = null;
    }
    order = '_id';
  } else if (_.contains(dates, order)){
    needsSort = false;
    sort = order == 'newest'?{'create_date': -1}:{'create_date': 1};
  }
  if (needsSort){
    sort = {};
    sort[order] = 'asc';
  }
 
  if (showLuminaries === true) { 
    var Trust = mongoose.model('Trust');
    Trust.find({
      status: 'accepted',
      from: String(owner) 
    })
    .exec(function(err, trusts){
        var trustArray = [];
        if (filters.status == 'active') {
          if (trusts && trusts.length > 0){
            trustArray = _.pluck(trusts, 'to');
          }
        }
        search = search?search:'';
        var newCriteria = null;
        search = new RegExp(search, 'i');
        newCriteria = {
          $and: [
            {$or: [
              {org_status: {$elemMatch: filters}},
              {_id: {$in: trustArray}}
            ]},
            {$or: [
              {name: search},
              {email: search}
            ]}
          ]
        };
        if (filterLuminary) {
          newCriteria.$and.push({subtype: 'luminary'});
        }
        
        fetchOrgUsers($this, filters.organization, newCriteria, sort, next);
    });
  } else {
    console.log('No luminaries');
    console.log(util.inspect(criteria, {showHidden: false, depth: null}));
    fetchOrgUsers($this, filters.organization, criteria,sort,  next);
  }
};


// User Partner Methods (Organizations)
userSchema.methods.joinOrganization = function(organization, next, approval){
  var userStatus = approval?'active':'pending';
  var user_update = {
    $push: {org_status: {status: userStatus, 
      organization: organization._id, date: new Date().toString()}}
  };
  var present = false;
  _.each(this.org_status, function(item, idx, list){
    if (String(item.organization) == String(organization._id)) {
      present = true;
    }
  });

  if (!present) {
    this.model('User').findOneAndUpdate({_id: this._id}, user_update, function(err, result){
      next(err, result, true);
    });
  } else {
    next(null, this, false);
  }
};

userSchema.pre('save', function(next){
  var birthday = this.birthday?this.birthday.split('-'):false;
  var name;
  var phone_number = this.phone_number;
  if (phone_number && phone_number.length != 10) {
    phone_number = phone_number.replace('-', '');
    phone_number = phone_number.replace('.', '');
    phone_number = phone_number.replace('(', '');
    phone_number = phone_number.replace(')', '');
    if (phone_number.substr(0, 1) == '1') {
      phone_number = phone_number.substr(1);
    }
    if (phone_number.substr(0, 1) == '+') {
      phone_number = phone_number.substr(2);
    }
    this.phone_number = phone_number;
  }
  if (birthday && birthday.length == 3) {
    birthday = [birthday[2], birthday[0] - 1, birthday[1]];
    birthday = moment(birthday);
    diff = moment().diff(birthday, 'years');
    if (diff != this.age) {
      this.age = diff;
    }
  }
  if (!this.create_date) {
    this.create_date = Date.now();
  }
  if (this.last_name == '') {
    name = this.first_name;
  }
  else {
    name = this.first_name + ' ' + this.last_name;
  }
  this.name = name;
  this.modify_date = Date.now();
  next();
});

/**
 * Takes a comment and resolves all user IDs present in the list and 
 * returns the reformatted string. 
 */
userSchema.statics.resolvePostTags = function(post, next){
  var postText = post.text || '';
  var commentText = [];
  if (post.comments) {
    _.pluck(post.comments, 'text');
  }
  commentText.push(postText);
  var userArray = [];
  _.each(commentText, function(comment, idx, list){
    var match = comment.match(/@\S{24}/g);  
    if (match) {
      _.each(match, function(item, idx, list){
        userArray.push(item.substr(1));  
      });
    }
  });
  this.model('User').find({_id: {$in: userArray}}, '_id name', function(err, users){
    next(err, users);
  });
};

/**
 * Takes a user ID and creates a follower entry for current user
 **/
userSchema.methods.addFollower = function(follower_id, next) {
  var User = this.model('User');
  var userId = this._id;
  var followDate  = Date.now();
  var followerCount;
  var followerObject = {};

  function updateFollowers (next) {

    var update = {
      $addToSet: {
        followers: followerObject
      }
    };

    var criteria = {
      _id: userId,
      followers: {
        $elemMatch: {
          _id: follower_id
        }
      }
    };
    console.log('Checking if ' + follower_id + " is following " + userId);
    User.findOne(criteria, function(err, user) {
      if (user) {
        var index;
        _.each(user.followers, function(follower, idx, list){
          if (String(follower._id) == String(follower_id)) {
            index = idx;
          }
        });
        user.followers.splice(index, 1);
        user.followers_count -= 1;
        user.save();
        next(null, user);
      }
      else {
        console.log('Updating followers with: ' + update);
        User.findOneAndUpdate({_id: userId}, update, function(err, user) {
          if (err) {
            next(err);
          }
          if (user) {
            next(null, user);
          }
          else {
            next('User Id no longer valid');
          }
        });    
      }
    });
  };

  function updateFollowersCount(next) {
    
    console.log('Updating followers count..');
    User.findOne({_id: userId}, function(err, user) {
      if (err) next(err);
      if (user) {
        console.log(user.email);
        followersCount = user.followers.length;
        console.log('followers count is ' + followersCount);
        User.update({_id: userId}, {followers_count: followersCount}, function(err, user) {
          if (err) next(err);
          if (user) {
            next(null, user);
          }
        });
      }
    });
  };

  User.find({_id: ObjectId(follower_id)}, function(err, user) {
    console.log('Valid follower id');
    if (err) next(err);
    if (user) {
      followerObject._id = follower_id;
      followerObject.date = followDate;
      console.log(followerObject._id);
      console.log(followerObject.date);

      updateFollowers(function(err, user) {
        if (err) next(err);
        if (user) {
          updateFollowersCount(function(err, user) {
            if (err) next(err);
            else {
              next(null, user);
            }
          });
        }
        else {
          next(err);
        }
      }); 
    }
    else {
      next('Invalid follower_id');
    }
  });
};

/**
 * Takes a user ID and creates a following entry for current user
 **/

userSchema.methods.addFollowing = function(following_id, next) {
  var User = this.model('User');
  var userId = this._id;
  var followDate  = Date.now();
  var followingCount;
  var followingObject = {};

  function updatefollowing (next) {

    var update = {
      $addToSet: {
        following: followingObject
      }
    };

    var criteria = {
      _id: userId,
      following: {
        $elemMatch: {
          _id: following_id
        }
      }
    };
    console.log('Checking if ' + following_id + " is following " + userId);
    User.findOne(criteria, function(err, user) {
      if (user) {
        var index;
        _.each(user.following, function(follower, idx, list){
          if (String(follower._id) == String(following_id)) {
            index = idx;
          }
        });
        user.following_count -= 1;
        user.following.splice(index, 1);
        user.save();
        next(null, user);
      }
      else {
        console.log('Updating following with: ' + update);
        User.findOneAndUpdate({_id: userId}, update, function(err, user) {
          if (err) {
            next(err);
          }
          if (user) {
            next(null, user);
          }
          else {
            next('User Id no longer valid');
          }
        });    
      }
    });
  };

  function updatefollowingCount(next) {
    
    console.log('Updating following count..');
    User.findOne({_id: userId}, function(err, user) {
      if (err) next(err);
      if (user) {
        console.log(user.email);
        followingCount = user.following.length;
        console.log('following count is ' + followingCount);
        User.update({_id: userId}, {following_count: followingCount}, function(err, user) {
          if (err) next(err);
          if (user) {
            next(null, user);
          }
        });
      }
    });
  };

  User.find({_id: ObjectId(following_id)}, function(err, user) {
    console.log('Valid following id');
    if (err) next(err);
    if (user) {
      followingObject._id = following_id;
      followingObject.date = followDate;
      console.log(followingObject._id);
      console.log(followingObject.date);

      updatefollowing(function(err, user) {
        if (err) next(err);
        if (user) {
          updatefollowingCount(function(err, user) {
            if (err) next(err);
            else {
              next(null, user);
            }
          });
        }
        else {
          next(err);
        }
      }); 
    }
    else {
      next('Invalid following_id');
    }
  });
};

userSchema.statics.fetchSuggestions = function(user, next){
  var following = _.pluck(user.following, '_id');
  var criteria = {active: true, _id: {$nin: following}, _id: {$ne: user._id}};
  if (user.org_status && user.org_status.length > 0) {
    var orgs = [];
    _.each(user.org_status, function(item, idx, list){
      if (item.status == 'active'){
        orgs.push(item.organization._id);
      }
    });

    var o = [];
    if (user.org_status && user.org_status.length > 0){
      _.each(user.org_status, function(orgi){
        console.log('iterating');
        var org = orgi.organization;
        if (orgi.status == 'active') {
        if (org.who_to_follow){
          console.log('has who');
          if (org.who_to_follow.luminaries) {
            o.push({subtype: 'luminary'});
          }
          if (org.who_to_follow.org_luminaries) {
            o.push({$and: [{subtype: 'luminary'}, {org_status: {$elemMatch: {organization: org._id}}}]});
          }
          if (org.who_to_follow.leaders) {
            o.push({org_status: {$elemMatch: {organization: org._id, status: 'active', role: 'leader'}}});
          }
          if (org.who_to_follow.ambassadors) {
            o.push({org_status: {$elemMatch: {organization: org._id, status: 'active', role: 'ambassador'}}});
          }
        } 
        }
      });
      console.log(o);
      if (o.length > 0) {
        criteria.$or = o;
      } else {
        criteria.subtype = 'luminary';
      }
    } else {
      criteria.subtype =  'luminary';
    }
  } else {
    criteria.subtype = 'luminary';
  }
  criteria.posts_count = {$gt: 4};
  console.log(criteria);
  this.find(criteria)
    .limit(25)
    .exec(function(err, users){
      next(err, users);
    });
};

userSchema.methods.follow = function(user, next){
  var User = mongoose.model('User');
  var Activity = mongoose.model('Activity');
  var isFollowing = false;
  var userID = user && typeof(user) == 'object'?user.toString():user;
  _.each(this.following, function(item, idx, list){
    if (item._id == userID) {
      isFollowing = true;
    }
  });
  if (!isFollowing){
    var followingUpdate = {
      $push: {following: {_id: userID, date: new Date().toString()}},
      $inc: {following_count: 1}
    };
    var followersUpdate = {
      $push: {followers: {_id: this._id.toString(), date: new Date().toString()}},
      $inc: {followers_count: 1}
    }
    User.findOneAndUpdate({_id: this._id}, followingUpdate, function(err, result){
      User.findOneAndUpdate({_id: user}, followersUpdate, function(err, res){
        if (err) console.log(err);
        if (!err) {
          console.log(res._id + ':' + result._id);
          var a = new Activity({
            from: res._id,
            to :result._id,
            action :'follow'
          }
          );
          a.save(function(err){if (err) console.log(err)});
        }
      });
      next(err, result);
    });
  } else {
    next(null, null);
  }
}

userSchema.methods.joinOrganization = function(organization, next, approval){
  var Activity = mongoose.model('Activity');
  var invite = null;
  if (organization.organization){
    invite = organization;
    organization = invite.organization;
    console.log('have invite');
  }
  var userStatus = invite?'active':'pending';
  var groups = [];
  if (invite && invite.group){
    groups.push(invite.group);
  }
  var user_update = {
    $push: {org_status: {status: userStatus, 
      organization: organization._id, date: new Date().toString(),
      groups: groups
    }}
  };
  var present = false;
  _.each(this.org_status, function(item, idx, list){
    if (String(item.organization) == String(organization._id)) {
      present = true;
    }
  });

  if (!present) {
    this.model('User').findOneAndUpdate({_id: this._id}, user_update, function(err, result){
      if (!err) {
         var a = new Activity({
           from: result._id,
          to: organization.owner,
          action: 'group_joined'
         });
         a.save();
      }
      next(err, result, true);
    });
  } else {
    next(null, this, false);
  }
};

userSchema.post('init', function(user){
  if (user.profile_photo_url) {
    var r = new RegExp('https:/s');
    user.profile_photo_url = user.profile_photo_url.replace(r, 'https://s');
  }
  var genabled = user.google_devices && user.google_devices.length > 0;
  if (user.device_token || genabled) {
    user.push_enabled = true;
  } else {
    user.push_enabled = false;
  }
});

mongoose.model('OrgStatus', orgStatusSchema);
mongoose.model('User', userSchema);
