
/*
 * This JavaScript file is strictly for implemen-
 * tations on the view file: resources/views/chat.blade.php
 */

$(document).ready(function() {
    // DOM refrences
    var sock_url = $('#sock_url').val();
    var sock_port = $('#sock_port').val();
    var user_uuid = $('#user_uuid').val();
    var rcpt_uuid = $('#rcpt_uuid').val();
    var conversation_body = $('#conversation_body');
    var text_message_box = $('#text_message_box');
    var send_message_btn = $('#send_message_btn');

    // socket server end point
    var end_point = sock_url + ':' + sock_port;

    console.log('Connecting websocket ' + end_point);
    var socket = io.connect(end_point);

    console.log('Joining');
    socket.emit('join', {
        client_uuid: user_uuid
    });

    function scroll_down_conversation() {
        var distance_to_scroll = 
                conversation_body.height() + conversation_body.scrollTop();
        
        var scroll_smoothness = 500;

        conversation_body.animate(
            {scrollTop: distance_to_scroll}, scroll_smoothness
        );
    };

    send_message_btn.click(function() {
        var message = text_message_box.val();

        // abort on empty message
        if (message === '')
        {
            return false;
        }

        console.log('Sending new message');

        socket.emit('new_msg', {
            message: message,
            recipient: rcpt_uuid
        });
        
        conversation_body.append("<p class='message_box message_box_you'>" + message + "</p><br/><br/><br/>");

        scroll_down_conversation();

        // clear the message textbox
        text_message_box.val('');
    });

    socket.on('new_msg', (object) => {
        console.log('New message received ' + JSON.stringify(object));

        var message = object.message;
        var sender = object.sender;

        // user is interested in messages from recipient only
        if (sender === rcpt_uuid)
        {
            conversation_body.append("<p class='message_box message_box_them'>" + message + "</p><br/><br/><br/>");
        }
    });
});
