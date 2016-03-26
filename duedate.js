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
        var parameters = {pageToken: pageToken, tasklist: tasklist.id, showDeleted: true};
        $window.gapi.client.tasks.tasks.list(parameters).then(function(response) {
            if ('items' in response.result) {
                response.result.items.forEach(function(element) {
                    $scope.tasks.push(element);
                });
            }
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
    * Return a Tasklist object which contains the specified task
    *
    * @param {Task} task
    * @return {Tasklist}
    */
    $scope.taskTasklist = function(task) {
        var tasklistID = /\/lists\/(.*)\/tasks\//.exec(task.selfLink)[1];
        for (var i=0; i<$scope.tasklists.length; i++) {
            if ($scope.tasklists[i].id === tasklistID) {
                return $scope.tasklists[i];
            }
        }
    };

    /**
    * Used to filter out tasks that are not in specified tasklist
    *
    * @param {Tasklist} tasklist
    */
    $scope.isTaskInTasklist = function(tasklist) {
        return function(task) {
            if (!task.deleted && tasklist === 'all') {
                return true;
            } else if (!task.deleted && tasklist.id === $scope.taskTasklist(task).id) {
                return true;
            } else if (task.deleted && tasklist === 'trash') {
                return true;
            } else {
                return false;
            }
        };
    };

    /**
    * Inserts a new tasklist
    *
    * @param {String} tasklistTitle
    */
    $scope.tasklistsInsert = function(tasklistTitle) {
        $scope.data.tasklistInput = '';
        if (tasklistTitle) {
            var parameters = {title: tasklistTitle};
            $window.gapi.client.tasks.tasklists.insert(parameters).then(function(response) {
                $scope.tasklists.push(response.result);
            });
        }
    };

    /**
    * Deletes a tasklist
    *
    * @param {Tasklist} tasklist
    */
    $scope.tasklistsDelete = function(tasklist) {
        var parameters = {tasklist: tasklist.id};
        $window.gapi.client.tasks.tasklists.delete(parameters).then(function(response) {
            $scope.tasklists.splice($scope.tasklists.indexOf(tasklist), 1);
        });
    };

    /**
    * Patches the title of a tasklist
    *
    * @param {Tasklist} tasklist
    * @param {String} tasklistNewName
    */
    $scope.tasklistsPatchTitle = function(tasklist, tasklistNewTitle) {
        var parameters = {tasklist: tasklist.id, title: tasklistNewTitle};
        $window.gapi.client.tasks.tasklists.patch(parameters).then(function(response) {
            tasklist.title = response.result.title;
        });
    };

    /**
    * Inserts a new task
    *
    * @param {Tasklist} tasklist
    * @param {String} taskTitle
    */
    $scope.tasksInsert = function(tasklist, taskTitle) {
        $scope.data.taskInput = '';

        if (taskTitle) {
            var parameters = {title: taskTitle};
            if (tasklist.id) {
                parameters.tasklist = tasklist.id;
            } else {
                parameters.tasklist = '@default';
            }
            $window.gapi.client.tasks.tasks.insert(parameters).then(function(response) {
                $scope.tasks.push(response.result);
            });
        }
    };

    /**
    * Deletes a task
    *
    * @param {Task} task
    */
    $scope.tasksDelete = function(task) {
        var parameters = {tasklist: $scope.taskTasklist(task).id, task: task.id};
        $window.gapi.client.tasks.tasks.delete(parameters).then(function(response) {
            $scope.tasks.splice($scope.tasks.indexOf(task), 1);
        });
    };

    /**
    * UnDeletes a task
    *
    * @param {Task} task
    */
    $scope.tasksUnDelete = function(task) {
        var parameters = {tasklist: $scope.taskTasklist(task).id, task: task.id, deleted: false};
        $window.gapi.client.tasks.tasks.patch(parameters).then(function(response) {
            task.deleted = false;
        });
    };

    /**
    * Patches the status of a task
    *
    * @param {Task} task
    */
    $scope.tasksPatchStatus = function(task) {
        var parameters = {tasklist: $scope.taskTasklist(task).id, task: task.id};

        if (task.status === 'completed') {
            parameters.completed = (new Date()).toISOString();
            parameters.status = 'completed';
        } else {
            parameters.completed = null;
            parameters.status = 'needsAction';
        }

        $window.gapi.client.tasks.tasks.patch(parameters).then(function(response) {
            task.completed = response.result.completed;
            task.status = response.result.status;
        });
    };

    /**
    * Patches multiple parameters of a task
    *
    * @param {Task} task
    * @param {String} taskNewTitle
    * @param {Tasklist} taskNewTasklist
    * @param {String} taskNewNotes
    * @param {String} taskNewDate
    */
    $scope.tasksPatch = function(task, taskNewTitle, taskNewTasklist, taskNewNotes, taskNewDate) {
        var parameters = {
            tasklist: $scope.taskTasklist(task).id,
            task: task.id,
            title: taskNewTitle,
            notes: taskNewNotes || null,
        };
        if (taskNewDate) {
            var date = new Date(Date.parse(taskNewDate));
            parameters.due = (new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))).toISOString();
        } else {
            parameters.due = null;
        }
        $window.gapi.client.tasks.tasks.patch(parameters).then(function(response) {
            task.title = response.result.title;
            task.notes = response.result.notes;
            task.due = response.result.due;
            if (taskNewTasklist !== $scope.taskTasklist(task)) {
                $scope.tasksModifyTasklist(task, taskNewTasklist);
            }
        });
    };

    /**
    * Move task from one tasklist to another
    *
    * @param {Task} task
    * @param {Tasklist} dstTasklist
    */
    $scope.tasksModifyTasklist = function(task, dstTasklist) {
        var parameters;

        // delete the task from srcTasklist
        parameters = {tasklist: $scope.taskTasklist(task).id, task: task.id};
        $window.gapi.client.tasks.tasks.delete(parameters).then(function(response) {
            $scope.tasks.splice($scope.tasks.indexOf(task), 1);
        });

        // insert the task in dstTasklist
        parameters = $.extend({tasklist: dstTasklist.id}, task);
        parameters.id = undefined;
        parameters.selfLink = undefined;
        $window.gapi.client.tasks.tasks.insert(parameters).then(function(response) {
            $scope.tasks.push(response.result);
        });
    };
});
