
/*
 * This JavaScript file is strictly for implemen-
 * tations on the view file: resources/views/chat.blade.php
 */

$(document).ready(function() {
    // DOM refrences
    var conversation_body = $('#conversation_body');
    var text_message_box = $('#text_message_box');
    var send_message_btn = $('#send_message_btn');

    // get websocket host url and port
    var sock_url = $('#sock_url').val();
    var sock_port = $('#sock_port').val();

    // get user and recipient uuid
    var user_uuid = $('#user_uuid').val();
    var rcpt_uuid = $('#rcpt_uuid').val();

    function disable_conversation_components() {
        conversation_body.attr('disabled', 'disabled');
        text_message_box.attr('disabled', 'disabled');
        send_message_btn.attr('disabled', 'disabled');
    }

    function enable_conversation_components() {
        conversation_body.removeAttr('disabled');
        text_message_box.removeAttr('disabled');
        send_message_btn.removeAttr('disabled');
    }

    // socket server end point
    var end_point = sock_url + ':' + sock_port;

    disable_conversation_components();

    // establish websocket connection
    console.log('Connecting websocket ' + end_point);
    var socket = io.connect(end_point);

    // 'joined' event handler
    socket.on('joined', (object) => {
        var socket_id = object.socket_id;
        
        enable_conversation_components();
    });

    // 'new_msg' event handler
    socket.on('new_msg', (object) => {
        console.log('New message received ' + JSON.stringify(object));

        var message = object.message;
        var sender = object.sender;

        // user is interested in messages from recipient only
        if (sender === rcpt_uuid)
        {
            // add received message to conversation body
            conversation_body.append("<p class='message_box message_box_them'>" + message + "</p><br/><br/><br/>");
        }
    });

    // join room
    console.log('Joining room');
    socket.emit('join', {
        client_uuid: user_uuid
    });

    // scroll down conversations smoothly
    function scroll_down_conversation_body() {
        var distance_to_scroll = 
                conversation_body.height() + conversation_body.scrollTop();
        
        var scroll_smoothness = 500;

        // scroll down
        conversation_body.animate(
            {scrollTop: distance_to_scroll}, scroll_smoothness
        );
    };

    // send new message
    send_message_btn.click(function() {
        var message = text_message_box.val();

        // abort on empty message
        if (message === '')
        {
            return false;
        }

        console.log('Sending new message');

        // send
        socket.emit('new_msg', {
            message: message,
            recipient: rcpt_uuid
        });
        
        // add message to conversation body
        conversation_body.append("<p class='message_box message_box_you'>" + message + "</p><br/><br/><br/>");

        scroll_down_conversation_body();

        // clear the message textbox
        text_message_box.val('');
    });
});
