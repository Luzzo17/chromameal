<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ingredient extends Model
{
    protected $fillable = [
        'name',
        'brand',
        'barcode',
        'source',
        'calories',
        'carbohydrates',
        'proteins',
        'fat',
    ];

    protected function casts(): array
    {
        return [
            'calories' => 'decimal:3',
            'carbohydrates' => 'decimal:3',
            'proteins' => 'decimal:3',
            'fat' => 'decimal:3',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
