// function PollListCtrl($scope) {
// 	$scope.polls = [];
// }

// function PollItemCtrl($scope, $routeParams) {
// 	$scope.poll = {}
// 	$scope.vote = function () {};
// }

// function PollNewCtrl($scope) {
// 	$scope.poll = {
// 		question: '', 
// 		choices: [{text: ''}, {text: ''}, {text: ''}]
// 	};
	
// 	$scope.addChoice = function() {
// 		$scope.poll.choices.push({text: ''});
// 	};
	
// 	$scope.createPoll = function() {

// 	};
// }

myapp.controller('PollListCtrl', ['$scope', 'Poll', function($scope, Poll) {
		$scope.polls = Poll.query();
	}])
	.controller('PollItemCtrl', ['$scope', '$routeParams', 'Poll', 'socket', function($scope, $routeParams, Poll, socket) {
		$scope.poll = Poll.get({pollId: $routeParams.pollId});
		socket.on('myvote', function(data){
			console.dir(data);
			if(data._id === $routeParams.pollId){
				$scope.poll = data;
			}
		});

		socket.on('vote', function(data){
			console.dir(data);
			if(data._id === $routeParams.pollId){
				$scope.poll.choices = data.choices;
				$scope.poll.totalVotes = data.totalVotes;
			}
		});

		$scope.vote = function() {
			var pollId = $scope.poll._id,
				choiceId = $scope.poll.userVote;
			if(choiceId){
				var voteObj = {poll_id: pollId, choice: choiceId};
				socket.emit('send:vote', voteObj);
			} else {
				alert("You must select an option to vote for");
			}
		};
	}])
	.controller('PollNewCtrl', ['$scope', '$location', 'Poll', function($scope, $location, Poll) {
		$scope.poll = {
			question: '',
			choices: [{text: ''}, {text: ''}, {text: ''}, {text: ''}]
		};

		$scope.addChoice = function() {
			$scope.poll.choices.push({text: ''});
		};

		$scope.createPoll = function() {
			var poll = $scope.poll;
			if(poll.question.length > 0){
				var choiceCount = 0;
				for(var i = 0, ln = poll.choices.length; i < ln; i++) {
					var choice = poll.choices[i];
					if(choice.text.length > 0){
						choiceCount++
					}
				}
				if(choiceCount > 1){
					var newPoll = new Poll(poll);
					newPoll.$save(function(p, resp){
						if(!p.error){
							$location.path("polls");
						} else {
							alert("Could not create poll");
						}
					});
				} else {
					alert("You must enter at least two choices");
				} 
			} else {
				alert("You must enter a question");
			}
		};
	}]);
