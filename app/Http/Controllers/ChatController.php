<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function index($uuid)
    {
        return view('chat', ['uuid' => $uuid]);
    }
}
