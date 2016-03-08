var duedateApp = angular.module('duedateApp', ['ngMaterial']);

duedateApp.controller('tasklistCtrl', function ($scope, $window) {
    setInterval(function() {
        $scope.$apply();
    }, 500);

    $scope.tasklists = [];

    function tasksList(tasklist, pageToken) {
        var parameters = {tasklist: tasklist.id};
        if (pageToken) {
            params.pageToken = pageToken;
        }
        $window.gapi.client.tasks.tasks.list(parameters).execute(function(resp) {
            for (var i in resp.items) {
                tasklist.tasks.push(resp.items[i]);
            }
            if ('nextPageToken' in resp) {
                tasksList(tasklist, resp.nextPageToken);
            }
        });
    }

    function tasklistsList(pageToken) {
        var parameters = {};
        if (pageToken) {
            params.pageToken = pageToken;
        }
        $window.gapi.client.tasks.tasklists.list(parameters).execute(function(resp) {
            for (var i in resp.items) {
                var tasklist = resp.items[i];
                tasklist.tasks = [];
                tasksList(tasklist, '');
                $scope.tasklists.push(tasklist);
            }
            if ('nextPageToken' in resp) {
                tasklistsList(resp.nextPageToken);
            }
        });
    }

    tasklistsList('');

    $scope.tasklistsTotal = function() {
        return $scope.tasklists.reduce(function(a, b) {return a + b.tasks.length;}, 0);
    };

    $scope.tasklistsInsert = function(tasklistName) {
        $scope.data.tasklistInput = '';
        if (tasklistName) {
            $window.gapi.client.tasks.tasklists.insert({
                title: tasklistName,
            }).execute(function(resp) {
                resp.result.tasks = [];
                $scope.tasklists.push(resp.result);
            });
        }
    };

    $scope.tasklistsDelete = function(tasklistID) {
        $window.gapi.client.request({
            path: '/tasks/v1/users/@me/lists/' + tasklistID,
            method: 'DELETE',
            callback: function(resp) {
                if (!resp) {
                    var tasklistIndex = $scope.tasklists.map(function(e) {return e.id;}).indexOf(tasklistID);
                    $scope.tasklists.splice(tasklistIndex, 1);
                } else {
                    console.log(resp);
                }
            },
        });
    };

    $scope.tasksInsert = function(tasklistID, taskName, taskDueDate) {
        $scope.data.taskDateInput = null;
        $scope.data.taskInput = '';
        if (taskName) {
            $window.gapi.client.request({
                path: '/tasks/v1/lists/' + tasklistID + '/tasks',
                method: 'POST',
                body: {title: taskName, due: taskDueDate},
                callback: function(resp) {
                    var tasklistIndex = $scope.tasklists.map(function(e) {return e.id;}).indexOf(tasklistID);
                    $scope.tasklists[tasklistIndex].tasks.push(resp);
                },
            });
        }
    };

    $scope.tasksDelete = function(task) {
        $window.gapi.client.request({
            path: task.selfLink,
            method: 'DELETE',
            callback: function(resp) {
                if (!resp) {
                    var tasklistID = /lists\/(.*)\/tasks/.exec(task.selfLink)[1];
                    var tasklistIndex = $scope.tasklists.map(function(e) {return e.id;}).indexOf(tasklistID);
                    var taskIndex = $scope.tasklists[tasklistIndex].tasks.map(function(e) {return e.id;}).indexOf(task.id);
                    $scope.tasklists[tasklistIndex].tasks.splice(taskIndex, 1);
                } else {
                    console.log(resp);
                }
            },
        });
    };

    $scope.tasksUpdateName = function(task, taskNewName, event) {
        event.target.blur();
        task.title = taskNewName;
        $window.gapi.client.request({
            path: task.selfLink,
            method: 'PUT',
            body: task,
            callback: function(resp) {
                if (resp) {
                    task = resp;
                } else {
                    console.log(resp);
                }
            },
        });
    };

    $scope.tasksUpdateDate = function(task, newTaskDate) {
        $scope.data.taskDateModify = null;
        task.due = newTaskDate;
        $window.gapi.client.request({
            path: task.selfLink,
            method: 'PUT',
            body: task,
            callback: function(resp) {
                if (resp) {
                    task = resp;
                } else {
                    console.log(resp);
                }
            },
        });
    };

    $scope.tasksUpdateStatus = function(task) {
        if (task.status == 'completed') {
            task.completed = (new Date()).toISOString();
        } else {
            task.completed = undefined;
        }
        $window.gapi.client.request({
            path: task.selfLink,
            method: 'PUT',
            body: task,
            callback: function(resp) {
                if (resp) {
                    task = resp;
                } else {
                    console.log(resp);
                }
            },
        });
    };
});
