<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class FoodSearchTest extends TestCase
{
    public function test_unavailable_provider_is_not_called_again_during_cooldown(): void
    {
        Cache::flush();
        Http::fake(['search.openfoodfacts.org/*' => Http::response('Unavailable', 503)]);

        $this->getJson('/api/foods/search?query=pasta')->assertStatus(503);
        $this->getJson('/api/foods/search?query=riso')
            ->assertStatus(503)->assertHeader('Retry-After', '30');
        Http::assertSentCount(1);

        $this->travel(31)->seconds();
        $this->getJson('/api/foods/search?query=riso')->assertStatus(503);
        Http::assertSentCount(2);
    }

    public function test_cached_results_remain_available_during_provider_downtime(): void
    {
        Cache::flush();
        Cache::put('foods.search.v2.'.hash('sha256', 'pasta'), [['name' => 'Spaghetti']], 900);
        Cache::put('foods.search.v2.unavailable', true, 30);
        Http::fake();

        $this->getJson('/api/foods/search?query=pasta')
            ->assertOk()->assertJsonPath('data.0.name', 'Spaghetti');
        Http::assertNothingSent();
    }

    public function test_search_reads_hits_and_sends_the_new_query_parameter(): void
    {
        Cache::flush();
        Http::preventStrayRequests();
        Http::fake(['search.openfoodfacts.org/*' => Http::response([
            'hits' => [[
                'code' => '001234',
                'product_name' => 'Pollo',
                'brands' => ['Brand A', 'Brand B'],
                'nutriments' => ['fat_100g' => 0, 'proteins_100g' => 23],
            ]],
        ])]);

        $this->getJson('/api/foods/search?query=pollo')
            ->assertOk()
            ->assertJsonPath('data.0.barcode', '001234')
            ->assertJsonPath('data.0.name', 'Pollo')
            ->assertJsonPath('data.0.brand', 'Brand A, Brand B')
            ->assertJsonPath('data.0.nutrition_per_100g.fat', 0)
            ->assertJsonPath('data.0.nutrition_per_100g.calories', null);
        Http::assertSent(fn ($request) => str_starts_with($request->url(), 'https://search.openfoodfacts.org/search?')
            && $request['q'] === 'pollo' && ! isset($request['search_terms']));

        $this->getJson('/api/foods/search?query=pollo')->assertOk();
        Http::assertSentCount(1);
    }

    public function test_invalid_response_is_not_shown_as_an_empty_search(): void
    {
        Cache::flush();
        Http::fake(['*' => Http::response(['unexpected' => []])]);
        $this->getJson('/api/foods/search?query=pollo')->assertStatus(503);
        $this->assertFalse(Cache::has('foods.search.v2.'.hash('sha256', 'pollo')));
    }
}
