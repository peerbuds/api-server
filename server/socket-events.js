var users = [];               // Array that will hold the user object(s)
var app = require('./server');

exports = module.exports = function (io) {

    app.io.on('connection', function (socket) {

        socket.on('subscribe', function (room) {
            console.log('joining room', room);
            socket.join(room);
        });

        socket.on('add user', function (user) {

            try {

                //console.log("adding user"+JSON.stringify(user, null, 4));
                console.log("\n\n\n\n\n//**** Connecting user " + user.fullName + " id:" + user.id + " to socket " + socket.id + "****//");
                socket.userId = user.id;
                var connUser = findById(users, user.id);
                if (connUser != undefined) {                  //user is already connected from some location
                    if (findById(connUser.socketConns, socket.id) == undefined) {
                        connUser.socketConns.push(socket.id);       // Store this socket reference as well for this user
                    }
                } else {

                    var userSockets = new Array();
                    userSockets.push(socket.id);    // Store a reference to your socket as there could be multiple socket for same user.
                    user.socketConns = userSockets;
                    users.push(user);         // Store this newly connected user in global users connection list
                }

                //currently connected user
                printConnectedUsers();

            } catch (err) {
                console.log("add user err ::" + err);
            }
        });

        socket.on('disconnect', function () {

            try {
                var disconnectingUser = null;

                for (var i = 0; i < users.length; i++) {

                    disconnectingUser = users[i];

                    if (disconnectingUser.id == socket.userId) {

                        console.log("Disconnecting " + disconnectingUser.fullName);

                        if (disconnectingUser.socketConns.length > 1) {
                            for (var j = 0; j < disconnectingUser.socketConns.length; j++) {
                                if (disconnectingUser.socketConns[j] == socket.id) {
                                    disconnectingUser.socketConns.splice(j, 1);
                                }
                            }
                        } else {
                            //remove from user
                            users.splice(i, 1);
                        }

                        console.log('Disconnected');
                    }
                }

                //currently connected user
                printConnectedUsers();

            } catch (err) {
                console.log("disconnect err ::" + err);
            }
        });

        socket.on('message', function (messageNotification) {
            console.log('MessageNotification', messageNotification);
            sendNotification(messageNotification);
        });

        socket.on('got reply', function (replyNotification) {
            console.log('ReplyNotification', replyNotification);
        });

        socket.on('session booked', function (sessionNotification) {
            console.log('SessionNotification', sessionNotification);
        });

        socket.on('action on session', function (sessionNotification) {
            console.log('SessionNotification', sessionNotification);
        });

        socket.on('verified', function (verifiedNotification) {
            console.log('VerifiedNotification', verifiedNotification);
        });

        socket.on('reminder', function (reminderNotification) {
            console.log('ReminderNotification', reminderNotification);
        });

        function sendNotification(notification) {
            for (var i = 0; i < users.length; i++) {
                if (users[i].id == notification.to.id) {
                    var toUser = users[i];
                    var notificationService = app.models.notification;
                    var toId = notification.to.id;
                    notification.to = JSON.stringify(notification.to);
                    notificationService.createNotification(toId, notification, function (err, saved_notification) {
                        if (!err) {
                            for (var j = 0; j < toUser.socketConns.length; j++) {
                                app.io.to(toUser.socketConns[j]).emit("notification", notification);
                            }
                        }
                    });
                }
            }
        }
    });


    /**
     * Fn to find an Object based on some id from the given source
     * @param source
     * @param id
     * @returns
     */
    function findById(source, id) {
        try {
            var resultObj = undefined;
            for (var i = 0; i < source.length; i++) {
                if (source[i].id == id)
                    resultObj = source[i];
            }
            return resultObj;
        } catch (e) {
            console.log("err findById : " + e);
        }
    }

    function printConnectedUsers() {
        try {
            var log = "";
            if (users.length) {
                log += "\n///////*****************************************///////";
                log += "\n///////********** Connected Users **************///////";
                log += "\n///////*****************************************///////";
                var userCount = 1;
                for (var i = 0; i < users.length; i++) {
                    // log += JSON.stringify(users[i]);
                    log += "\n\t" + (userCount++) + ") " + users[i].fullName
                        + " Sockets(";
                    for (var j = 0; j < users[i].socketConns.length; j++) {
                        log += users[i].socketConns[j] + ", ";
                    }
                    log += "), SessionSocket(" + users[i].sessionSocketId + ")";
                }
                log += "\n///////*****************************************///////";
                log += "\n";
            } else {
                log += "\n////**********Currently no user connected******////////";
            }
            console.log(log);
        } catch (e) {
            console.log("In printConnectedUsers catch " + e);
        }
    }
}