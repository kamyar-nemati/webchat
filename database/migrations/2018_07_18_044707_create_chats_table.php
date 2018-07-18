<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateChatsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('chats', function (Blueprint $table) {
            $table->bigIncrements('id');

            // message uuid
            $table->uuid('uuid')->unique();

            // message
            $table->text('message');

            // sender fk
            $table->integer('sender_user_id')->unsigned();
            $table->foreign('sender_user_id')->references('id')->on('users');

            // receiver fk
            $table->integer('receiver_user_id')->unsigned();
            $table->foreign('receiver_user_id')->references('id')->on('users');

            // delivery status
            $table->boolean('delivered')->default(false);
            $table->timestampTz('delivered_at')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('chats');
    }
}
