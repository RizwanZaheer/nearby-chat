var constants = {
    appName: 'ChatNearby'
}

var App = angular
  .module(constants.appName, [
    'angular-meteor',
    'ionic',
    'angularMoment'
  ]);

if (Meteor.isCordova) {
    angular.element(document).on('deviceready', onReady);
}
else {
    angular.element(document).ready(onReady);
}

function onReady() {
    angular.bootstrap(document, [constants.appName]);
}

App.config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('tab', {
          url: '/tab',
          abstract: true,
          templateUrl: 'client/templates/tabs.html'
      })
      .state('tab.chats', {
          url: '/chats',
          views: {
              'tab-chats': {
                  templateUrl: 'client/templates/chats.html',
                  controller: 'ChatsCtrl'
              }
          }
      })
      .state('tab.chat-detail', {
          url: '/chats/:chatId',
          views: {
              'tab-chats': {
                  templateUrl: 'client/templates/chat-detail.html',
                  controller: 'ChatDetailCtrl'
              }
          }
      })
      .state('tab.friends', {
          url: '/friends',
          views: {
              'tab-friends': {
                  templateUrl: 'client/templates/friends.html',
                  controller: 'FriendsCtrl'
              }
          }
      })
      .state('tab.discover', {
          url: '/discover',
          views: {
              'tab-discover': {
                  templateUrl: 'client/templates/discover.html',
                  controller: 'DiscoverCtrl'
              }
          }
      });

    $urlRouterProvider.otherwise('tab/chats');
});


App.controller('ChatsCtrl',
function ($scope) {
    $scope.remove = function (chat) {
        $scope.chats.remove(chat);
    };

    $scope.chats = $scope.$meteorCollection(Chats, true).subscribe("myChats");

});


App.filter('calendar',
    function () {
        return function (time) {
            if (!time) return;

            return moment(time).calendar(null, {
                lastDay: '[Yesterday]',
                sameDay: 'LT',
                lastWeek: 'dddd',
                sameElse: 'DD/MM/YY'
            });
        }
    });


App.controller('FriendsCtrl',
function ($scope) {
    $scope.remove = function (friend) {
        $scope.friends.remove(friend);
    };

    $scope.friends = $scope.$meteorCollection(Friends, false);
});

App.controller('ChatDetailCtrl',
function ($scope, $stateParams, $timeout, $ionicScrollDelegate, $meteor) {
    var chatId = $stateParams.chatId;
    var isIOS = ionic.Platform.isWebView() && ionic.Platform.isIOS();

    $scope.chat = $meteor.object(Chats, chatId, true).subscribe('chat', chatId);
    $scope.messages = $scope.$meteorCollection(function () {
        return Messages.find({ chatId: chatId });
    }, true).subscribe('messages', chatId);

    $scope.data = {};
    $scope.sendMessage = sendMessage;
    $scope.inputUp = inputUp;
    $scope.inputDown = inputDown;
    $scope.closeKeyboard = closeKeyboard;

    $scope.$watchCollection('messages', function (oldVal, newVal) {
        var animate = oldVal.length !== newVal.length;
        $ionicScrollDelegate.$getByHandle('chatScroll').scrollBottom(animate);
    });

    function sendMessage() {
        if (_.isEmpty($scope.data.message)) {
            return;
        }

        var newMessage = {
            text: $scope.data.message,
            chatId: chatId,
            fromId: Meteor.userId()
        }

        $scope.messages.save(newMessage).then(function (saved) {

            if (saved.length) {
                delete $scope.data.message;
            }
        }, function () {

            // @todo
        })

        
    }

    function inputUp() {
        if (isIOS) {
            $scope.data.keyboardHeight = 216;
        }

        $timeout(function () {
            $ionicScrollDelegate.$getByHandle('chatScroll').scrollBottom(true);
        }, 300);
    }

    function inputDown() {
        if (isIOS) {
            $scope.data.keyboardHeight = 0;
        }

        $ionicScrollDelegate.$getByHandle('chatScroll').resize();
    }

    function closeKeyboard() {
        // cordova.plugins.Keyboard.close();
    }
});

App.controller('DiscoverCtrl',
function ($scope, $stateParams, $rootScope, $state) {
    $scope.guests = $scope.$meteorCollection(function () {
        // all the guests except it self
        return Meteor.users.find({ _id: { $ne: $rootScope.currentUser ? $rootScope.currentUser._id : undefined } })

    }, false).subscribe('guests');
    $scope.chats = $scope.$meteorCollection(Chats, true).subscribe("myChats");

    $scope.chatWithGuest = function (guest) {
        // check if ther is a chat with this guest
        // otherwise create new chat

        var existingChat = false;
        _.each($scope.chats, function (chat) {

            if (chat.chatWith.id == guest._id) {
                existingChat = chat._id;
            }
        });

        if (existingChat) {
            $state.go('tab.chat-detail', { chatId: existingChat });
        }
        else {

            var newChat = {
                userId: Meteor.userId(),
                chatWith: {
                    name: guest.username,
                    id: guest._id
                }
            }

            $scope.chats.save(newChat).then(function (saved) {
                if (saved.length) {
                    var newChatId = saved[0]._id;
                    $state.go('tab.chat-detail', { chatId: newChatId });
                }
            }, function () {
                //@todo
            });
        }
    }
});



App.directive('input', function ($timeout) {
    var directive = {
        restrict: 'E',
        scope: {
            'returnClose': '=',
            'onReturn': '&',
            'onFocus': '&',
            'onBlur': '&'
        },
        link: link
    };
    return directive;

    ////////////

    function link(scope, element, attrs) {
        element.bind('focus', function (e) {
            if (scope.onFocus) {
                $timeout(function () {
                    scope.onFocus();
                });
            }
        });

        element.bind('blur', function (e) {
            if (scope.onBlur) {
                $timeout(function () {
                    scope.onBlur();
                });
            }
        });

        element.bind('keydown', function (e) {
            if (e.which == 13) {
                if (scope.returnClose) {
                    element[0].blur();
                }

                if (scope.onReturn) {
                    $timeout(function () {
                        scope.onReturn();
                    });
                }
            }
        });
    }
});