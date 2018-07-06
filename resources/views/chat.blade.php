@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row mt-5">
        <div class="col-md-8 offset-md-2">
            <div class="card">
                <div class="card-header">Conversation with {{ $contact_name }}</div>

                {{-- websocket host --}}
                <input type="hidden" id="sock_url" value="{{ config('app.socket_url', '') }}">
                <input type="hidden" id="sock_port" value="{{ config('app.socket_port', '') }}">
                {{-- user and recipient unique id --}}
                <input type="hidden" id="user_uuid" value="{{ $user_uuid }}">
                <input type="hidden" id="rcpt_uuid" value="{{ $rcpt_uuid }}">

                <div class="card-body conversation_panel" id="conversation_body">
                    @if (session('status'))
                        <div class="alert alert-success">
                            {{ session('status') }}
                        </div>
                    @endif

                </div>
                <div class="card-footer">
                    <div class="input-group mb-3">
                        <input id="text_message_box" type="text" class="form-control" placeholder="Type your message here..." aria-label="Recipient's username" aria-describedby="basic-addon2">
                        <div class="input-group-append">
                            <button id="send_message_btn" class="btn btn-outline-secondary" type="button">Send</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

<!-- socket.io library -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.1.1/socket.io.js"></script>
<!-- custom javascript -->
<script src="{{ asset('js/chat_view.js') }}"></script>
