
// read socket port from input args array
var port = process.argv[2];

// create a server
var server = require('http').createServer(function(req, res) {
});

// hook up socket.io on the created server
var io = require('socket.io')(server);


// start listening on given port
server.listen(port);


// incoming connection handler
io.on('connection', (socket) => {
    console.log('New connection established ' + socket.id);

    // 'join' event handler
    socket.on('join', (object) => {
        client_uuid = object.client_uuid;

        // users join their room
        socket.join(client_uuid);
        socket.username = client_uuid;

        console.log('Client joined: ' + client_uuid);

        // join acknowledgement
        socket.emit('joined', {
            socket_id: socket.id
        });
    });

    // 'new_msg' event handler
    socket.on('new_msg', (object) => {
        console.log('New message received ' + JSON.stringify(object));

        var message = object.message;
        var recipient = object.recipient;

        // deliver message to recipient
        console.log('Broadcasting message to: ' + recipient);
        io.to(recipient).emit('new_msg', {
            message: message,
            sender: socket.username
        });
    });
});
