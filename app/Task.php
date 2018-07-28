<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    protected $fillable = [
        'uuid', 'name', 'user_id', 'attachment_hash', 'attachment_name',
    ];
}
