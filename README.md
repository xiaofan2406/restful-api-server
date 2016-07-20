# REST-ful API server

[Node v6](https://nodejs.org/api/) + [Express](http://expressjs.com/) + [Sequelize](http://docs.sequelizejs.com/en/latest/) + [PostgreSQL](http://www.postgresql.org/docs/9.5/static/index.html)


# Get Started
* `npm run setup`
* modify `-config.js` files under `config/` directory
* define models
* define routes
* `npm test`
* `npm start`

# TODOs
* **HTTP status code**
* **Documentation**
* promisify callbacks
* ~~email log~~
* testing
* view engine setup
* express middleware config
* ~~user authentication~~
* sequelize database migrations
* production setup
* folder structure
* ~~webpack es6 babel~~
> remove sequelize in the futuer, use pg, and es6 classes

# Conventions
### Nodejs Naming
| Target      | Type       |
| ----------- | ---------- |
| Directories | kebab-case |
| Files       | kebab-case |
| Classes     | PascalCase |
| Models      | PascalCase |
| Variables   | camelcase  |

### Database Naming
| Target      | Type       |
| ----------- | ---------- |
| Name        | snake_case |
| Table name  | snake_case |
| Attribute   | camalCase  |
