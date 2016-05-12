const express = require('express');
const router = express.Router();
const models = require('../models');
const { User } = models;

/* GET users listing. */
router.get('/:id', (req, res, next) => {
  User.findById(req.params.id).then((user) => {

    res.json(user);
  });
});


module.exports = router;
