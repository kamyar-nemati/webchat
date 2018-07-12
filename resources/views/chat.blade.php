@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row">
        <div class="col-md-8 col-md-offset-2">
            <div class="panel panel-default">
                <div class="panel-heading">Conversation with {{ $receiver_name }}</div>

                {{-- csrf token --}}
                <input type="hidden" id="csrf-token" value="{{ csrf_token() }}">
                {{-- websocket host --}}
                <input type="hidden" id="socket_url" value="{{ config('app.socket_url', '') }}">
                <input type="hidden" id="socket_port" value="{{ config('app.socket_port', '') }}">
                {{-- sender and receiver unique id --}}
                <input type="hidden" id="sender_uuid" value="{{ $sender_uuid }}">
                <input type="hidden" id="receiver_uuid" value="{{ $receiver_uuid }}">

                <div class="panel-body conversation_panel" id="conversation_body">
                    @if (session('status'))
                        <div class="alert alert-success">
                            {{ session('status') }}
                        </div>
                    @endif

                    
                </div>
                <div class="panel-footer">
                    <div class="input-group">
                        <input id="text_message_box" type="text" class="form-control" placeholder="Type your message here&hellip;">
                        <span class="input-group-btn">
                            <button id="send_message_btn" type="button" class="btn btn-default">Send</button>
                        </span>
                    </div>
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
<script src="{{ asset('js/chat_view.js') }}"></script>