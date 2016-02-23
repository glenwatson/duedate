var duedateApp = angular.module('duedateApp', []);

duedateApp.controller('tasklistCtrl', function ($scope, $window) {
    setInterval(function() {
        $scope.$apply()
    }, 500);

    $scope.tasklists = {};

    (function tasklistsGet(pageToken) {
        function tasklistGetTasks(tasklistID, pageToken) {
            params = {};
            if (pageToken) {
                params = {pageToken: pageToken};
            }
            $window.gapi.client.request({
                path: '/tasks/v1/lists/' + tasklistID + '/tasks',
                callback: function(resp) {
                    for (var i in resp.items) {
                        $scope.tasklists[tasklistID].tasks[resp.items[i].id] = resp.items[i];
                    }
                    if ('nextPageToken' in resp) {
                        tasklistGetTasks(tasklistID, resp.nextPageToken);
                    }
                }
            });
        }

        params = {};
        if (pageToken) {
            params = {pageToken: pageToken};
        }
        $window.gapi.client.tasks.tasklists.list(params).execute(function(resp) {
            for (var i in resp.items) {
                $scope.tasklists[resp.items[i].id] = resp.items[i];
                $scope.tasklists[resp.items[i].id].tasks = {};
                tasklistGetTasks(resp.items[i].id, '');
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
                $scope.tasklists[resp.result.id] = resp.result;
            });
        }
    };

    $scope.tasklistDelete = function(tasklistID) {
        console.log(tasklistID);
        $window.gapi.client.request({
            path: '/tasks/v1/users/@me/lists/' + tasklistID,
            method: 'DELETE',
            callback: function(resp) {
                if (!resp) {
                    delete $scope.tasklists[tasklistID]
                } else {
                    console.log(resp);
                }
            },
        });
    };
});
