var mongoose = require('mongoose');

var insightTargetSchema = new mongoose.Schema({
  create_date     : {type: Date, default: null, required: false, index: true},
  insight         : {type: mongoose.Schema.Types.ObjectId, ref: 'Insight', required: true},
  creator         : {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  target          : {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  liked           : {type: Boolean, default: false},
  disliked        : {type: Boolean, default: false},
  file_path       : {type: String, default: null}
});

insightTargetSchema.pre('save', function(next){
  this.create_date = Date.now();
  next();
});

mongoose.model('InsightTarget', insightTargetSchema);