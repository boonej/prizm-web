var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('about', { title: 'About' });
});

router.post('/', function(req, res) {
  
});

module.exports = router;
