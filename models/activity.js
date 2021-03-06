var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;
var Push = require('../classes/push_notification');

var activitySchema = new mongoose.Schema({
  from:              {type: ObjectId, ref: 'User', required: true},
  to:                {type: ObjectId, ref: 'User', required: true},
  create_date:       {type: Date, default: Date.now(), required: false},
  action:            {type: String, default: null, required: false},
  post_id:           {type: String, default: null, required: false},
  comment_id:        {type: String, default: null, required: false},
  insight_id:        {type: String, default: null, required: false},
  insight_target_id: {type: String, default: null, required: false},
  has_been_viewed:   {type: Boolean, default: false, required: false},
  group_id:          {type: ObjectId, ref: 'Group', required: false},
  survey_id:         {type: ObjectId, ref: 'Survey', required: false}
}, { versionKey: false });

activitySchema.pre('save', function(next) {
  this.create_date = Date.now();
  next();
});

activitySchema.post('save', function(saved) {
  new Push('activity', saved, function(result){
    console.log(result);
  });
});

mongoose.model('Activity', activitySchema);
