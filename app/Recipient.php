<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Recipient extends Model
{
    protected $fillable = [
        'chat_id', 'user_id', 'delivered',
    ];
}
