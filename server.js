var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var http = require('http');

var voteSchema = new mongoose.Schema({ip: 'String'});
var choiceSchema = new mongoose.Schema({
	text: String,
	votes: [voteSchema]
});
var PollSchema = new mongoose.Schema({
	question: {type: String, required: true},
	choices: [choiceSchema]
});


var Poll = mongoose.model("polls", PollSchema);
mongoose.connect("localhost");

var app = express();
var server = http.createServer(app);
var io = require("socket.io").listen(server);

app.set('port', process.env.PORT || 3000);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.listen(app.get('port'), function() {
//     console.log('Express server listening on port ' + app.get('port'));
// });

io.sockets.on('connection', function(socket) {
	socket.on('send:vote', function(data){
		var ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address.address;
		Poll.findById(data.poll_id, function(err, poll){
			var choice = poll.choices.id(data.choice);
			choice.votes.push({ip: ip});
			poll.save(function(err, doc){
				var theDoc = {
					question: doc.question, _id: doc._id, choices: doc.choices,
					userVoted: false, totalVotes: 0
				};

				for(var i = 0, ln = doc.choices.length; i < ln; i++){
					var choice = doc.choices[i];
					for(var j = 0, jln = choice.votes.length; i < jln; i++){
						var vote = choice.votes[j];
						theDoc.totalVotes++;
						theDoc.ip = ip;
						if(vote.ip === ip){
							theDoc.userVoted = true;
							theDoc.userChoice = {_id: choice._id, text: choice.text};
						}
					}
				}
				socket.emit('myvote', theDoc);
				socket.broadcast.emit('vote', theDoc);
			});
		});
	});

});

server.listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});

app.get('/polls/polls', function(req, res) {
	Poll.find({}, 'question', function(err, polls) {
		res.json(polls);
	});
});

app.get('/polls/:id', function(req, res) {
	var pollId = req.params.id;
	Poll.findById(pollId, '', {lean: true}, function(err, poll) {
		if(poll){
			var userVoted = false, 
				userChoice, 
				totalVotes = 0;
			for(c in poll.choices){
				var choice = poll.choices[c];
				for(v in choice.votes){
					var vote = choice.votes[v];
					totalVotes++;
					if(vote.ip === (req.header('x-forwarded-for') || req.ip)){
						userVoted = true;
						userChoice = {_id:choice._id, text: choice.text};
					}
				}
			}
			poll.userVoted = userVoted;
			poll.userChoice = userChoice;
			poll.totalVotes = totalVotes;
			res.json(poll);
		} else {
			res.json({error:true});
		}
	});
});

app.post('/polls', function(req, res) {
	var reqBody = req.body,
		choices = reqBody.choices.filter(function(v){return v.text != '';}),
		pollObj = {question: reqBody.question, choices: choices};
	var poll = new Poll(pollObj);
	poll.save(function(err, doc){
		if(err || !doc){
			throw 'Error';
		} else {
			res.json(doc);
		}
	});
});
