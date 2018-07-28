@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row">
        <div class="col-md-8">
            <div class="panel panel-default">
                <div class="panel-heading">My Tasks</div>

                {{-- csrf token --}}
                <input type="hidden" id="csrf-token" value="{{ csrf_token() }}">
                {{-- websocket host --}}
                <input type="hidden" id="socket_url" value="{{ config('app.socket_url', '') }}">
                <input type="hidden" id="socket_port" value="{{ config('app.socket_port', '') }}">
                {{-- user unique id --}}
                <input type="hidden" id="user_uuid" value="{{ $user_uuid }}">

                <div class="panel-body task_list_panel">
                    @if (session('status'))
                        <div class="alert alert-success">
                            {{ session('status') }}
                        </div>
                    @endif

                    <ul class="list-group" id="task_list">
                        
                    </ul>
                    
                </div>
                <div class="panel-footer">
                    <div class="input-group">
                        <span class="input-group-addon">New task</span>
                        <input id="task_name" type="text" class="form-control" placeholder="Type your to-do item here&hellip;">
                        <span class="input-group-btn">
                            <button id="task_save_btn" type="button" class="btn btn-default">Save</button>
                        </span>
                    </div>

                    <div id="status_panel" class="panel_status">
                        
                    </div>
                    
                    <!-- File Drop Zone -->
                    <h4>Drag and drop files below</h4>
                    <div class="upload-drop-zone" id="drop-zone">
                        Just drag and drop files here to upload
                    </div>
                    <div>
                        <h3>Files</h3>
                        <div class="list-group" id="file_list">
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-4">
                <div class="panel panel-default">
                    <div class="panel-heading">Shared with</div>
                    <div class="panel-body">
                        <div class="list-group shared_list_panel" id="shared_list">
                            @foreach ($shared_list as $shared)
                                <a class="list-group-item list-group-item-success" href="/task/unshare/{{ $shared['uuid'] }}">{{ $shared['name'] }}&nbsp;({{ $shared['profile_id'] }})</a>
                            @endforeach
                            @foreach ($non_shared_list as $non_shared)
                                <a class="list-group-item list-group-item" href="/task/share/{{ $non_shared['uuid'] }}">{{ $non_shared['name'] }}&nbsp;({{ $non_shared['profile_id'] }})</a>
                            @endforeach
                        </div>
                    </div>
                    {{-- <div class="panel-footer">
                        
                    </div> --}}
                </div>
        </div>
    </div>
</div>
@endsection

<!-- jquery library -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.js"></script>
<!-- socket.io library -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.1.1/socket.io.js"></script>
<!-- bootstrap-growl notification library -->
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-growl/1.0.0/jquery.bootstrap-growl.min.js"></script>
<!-- Google icon library -->
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
<!-- custom javascript -->
<script src="{{ asset('js/task_view.js') }}"></script>