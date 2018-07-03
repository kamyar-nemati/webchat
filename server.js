
var server = require('http').createServer(function(req, res) {
});

var io = require('socket.io')(server);


server.listen(6789);


io.on('connection', (socket) => {
    console.log('New connection: ' + socket.id);

    socket.on('join', (user_uuid) => {
        socket.join(user_uuid);
        socket.username = user_uuid;

        console.log('Client joined: ' + user_uuid);
    });

    socket.on('new_msg', (data) => {
        console.log('New message: ' + JSON.stringify(data));

        var message = data.message;
        var recipient = data.recipient;

        io.to(recipient).emit('new_msg', {
            message: message,
            sender: socket.username
        });
    });
});
