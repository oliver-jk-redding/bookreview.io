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
var fs = require('fs')

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

var favsPath = __dirname + '/./db/favourites.json'
var saveFavs = function(data) {
  fs.writeFileSync(favsPath, JSON.stringify(data))
}
var getFavs = function() {
  var data = fs.readFileSync(favsPath).toString()
  if(data === "")
    return []
  return JSON.parse(data)
}

function getGenreList (callback) {
  var query = ['https://api.themoviedb.org/3/genre/movie/list?api_key=6c4508f0bd28fb0a0b8c5809a2b897c9'].join('')
  request.get(query, function(err, response, body) {
    if(err) callback(err)
    else callback(null, JSON.parse(body))
  })
}

function getMovies (id, callback) {
  var query = ['https://api.themoviedb.org/3/genre/' + id + '/movies?api_key=6c4508f0bd28fb0a0b8c5809a2b897c9'].join('')
  request.get(query, function(err, response, body) {
    if(err) callback(err)
    else callback(null, JSON.parse(body))
  })
}

function getMovieIdByName(name, callback) {
  getGenreList(function(err, body) {
    if(err) {callback(err); return}
    for(var mov in body.genres)
      if(body.genres[mov].name === name)
        callback(null, body.genres[mov].id)
  })
}

function getMovieById(id, callback) {
  var query = ['https://api.themoviedb.org/3/movie/' + id +'?api_key=6c4508f0bd28fb0a0b8c5809a2b897c9'].join('')
  request.get(query, function(err, response, body) {
    if(err) callback(err)
    else callback(null, JSON.parse(body))
  })
}

app.get('/', function (req, res) {
  res.redirect('/genres')
})

app.get('/genres', function (req, res) {
  getGenreList(function(err, body) {
    if(err) {console.log(err); return}
    var genres = body
    res.status(200)
    res.render('index', genres)
  })
})

app.get('/genres/:name', function(req, res) {
  getMovieIdByName(req.params.name, function(err, id) {
    if(err) {console.log(err); return}
    getMovies(id, function(err, movies) {
      if(err) {console.log(err); return}
      movies.id = req.params.name
      res.status(200)
      res.render('movies', movies)
    })
  })
})

app.get('/genres/movie/:id', function(req,res){
  getMovieById(req.params.id, function(err, movie) {
    if(err) { console.log(err); return }
    res.status(200)
    res.render('movieShow', movie)
  })
})

app.post('/genres/movie/:id', function(req, res) {
  var favs = getFavs()
  for(var i = 0; i<favs.length; i++) {
    if(favs[i].id == req.body.id) {
      res.send("Movie already in favourites")
      return
    }
  }
  var fav = {}
  fav.id = req.body.id
  fav.title = req.body.title
  fav.homepage = req.body.homepage
  favs.push(fav)
  saveFavs(favs, favsPath)
  res.status(200)
  res.send('Movie saved!')
})

app.get('/favourites', function (req, res) {
  var favs = {favs: getFavs()}
  res.status(200)
  res.render('favourites', favs)
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