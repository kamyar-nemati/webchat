@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row">
        <div class="col-md-8 col-md-offset-2">
            <div class="panel panel-default">
                <div class="panel-heading">Conversations</div>

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
                    <input id="text_message" type="text">
                    <button id="send_message">Send</button>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.js"></script>

<script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.1.1/socket.io.js"></script>

<script>
    $(function() {
        // socket server end point
        var end_point = 'http://localhost:6789';

        var socket = io.connect(end_point);

        var user_uuid = $('#user_uuid').val();
        var rcpt_uuid = $('#rcpt_uuid').val();

        socket.emit('join', user_uuid);

        var text_message = $('#text_message');
        var send_message = $('#send_message');

        send_message.click(function() {
            socket.emit('new_msg', {
                message: text_message.val(),
                recipient: rcpt_uuid
            });

            conversation_body.append("<p style='float: right;'>" + text_message.val() + "</p><br/>");
        });

        var conversation_body = $('#conversation_body');

        socket.on('new_msg', (data) => {
            var message = data.message;
            var sender = data.sender;

            if (sender === recipient)
            {
                conversation_body.append("<p>" + message + "</p><br/>");
            }
        });
    });
</script>
