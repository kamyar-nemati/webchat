<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\User;

use Illuminate\Support\Facades\Auth;

class HomeController extends Controller
{
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Show the application dashboard.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $contacts = User::where('uuid', '<>', Auth::user()->uuid)
                ->get(['uuid', 'name', 'email'])
                ->toArray();

        return view('home', ['contacts' => $contacts]);
    }
}
