<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class FoodSearchController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => ['required', 'string', 'min:2', 'max:100'],
        ]);

        $query = mb_strtolower(trim($validated['query']));
        $cacheKey = 'foods.search.v2.' . hash('sha256', $query);

        if (Cache::has($cacheKey)) {
            return response()->json([
                'data' => Cache::get($cacheKey),
            ]);
        }

        if (Cache::has('foods.search.v2.unavailable')) {
            return response()->json([
                'message' => 'Open Food Facts è temporaneamente indisponibile. Attendi almeno 30 secondi prima di riprovare.',
            ], 503)->header('Retry-After', '30');
        }

        try {
            $response = Http::acceptJson()
                ->withUserAgent('ChromaMeal/1.0')
                ->connectTimeout(5)
                ->timeout(20)
                ->get('https://search.openfoodfacts.org/search', [
                    'q' => $query,
                    'page_size' => 10,
                    'fields' => 'code,product_name,brands,nutriments',
                ]);
        } catch (ConnectionException $exception) {
            report($exception);

            return response()->json([
                'message' => 'Open Food Facts non è raggiungibile. Riprova più tardi.',
            ], 503);
        }

        if ($response->failed()) {
            if ($response->status() === 429 || $response->serverError()) {
                Cache::put('foods.search.v2.unavailable', true, now()->addSeconds(30));
            }

            logger()->warning('Errore ricerca Open Food Facts', [
                'status' => $response->status(),
                'body' => mb_substr($response->body(), 0, 500),
            ]);

            return response()->json([
                'message' => 'Open Food Facts non ha potuto completare la ricerca. Attendi almeno 30 secondi prima di riprovare.',
            ], 503)->header('Retry-After', '30');
        }

        $hits = $response->json('hits');
        if (! is_array($hits)) {
            return response()->json([
                'message' => 'Open Food Facts ha restituito una risposta non valida. Riprova più tardi.',
            ], 503);
        }

        $foods = collect($hits)
            ->map(function (array $product) {
                $nutriments = $product['nutriments'] ?? [];
                $brand = $product['brands'] ?? null;

                return [
                    'barcode' => $product['code'] ?? null,
                    'name' => $product['product_name'] ?? null,
                    'brand' => is_array($brand) ? implode(', ', $brand) : $brand,
                    'nutrition_per_100g' => [
                        'calories' => $nutriments['energy-kcal_100g'] ?? null,
                        'carbohydrates' => $nutriments['carbohydrates_100g'] ?? null,
                        'proteins' => $nutriments['proteins_100g'] ?? null,
                        'fat' => $nutriments['fat_100g'] ?? null,
                    ],
                ];
            })
            ->values();

        Cache::put($cacheKey, $foods->all(), now()->addMinutes(15));

        return response()->json([
            'data' => $foods,
        ]);
    }
}
