@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row">
        <div class="col-md-8 col-md-offset-2">
            <div class="panel panel-default">
                <div class="panel-heading">Conversations with {{ $contact_name }}</div>

                <input type="hidden" id="sock_url" value="{{ config('app.socket_url', '') }}">
                <input type="hidden" id="sock_port" value="{{ config('app.socket_port', '') }}">
                <input type="hidden" id="user_uuid" value="{{ $user_uuid }}">
                <input type="hidden" id="rcpt_uuid" value="{{ $rcpt_uuid }}">

                <div class="panel-body" id="conversation_body">
                    @if (session('status'))
                        <div class="alert alert-success">
                            {{ session('status') }}
                        </div>
                    @endif

                    
                </div>
                <div class="panel-footer">
                    <input id="text_message_box" type="text">
                    <button id="send_message_btn">Send</button>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.js"></script>

<script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.1.1/socket.io.js"></script>

<script>
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
            
            conversation_body.append("<p class='message_box message_box_you'>" + message + "</p><br/>");

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
                conversation_body.append("<p class='message_box message_box_them'>" + message + "</p><br/>");
            }
        });
    });
</script>
