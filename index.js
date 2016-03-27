'use strict'

require('dotenv').config()

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development'

var express        = require('express') // import express.js
var hbs            = require('express-hbs') // handlebars
var bodyParser     = require('body-parser') // parse request bodies
var path           = require('path') // work with file paths
var methodOverride = require('method-override') // allow put, delete through post
var request = require('request')

var app = express() // create the express application
var server = require('http').createServer(app) // create the server

app.engine('hbs', hbs.express4({
  partialsDir: __dirname + '/views',
  defaultLayout: __dirname + '/views/layout'
}))

app.set('view engine', 'hbs')
app.set('views', __dirname + '/views')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))
app.use(methodOverride('_method'))


var getGenreList = function (callback) {
  var query = ['https://api.themoviedb.org/3/genre/movie/list?api_key=6c4508f0bd28fb0a0b8c5809a2b897c9'].join('')
  request.get(query, function(err, response, body) {
    if(err) callback(err)
    else return callback(null, JSON.parse(body))
  })
}

var getMovies = function (id, callback) {
  var query = ['https://api.themoviedb.org/3/genre/' + id + '/movies?api_key=6c4508f0bd28fb0a0b8c5809a2b897c9'].join('')
  request.get(query, function(err, response, body) {
    if(err) callback(err)
    else callback(null, JSON.parse(body))
  })
}

function getMovieId(name) {
  getGenreList(function(err, body) {
    for(var mov in body.genres) 
      if(mov.name === name)
        console.log('YES')
      else
        console.log('NO')
  })
}
getMovieId('Action')

app.get('/', function (req, res) {
  res.redirect('/genres')
})

app.get('/genres', function (req, res) {
  getGenreList(function(err, body) {
    if(err) {console.log(err); return}
    var genres = body
    res.render('index', genreList)
  })
})

app.get('/movies/:name', function(req, res) {
  var id = getMovieId(req.params.name)
  getMovies(id, function(err, body) {
    if(err) {console.log(err); return}
    var movies = body
    movies.id = req.params.name
    // console.log(movies)
    res.render('movies', movies)
  })
})

app.get('/genres/:id', function(req,res){
  // console.log(req.params); // try going to /cats/1
  // var cat = findCat(Number(req.params.id))
  res.render('movies', cat)
})

// Start the app only when run with npm start
// Don't run it when imported into the tests
if (require.main === module) {
  server.listen(3000, function () {
    console.log('Server running at port 3000!')
  })
}

// For testing purposes
exports = module.exports = app