var duedate = duedate || {};

duedate.CLIENT_ID = '954795491695-9pop5kva3tg9ontq87j2lg7oc0fgrv69.apps.googleusercontent.com';
duedate.SCOPES = ['https://www.googleapis.com/auth/tasks'];

function checkAuth() {
    gapi.auth.authorize({
        'client_id': duedate.CLIENT_ID,
        'scope': duedate.SCOPES.join(' '),
        'immediate': true
    }, duedate.handleAuthResult);
}

duedate.handleAuthResult = function(authResult) {
    var authorizeDiv = document.getElementById('authorize-div');
    if (authResult && !authResult.error) {
        authorizeDiv.style.display = 'none';
        duedate.loadTasksApi();
    } else {
        authorizeDiv.style.display = 'inline';
    }
};

duedate.handleAuthClick = function(event) {
    gapi.auth.authorize({
        client_id: duedate.CLIENT_ID,
        scope: duedate.SCOPES,
        immediate: false
    }, duedate.handleAuthResult);
    return false;
};

duedate.loadTasksApi = function() {
    gapi.client.load('tasks', 'v1', duedate.startAngular);
};

duedate.startAngular = function() {
    document.getElementById('app-div').style.display = "flex";
    angular.element(document).ready(function() {
        angular.bootstrap(document, ['duedateApp']);
    });
};
