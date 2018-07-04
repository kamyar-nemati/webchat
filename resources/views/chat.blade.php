@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row">
        <div class="col-md-8 col-md-offset-2">
            <div class="panel panel-default">
                <div class="panel-heading">Conversation with {{ $contact_name }}</div>

                <input type="hidden" id="sock_url" value="{{ config('app.socket_url', '') }}">
                <input type="hidden" id="sock_port" value="{{ config('app.socket_port', '') }}">
                <input type="hidden" id="user_uuid" value="{{ $user_uuid }}">
                <input type="hidden" id="rcpt_uuid" value="{{ $rcpt_uuid }}">

                <div class="panel-body conversation_panel" id="conversation_body">
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

<!-- jquery library -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.js"></script>
<!-- socket.io library -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.1.1/socket.io.js"></script>
<!-- custom javascript -->
<script src="{{ asset('js/chat_page.js') }}"></script>
