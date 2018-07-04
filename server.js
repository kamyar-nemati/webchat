
var server = require('http').createServer(function(req, res) {
});

var io = require('socket.io')(server);


server.listen(6789);


io.on('connection', (socket) => {
    console.log('New connection established ' + socket.id);

    socket.on('join', (object) => {
        client_uuid = object.client_uuid;

        socket.join(client_uuid);
        socket.username = client_uuid;

        console.log('Client joined: ' + client_uuid);
    });

    socket.on('new_msg', (object) => {
        console.log('New message received ' + JSON.stringify(object));

        var message = object.message;
        var recipient = object.recipient;

        console.log('Broadcasting message to: ' + recipient);
        io.to(recipient).emit('new_msg', {
            message: message,
            sender: socket.username
        });
    });
});
