<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class MealItemController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'from' => ['required', 'date_format:Y-m-d'],
        ]);

        $maximumDate = $request->date('from')->addDays(30)->format('Y-m-d');

        $validated = $request->validate([
            'from' => ['required', 'date_format:Y-m-d'],
            'to' => [
                'required',
                'date_format:Y-m-d',
                'after_or_equal:from',
                'before_or_equal:'.$maximumDate,
            ],
        ]);

        $items = $request->user()
            ->mealItems()
            ->whereBetween('date', [
                $validated['from'],
                $validated['to'],
            ])
            ->orderBy('date')
            ->orderBy('id')
            ->get();

        return response()->json([
            'data' => $items,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'meal_type' => ['required', 'in:breakfast,morning_snack,lunch,afternoon_snack,dinner'],
            'food_name' => ['required', 'string', 'max:255'],
            'barcode' => ['nullable', 'string', 'max:255'],
            'brand' => ['nullable', 'string', 'max:2000'],
            'quantity_g' => ['required', 'numeric', 'min:0.01', 'max:10000', 'decimal:0,2'],
            'calories_per_100g' => ['nullable', 'numeric', 'between:0,1000', 'decimal:0,3'],
            'carbohydrates_per_100g' => ['nullable', 'numeric', 'between:0,100', 'decimal:0,3'],
            'proteins_per_100g' => ['nullable', 'numeric', 'between:0,100', 'decimal:0,3'],
            'fat_per_100g' => ['nullable', 'numeric', 'between:0,100', 'decimal:0,3'],
        ]);

        $item = $request->user()->mealItems()->create($validated);

        return response()->json(['data' => $item], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $item = $request->user()->mealItems()->findOrFail($id);
        $validated = $request->validate([
            'quantity_g' => ['required', 'numeric', 'min:0.01', 'max:10000', 'decimal:0,2'],
        ]);
        $item->update($validated);

        return response()->json(['data' => $item]);
    }

    public function destroy(Request $request, int $id): Response
    {
        $item = $request->user()->mealItems()->findOrFail($id);
        $item->delete();

        return response()->noContent();
    }
}
