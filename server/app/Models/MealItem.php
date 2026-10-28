<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MealItem extends Model
{
    protected $fillable = [
        'date',
        'meal_type',
        'food_name',
        'barcode',
        'brand',
        'quantity_g',
        'calories_per_100g',
        'carbohydrates_per_100g',
        'proteins_per_100g',
        'fat_per_100g',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'immutable_date:Y-m-d',
            'quantity_g' => 'decimal:2',
            'calories_per_100g' => 'decimal:3',
            'carbohydrates_per_100g' => 'decimal:3',
            'proteins_per_100g' => 'decimal:3',
            'fat_per_100g' => 'decimal:3',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
