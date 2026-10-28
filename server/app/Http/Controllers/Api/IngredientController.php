<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class IngredientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $ingredients = $request->user()
        ->ingredients()
        ->OrderBy('name')
        ->paginate(20);

        return response()->json($ingredients);
    }


    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'brand' => ['nullable', 'string', 'max:255'],
            'barcode' => ['nullable', 'string', 'max:255'],
            'source' => ['required', Rule::in(['open_food_facts', 'manual'])],
            'calories' => ['required', 'numeric', 'between:0,1000', 'decimal:0,3'],
            'carbohydrates' => ['required', 'numeric', 'between:0,100', 'decimal:0,3'],
            'proteins' => ['required', 'numeric', 'between:0,100', 'decimal:0,3'],
            'fat' => ['required', 'numeric', 'between:0,100', 'decimal:0,3'],
        ]);

        $ingredient = $request->user()->ingredients()->create($validated);

        return response()->json(['data' => $ingredient], 201);
    }
}
