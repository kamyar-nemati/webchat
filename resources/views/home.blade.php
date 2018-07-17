@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row">
        <div class="col-md-10 col-md-offset-1">
            <div class="panel panel-default">
                <div class="panel-heading">Registered User</div>

                <div class="panel-body">
                    @if (session('status'))
                        <div class="alert alert-success">
                            {{ session('status') }}
                        </div>
                    @endif
                    <div class="contact_panel">
                        @foreach ($contacts as $contact)
                            <a class="contact_button contact_button_grey" href="{{ url('/chat') }}/{{ Auth::user()->uuid }}/{{ $contact['uuid'] }}">{{ $contact['name'] }}&nbsp;({{ $contact['profile_id'] }})</a>
                        @endforeach
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
