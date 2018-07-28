
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
        socket.emit('joined', {});
    });

    // 'new_msg' event handler
    socket.on('new_msg', (object) => {
        console.log('New message received ' + JSON.stringify(object));

        var message_uuid = object.message_uuid;
        var message = object.message;
        var recipient = object.recipient;

        // deliver message to recipient
        console.log('Broadcasting message to: ' + recipient);
        io.to(recipient).emit('new_msg', {
            message_uuid: message_uuid,
            message: message,
            sender: socket.username
        });
    });

    // 'task_created' event handler
    socket.on('task_created', (object) => {
        console.log('New task notification received ' + JSON.stringify(object));

        var recipient = object.recipient;
        var task_uuid = object.task_uuid;
        var task_name = object.task_name;
        var task_owner = object.task_owner;

        // deliver task notification to recipient
        console.log('Broadcasting task creation notification to: ' + recipient);
        io.to(recipient).emit('task_created', {
            task_uuid: task_uuid,
            task_name: task_name,
            task_owner: task_owner
        });
    });

    // 'task_updated' event handler
    socket.on('task_updated', (object) => {
        console.log('Updated task notification received ' + JSON.stringify(object));

        var recipient = object.recipient;
        var task_uuid = object.task_uuid;
        var task_owner = object.task_owner;
        var task_name = object.task_name;

        // deliver task update notification to recipient
        console.log('Broadcasting task update notification to: ' + recipient);
        io.to(recipient).emit('task_updated', {
            task_uuid: task_uuid,
            task_name: task_name,
            task_owner: task_owner
        });
    });
});
