<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('meal_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->enum('meal_type', ['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner']);
            $table->string('food_name');
            $table->string('barcode')->nullable();
            $table->text('brand')->nullable();
            $table->decimal('quantity_g', 10, 2);
            $table->decimal('calories_per_100g', 10, 3)->nullable();
            $table->decimal('carbohydrates_per_100g', 10, 3)->nullable();
            $table->decimal('proteins_per_100g', 10, 3)->nullable();
            $table->decimal('fat_per_100g', 10, 3)->nullable();
            $table->timestamps();

            $table->index(['user_id', 'date', 'meal_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('meal_items');
    }
};
