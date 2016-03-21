var duedateApp = angular.module('duedateApp', []);

var init = function() {
    window.checkAuth(true);
};

duedateApp.controller('tasklistCtrl', function ($scope, $window) {
    var CLIENT_ID = '954795491695-9pop5kva3tg9ontq87j2lg7oc0fgrv69.apps.googleusercontent.com';
    var SCOPE = 'https://www.googleapis.com/auth/tasks';

    $scope.authenticated = undefined;

    $scope.checkAuth = $window.checkAuth = function(immediate) {
        $window.gapi.auth.authorize({
            client_id: CLIENT_ID,
            scope: SCOPE,
            immediate: immediate
        }, handleAuthResult);
    };

    var handleAuthResult = function(authResult) {
        if (authResult && !authResult.error) {
            $scope.authenticated = true;
            $window.gapi.client.load('tasks', 'v1', postInitiation);
        } else {
            $scope.authenticated = false;
        }
    };

    setInterval(function() {
        $scope.$apply();
    }, 500);

    $scope.tasklists = [];
    $scope.tasks = [];
    $scope.defaultTasklistID = null;

    function tasksList(tasklist, pageToken) {
        var parameters = {pageToken: pageToken, tasklist: tasklist.id};
        $window.gapi.client.tasks.tasks.list(parameters).then(function(response) {
            response.result.items.forEach(function(element) {
                $scope.tasks.push(element);
            });
            if ('nextPageToken' in response.result) {
                tasksList(tasklist, response.result.nextPageToken);
            }
        });
    }

    function tasklistsList(pageToken) {
        var parameters = {pageToken: pageToken};
        $window.gapi.client.tasks.tasklists.list(parameters).then(function(response) {
            response.result.items.forEach(function(element) {
                $scope.tasklists.push(element);
                tasksList(element, null);
            });
            if ('nextPageToken' in response.result) {
                tasklistsList(response.result.nextPageToken);
            }
        });
    }

    var postInitiation = function() {
        $window.gapi.client.tasks.tasklists.get({tasklist: '@default'}).then(function(response) {
            $scope.defaultTasklistID = response.result.id;
            tasklistsList(null);
        });
    };

    /**
    * Returns the tasklist ID from a task selfLink
    *
    * @param {String} selfLink
    * @return {String} tasklistID
    */
    $scope.getTasklistID = function(task) {
        var tasklistID = /\/lists\/(.*)\/tasks\//.exec(task.selfLink);

        if (tasklistID) {
            return tasklistID[1];
        }

        return tasklistID;
    };

    $scope.isTaskInTasklist = function(tasklist) {
        return function(task) {
            return tasklist.id == $scope.getTasklistID(task);
        };
    };

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

    /**
    * Patches the title of a tasklist
    *
    * @param {Tasklist} tasklist
    * @param {String} tasklistNewName
    */
    $scope.tasklistsPatchTitle = function(tasklist, tasklistNewTitle) {
        $scope.data.tasklistNewTitle = '';

        var parameters = {tasklist: tasklist.id, title: tasklistNewTitle};
        $window.gapi.client.tasks.tasklists.patch(parameters).then(function(response) {
            tasklist.title = response.result.title;
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
        if (newTaskDate) {
            task.due = newTaskDate.toISOString();
        } else {
            task.due = undefined;
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

    /**
    * Switches task from one tasklist to another.
    *
    * @param {Task} task
    * @param {Tasklist} srcTasklist
    * @param {Tasklist} dstTasklist
    */
    $scope.tasksUpdateTasklist = function(task, srcTasklist, dstTasklist) {
        var parameters;

        // delete the task from srcTasklist
        parameters = {tasklist: srcTasklist.id, task: task.id};
        $window.gapi.client.tasks.tasks.delete(parameters).then(function(response) {
            var taskIndex = srcTasklist.tasks.map(function(e) {return e.id;}).indexOf(task.id);
            srcTasklist.tasks.splice(taskIndex, 1);
        });

        // insert the task in dstTasklist
        parameters = {tasklist: dstTasklist.id, title: task.title, status: task.status, due: task.due};
        $window.gapi.client.tasks.tasks.insert(parameters).then(function(response) {
            dstTasklist.tasks.push(response.result);
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
