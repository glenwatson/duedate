var duedateApp = angular.module('duedateApp', []);

duedateApp.controller('tasklistCtrl', function ($scope, $window) {
    setInterval(function() {
        $scope.$apply();
    }, 500);

    $scope.tasklists = [];
    $scope.defaultTasklist = null;

    function tasksList(tasklist, pageToken) {
        var parameters = {pageToken: pageToken, tasklist: tasklist.id};
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
        var parameters = {pageToken: pageToken};
        $window.gapi.client.tasks.tasklists.list(parameters).execute(function(resp) {
            for (var i in resp.items) {
                var tasklist = resp.items[i];
                tasklist.tasks = [];
                tasksList(tasklist, null);
                $scope.tasklists.push(tasklist);
                if (tasklist.id === $scope.defaultTasklist) {
                    $scope.defaultTasklist = tasklist;
                }
            }
            if ('nextPageToken' in resp) {
                tasklistsList(resp.nextPageToken);
            }
        });
    }

    $window.gapi.client.tasks.tasklists.get({tasklist: '@default'}).then(function(response) {
        $scope.defaultTasklist = response.result.id;
        tasklistsList(null);
    });

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

    $scope.tasklistsDelete = function(tasklist) {
        var parameters = {tasklist: tasklist.id};
        $window.gapi.client.tasks.tasklists.delete(parameters).execute(function(resp) {
            if (resp) {
                $scope.tasklists.splice($scope.tasklists.indexOf(tasklist), 1);
            } else {
                console.log(resp);
            }
        });
    };

    $scope.tasksInsert = function(tasklist, taskName) {
        if (tasklist === 'all') {
            tasklist = $scope.defaultTasklist;
        }
        $scope.data.taskInput = '';
        if (taskName) {
            var parameters = {tasklist: tasklist.id, title: taskName};
            $window.gapi.client.tasks.tasks.insert(parameters).execute(function(resp) {
                tasklist.tasks.push(resp.result);
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

    $scope.tasksUpdateName = function(task, event) {
        event.target.blur();
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
        task.due = newTaskDate.toISOString();
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

duedateApp.directive('taskDate', function() {
    return function(scope, element, attrs) {
        angular.element(element).datepicker({
            autoclose: true,
            clearBtn: true,
            orientation: 'right',
            todayHighlight: true,
        });

        if ('due' in scope.task) {
            angular.element(element).datepicker('setUTCDate', new Date(Date.parse(scope.task.due)));
        }

        angular.element(element).datepicker().on('changeDate', function(e) {
            scope.tasksUpdateDate(scope.task, e.date);
        });
    };
});
