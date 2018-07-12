<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Chat extends Model
{
    protected $fillable = [
        'uuid', 'message', 'sender_user_id', 'receiver_user_id'
    ];
}
