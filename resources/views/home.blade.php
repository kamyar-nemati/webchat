@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row mt-5">
        <div class="col-md-8 offset-md-2">
            <div class="card">
                <div class="card-header">Available Users</div>

                <div class="card-body">
                    @if (session('status'))
                        <div class="alert alert-success">
                            {{ session('status') }}
                        </div>
                    @endif

                    @foreach ($contacts as $contact)
                        <p><a href="{{ url('/chat') }}/{{ Auth::user()->uuid }}/{{ $contact['uuid'] }}"><b>{{ $contact['name'] }}</b>&nbsp;({{ $contact['email'] }})</a></p>
                    @endforeach
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
