<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shopping_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('quantity')->nullable();
            $table->boolean('is_purchased')->default(false);
            $table->timestamps();

            $table->index(['user_id', 'is_purchased']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shopping_items');
    }
};
