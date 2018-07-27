<?php

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

Auth::routes();

Route::get('/home', 'HomeController@index')->name('home');

Route::get('/chat/{sender_uuid}/{receiver_uuid}', 'ChatController@index');

Route::post('/chat/store', 'ChatController@store');

Route::match(['patch', 'put'], 'chat/update/{id?}', 'ChatController@update');

Route::get('/chat/poll', 'ChatController@poll');

Route::get('/task', 'TaskController@index');

Route::post('/task/store', 'TaskController@store');

Route::get('/task/poll', 'TaskController@poll');
