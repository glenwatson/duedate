var duedateApp = angular.module('duedateApp', []);

duedateApp.controller('tasklistCtrl', function ($scope, $window) {
    setInterval(function() {
        $scope.$apply()
    }, 500);

    $scope.tasklists = [];

    (function tasklistsGet(pageToken) {
        console.log('tasklistGet');
        function tasklistGetTasks(tasklistID, pageToken) {
            params = {};
            if (pageToken) {
                params = {pageToken: pageToken};
            }
            $window.gapi.client.request({
                path: '/tasks/v1/lists/' + tasklistID + '/tasks',
                callback: function(resp) {
                    var tasklistIndex = $scope.tasklists.map(function(e) {return e.id}).indexOf(tasklistID);
                    for (var i in resp.items) {
                        if (tasklistIndex != -1) {
                            $scope.tasklists[tasklistIndex].tasks.push(resp.items[i]);
                        }
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
                resp.items[i].tasks = [];
                $scope.tasklists.push(resp.items[i]);
                tasklistGetTasks(resp.items[i].id, '');
            }
            if ('nextPageToken' in resp) {
                tasklistsGet(resp.nextPageToken);
            }
        });
    })('');

    $scope.tasklistInsert = function(tasklistName) {
        $scope.tasklistInput = '';
        if (tasklistName) {
            $window.gapi.client.tasks.tasklists.insert({
                title: tasklistName,
            }).execute(function(resp) {
                resp.result.tasks = [];
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
                    var tasklistIndex = $scope.tasklists.map(function(e) {return e.id}).indexOf(tasklistID);
                    $scope.tasklists.splice(tasklistIndex, 1);
                } else {
                    console.log(resp);
                }
            },
        });
    };

    $scope.taskInsert = function(tasklistID, taskName) {
        $scope.data.taskInput = '';
        if (taskName) {
            $window.gapi.client.request({
                path: '/tasks/v1/lists/' + tasklistID + '/tasks',
                method: 'POST',
                body: {title: taskName},
                callback: function(resp) {
                    var tasklistIndex = $scope.tasklists.map(function(e) {return e.id}).indexOf(tasklistID);
                    $scope.tasklists[tasklistIndex].tasks.push(resp);
                },
            });
        }
    };

    $scope.taskDelete = function(tasklistID, taskID) {
        $window.gapi.client.request({
            path: '/tasks/v1/lists/' + tasklistID + '/tasks/' + taskID,
            method: 'DELETE',
            callback: function(resp) {
                if (!resp) {
                    var tasklistIndex = $scope.tasklists.map(function(e) {return e.id}).indexOf(tasklistID);
                    var taskIndex = $scope.tasklists[tasklistIndex].tasks.map(function(e) {return e.id}).indexOf(taskID);
                    $scope.tasklists[tasklistIndex].tasks.splice(taskIndex, 1);
                } else {
                    console.log(resp);
                }
            },
        });
    };
});
