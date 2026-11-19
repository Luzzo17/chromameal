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
            'calories' => 'float',
            'carbohydrates' => 'float',
            'proteins' => 'float',
            'fat' => 'float',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
