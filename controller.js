var duedateApp = angular.module('duedateApp', []);

duedateApp.controller('tasklistCtrl', function ($scope, $window) {
    setInterval(function() {
        $scope.$apply()
    }, 500);

    $scope.tasklists = [];

    (function tasklistsGet(pageToken) {
        params = {};
        if (pageToken) {
            params = {pageToken: pageToken};
        }
        $window.gapi.client.tasks.tasklists.list(params).execute(function(resp) {
            for (var i in resp.items) {
                $scope.tasklists.push(resp.items[i]);
            }
            if ('nextPageToken' in resp) {
                tasklistsGet(resp.nextPageToken);
            }
        });
    })('');

    $scope.tasklistAdd = function(tasklistName) {
        $scope.tasklistInput = '';
        if (tasklistName) {
            $window.gapi.client.tasks.tasklists.insert({
                title: tasklistName,
            }).execute(function(resp) {
                $scope.tasklists.push(resp.result);
            });
        }
    };

    $scope.tasklistDelete = function(tasklistID) {
        $window.gapi.client.request({
            path: '/tasks/v1/users/@me/lists/' + tasklistID,
            method: 'DELETE',
            callback: function(resp) {
                if (!resp) {
                    for (var i=0; i<$scope.tasklists.length; i++) {
                        if ($scope.tasklists[i].id == tasklistID) {
                            $scope.tasklists.splice(i, 1);
                            break;
                        }
                    }
                } else {
                    console.log(resp);
                }
            },
        });
    };
});
