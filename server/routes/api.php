<?php

use App\Http\Controllers\Api\ScheduleEventController;
use App\Http\Controllers\Api\ShoppingItemController;
use App\Http\Controllers\Api\FoodSearchController;
use App\Http\Controllers\Api\IngredientController;
use App\Http\Controllers\Api\MealItemController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'app' => 'ChromaMeal']);
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::patch('/user/theme', function (Request $request) {
    $validated = $request->validate([
        'theme' => ['required', 'string', 'in:winter,spring,summer,fall'],
    ]);

    $user = $request->user();
    $user->theme = $validated['theme'];
    $user->save();

    return $user;
})->middleware('auth:sanctum');

Route::get('/foods/search', [FoodSearchController::class, 'index'])
    ->middleware('throttle:5,1');

Route::post('/ingredients', [IngredientController::class, 'store'])
    ->middleware('auth:sanctum');

Route::get('/ingredients', [IngredientController::class, 'index'])
    ->middleware('auth:sanctum');

Route::get('/meal-items', [MealItemController::class, 'index'])
    ->middleware('auth:sanctum');

Route::post('/meal-items', [MealItemController::class, 'store'])
    ->middleware('auth:sanctum');

Route::patch('/meal-items/{id}', [MealItemController::class, 'update'])
    ->whereNumber('id')->middleware('auth:sanctum');

Route::delete('/meal-items/{id}', [MealItemController::class, 'destroy'])
    ->whereNumber('id')->middleware('auth:sanctum');

Route::get('/schedule-events', [ScheduleEventController::class, 'index'])
    ->middleware('auth:sanctum');

Route::post('/schedule-events', [ScheduleEventController::class, 'store'])
    ->middleware('auth:sanctum');

Route::put('/schedule-events/{id}', [ScheduleEventController::class, 'update'])
    ->whereNumber('id')->middleware('auth:sanctum');

Route::delete('/schedule-events/{id}', [ScheduleEventController::class, 'destroy'])
    ->whereNumber('id')->middleware('auth:sanctum');

Route::get('/shopping-items', [ShoppingItemController::class, 'index'])
    ->middleware('auth:sanctum');

Route::post('/shopping-items', [ShoppingItemController::class, 'store'])
    ->middleware('auth:sanctum');

Route::patch('/shopping-items/{id}', [ShoppingItemController::class, 'update'])
    ->whereNumber('id')->middleware('auth:sanctum');

Route::delete('/shopping-items/{id}', [ShoppingItemController::class, 'destroy'])
    ->whereNumber('id')->middleware('auth:sanctum');
