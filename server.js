
/*// Initialize Express app
var express = require('express');
var app = express();

// Require request and cheerio. This makes the scraping possible
var request = require('request');
var cheerio = require('cheerio');

// Database configuration
var mongojs = require('mongojs');
var databaseUrl = "scraper";
var collections = ["scrapedData"];

// Hook mongojs configuration to the db variable
var db = mongojs(databaseUrl, collections);
db.on('error', function(err) {
  console.log('Database Error:', err);
});


// Main route (simple Hello World Message)
app.get('/', function(req, res) {
  res.send("Hello world");
});

// Retrieve data from the db
app.get('/all', function(req, res) {
  
  // find all results from the scraoedData collection in the db
  db.scrapedData.find({}, function(err, found) {
   
    // throw any errors to the console
    if (err) {
      console.log(err);
    } 
    // if there are no errors, send the data to the browser as a json
    else {
      res.json(found);
    }
  });
});

// Scrape data from one site and place it into the mongodb db
app.get('/scrape', function(req, res) {
  
  // make a request for the news section of ycombinator
  request('https://www.techmeme.com/', function(error, response, html) {
    
    // load the html body from request into cheerio
    var $ = cheerio.load(html);
    // for each element with a "title" class
    $('.title').each(function(i, element) {
    
      // save the text of each link enclosed in the current element
      var title = $(this).children('a').text();
     
      // save the href value of each link enclosed in the current element
      var link = $(this).children('a').attr('href');

    
      // if this title element had both a title and a link
      if (title && link) {
       
        // save the data in the scrapedData db
        db.scrapedData.save({
          title: title,
          link: link
        }, 
        function(err, saved) {
         
          // if there's an error during this query
          if (err) {
           
            // log the error
            console.log(err);
          } 
          // otherwise, 
          else {
           
            // log the saved data
            console.log(saved);
          }
        });
      }
    });
  });

  // this will send a "search complete" message to the browser
  res.send("Scrape Complete");
});


// listen on port 3000
app.listen(3000, function() {
  console.log('App running on port 3000!');
});
*/

///////////////////////////////////////////////////////////

// dependencies
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
// Notice: Our scraping tools are prepared, too
var request = require('request'); 
var cheerio = require('cheerio');

// use morgan and bodyparser with our app
app.use(logger('dev'));

app.use(bodyParser.urlencoded({
	extended: false
}));

app.use(express.static('public'));

mongoose.connect('mongodb://localhost/newScrape');

var db = mongoose.connection;

db.on('error', function(err){
	console.log('Mongoose error: ', err);

});


db.once('open', function(){
	console.log('Mongoose connection successful!');
});

var Note = require('./models/Note.js');
var Article = require('./models/Article.js');

//routes

app.get('/', function(req, res){
	res.send(index.html);
});

app.get('/scrape', function(req, res){
	request('https://www.techmeme.com/', function(error, response, html){
		var $ = cheerio.load(html);

		$('section h2').each(function(i, element){
			var result = {};

			result.Article = $(this).children('a').text();
			result.link = $(this).chidlren('a').attr('href');

			var entry = new Article(result);

			entry.save(function(err, doc){
				if (err){
					console.log(err);
				}else{
					console.log(doc)
				}
			});
		});
	});
	res.send('Scrape Complete');
});


app.get('/articles', function(req, res){
	Article.find({}, function(err, doc){
		if (err){
			console.log(err);
		}else {
			res.json(doc);
		}
	});
});


app.get('articles/:id', function(req, res){
	Article.findOne({'_id: req.params.id'})
	.populate('note')
	.exec(function(err, doc){
		if (err){
			console.log(err);
		} else{
			res.json(doc);
		}
	});
});


app.post('/articles/:id', function(req, res){
	var newNote = new Note(req.body);

	newNote.save(function(err, doc){
		if(err){
			console.log(err);
		}else{
			Article.findOneAndUpdate({'_id': req.params.id}, {'note':doc._id})
			.exec(function(err, doc){
				if(err){
					console.log(err);
				}else{
					res.send(doc);
				}
			});
		};
	});
});


app.listen(3000, function() {
	console.log('App running on port 3000!');
});








