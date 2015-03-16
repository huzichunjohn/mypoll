var myapp = angular.module('polls', ['ngRoute', 'pollServices']);
myapp.config(['$routeProvider', function($routeProvider) {
	$routeProvider
		.when('/polls', { 
			templateUrl: 'views/list.html',
			controller: 'PollListCtrl'
		})
		.when('/poll/:pollId', { 
			templateUrl: 'views/item.html', 
			controller: 'PollItemCtrl' 
		})
		.when('/new', { 
			templateUrl: 'views/new.html', 
			controller: 'PollNewCtrl' 
		})
		.otherwise({ 
			redirectTo: '/polls' 
		});
	}]);