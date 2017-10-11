module.exports = function (app) {
    var helpers = require(__dirname + '/helpers');

    // HTTP get ======================================================================   
    app.get('/', function (req, res) {
        res.render('index');
    });

    app.get('/login', function (req, res) {
        res.render('login', { message: '' });
    });

    app.get('/logout', function (req, res) {
        app.emit('logout', req, res);
    });

    app.get('/register', function (req, res) {
        res.render('register', { message: '' });
    });

    app.get('/chatroom', requiredAuthentication, function (req, res) {
        res.render('chatroom',{user: req.session.user});
        // res.sendFile(__dirname + '/views/chatroom.html');
    });

    // HTTP post ======================================================================
    app.post('/register', function (req, res) {
        app.emit('registration', req, res);
    });

    app.post('/login', function (req, res) {
        app.emit('authentication', req, res);
    })

    

}
function requiredAuthentication(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        req.session.error = 'Access denied!';
        res.redirect('/login');
    }
}