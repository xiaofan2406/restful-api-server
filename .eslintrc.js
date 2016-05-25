module.exports = {
  "env": {
    "commonjs": true,
    "es6": true,
    "node": true
  },
  "extends": ["airbnb"],
  "parserOptions": {
    "ecmaFeatures": {
      "experimentalObjectRestSpread": true
    },
    "sourceType": "module"
  },
  "rules": {
    "comma-dangle": [2, "never"],  // disallow comma after the last propery of an object
    "arrow-body-style": 0, // skip arrow function style
    "new-cap": 0, // disable new-cap for Sequalize
    "no-param-reassign": 0, // disable for express middleware
    "consistent-return": 0 // disable for 'return callback()'
  }
};
