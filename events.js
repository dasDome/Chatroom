
module.exports = function (app) {
    var events = require('events');
    var formidable = require("formidable");
    var helpers = require(__dirname + '/helpers');
    var Datastore = require('nedb'), db = new Datastore({ filename: __dirname + '/.db', autoload: true });
    var active   = new Datastore({ filename: __dirname + '/.active', autoload: true });

    var dateFormat = require('dateformat');
    var now = new Date();
    // UserManagement Events======================================================================
    app.on('registration', function (req, res) {
        var form = new formidable.IncomingForm();
        form.parse(req, function (err, fields) {
            var password = fields.password;
            var username = fields.username;

            var passwordData = helpers.saltHashPassword(password, 0);
            var data = {
                username: username,
                salt: passwordData.salt,
                pw: passwordData.passwordHash
            }

            //make sure no empty entires will be made
            if (username == '' || password == '') {
                res.render('register', { message: ' Invalid Username or Password!' });
                return;
            }

            //make sure that username is unique 
            db.ensureIndex({ fieldName: 'username', unique: true }, function (err) {
            });

            db.findOne({ username: fields.username }, function (err, doc) {
                if (doc) {
                    res.render('register', { message: ' User with this Username allready exists!' });
                    return;
                } else {
                    db.insert(data, function (err, newDoc) {
                    });
                    res.redirect('/');
                }
            });
        });
    });

    app.on('authentication', function (req, res) {
        var form = new formidable.IncomingForm();
        form.parse(req, function (err, fields) {
            db.findOne({ username: fields.username }, function (err, doc) {
                if (doc) {
                    var passwordData = helpers.saltHashPassword(fields.password, doc.salt);
                    if (passwordData.passwordHash == doc.pw) {
                        req.session.regenerate(function () {
                            req.session.user = fields.username;
                            res.redirect('/chatroom');
                        });
                    }
                    else {
                        res.render('login', { message: ' Username or Password invalid!' });
                    }
                }
                else {
                    res.render('login', { message: ' Username or Password invalid!' });
                }
            });
        });
    });

    app.on('logout', function (req, res) {
        req.session.destroy(function (err) {
        })
        res.redirect('/');
    });

    // chat events ======================================================================

    app.on('addUserToList', function (socket, io) {
        active.ensureIndex({
            fieldName: 'onlineUser', unique: true,
        }, function (err) { });

        active.findOne({ onlineUser: socket.username }, function (err, doc) {
            if (doc) {
                // io.clients[doc.sessionId].disconnected();
                if (io.sockets.connected[doc.sessionId]) {
                    var oldsocket = io.sockets.connected[doc.sessionId];
                    oldsocket.emit('message', "DISCONNECTED!!!");
                    oldsocket.disconnect();

                }
                // console.log('NEU##########################' + io.sockets.connected[socket.id])
                active.update({ onlineUser: socket.username }, { $set: { sessionId: socket.id } }, function (err, numReplaced) {

                });
                // res.render('register', { message: ' User allready!' });
                return;
            } else {
                active.insert({ onlineUser: socket.username, sessionId: socket.id }, function (err, newDoc) {
                });
            }
        });
    });

    app.on('privateMessage', function (socket, io, rcv, msg) {
        // socket.emit('message', rcv + ': ' + msg);
        //    console.log(socket);
        active.findOne({ onlineUser: rcv }, function (err, doc) {
            if (doc) {
                var rcvsocket = io.sockets.connected[doc.sessionId]
                rcvsocket.emit('message', 'PRIVATE ' + socket.username + " at " + dateFormat(now) + ': ' + msg);
                return;
            }
            else {
                socket.emit('message', 'User with name ' + rcv + ' was not found or is not online');
            }
        });

    });
    app.on('listAllUsers', function (socket) {
         active.find({ }, function (err, docs) {
             for(i in docs){
                 socket.emit('message',docs[i].onlineUser);
             }
         });
    });
}




