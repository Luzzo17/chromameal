<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ShoppingItemController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $request->user()->shoppingItems()->orderBy('id')->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'quantity' => ['nullable', 'string', 'max:255'],
        ]);

        $item = $request->user()->shoppingItems()->create($validated);

        return response()->json(['data' => $item->fresh()], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $item = $request->user()->shoppingItems()->findOrFail($id);
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'quantity' => ['sometimes', 'nullable', 'string', 'max:255'],
            'is_purchased' => ['sometimes', 'required', 'boolean'],
        ]);

        $item->update($validated);

        return response()->json(['data' => $item]);
    }

    public function destroy(Request $request, int $id): Response
    {
        $item = $request->user()->shoppingItems()->findOrFail($id);
        $item->delete();

        return response()->noContent();
    }
}
