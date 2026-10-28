<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MealItemApiTest extends TestCase
{
    use RefreshDatabase;

    private function meal(): array
    {
        return [
            'date' => '2026-10-20',
            'meal_type' => 'lunch',
            'food_name' => 'Spaghetti',
            'quantity_g' => 80,
        ];
    }

    public function test_guests_cannot_read_or_save_meals(): void
    {
        $this->getJson('/api/meal-items?from=2026-10-20&to=2026-10-26')->assertUnauthorized();
        $this->postJson('/api/meal-items', $this->meal())->assertUnauthorized();
        $this->assertDatabaseCount('meal_items', 0);
    }

    public function test_save_assigns_session_owner_and_accepts_unknown_nutrients(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();

        $response = $this->actingAs($owner, 'web')->postJson('/api/meal-items', [
            ...$this->meal(),
            'user_id' => $other->id,
            'calories_per_100g' => null,
            'fat_per_100g' => 0,
        ])->assertCreated();

        $response->assertJsonPath('data.user_id', $owner->id)
            ->assertJsonPath('data.quantity_g', '80.00')
            ->assertJsonPath('data.fat_per_100g', '0.000')
            ->assertJsonPath('data.calories_per_100g', null);
        $this->assertDatabaseHas('meal_items', ['user_id' => $owner->id, 'food_name' => 'Spaghetti']);
        $this->assertDatabaseMissing('meal_items', ['user_id' => $other->id]);
    }

    public function test_listing_filters_by_owner_and_inclusive_dates(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $first = $owner->mealItems()->create($this->meal());
        $last = $owner->mealItems()->create([...$this->meal(), 'date' => '2026-10-26']);
        $owner->mealItems()->create([...$this->meal(), 'date' => '2026-10-27']);
        $other->mealItems()->create($this->meal());

        $this->actingAs($owner, 'web')
            ->getJson('/api/meal-items?from=2026-10-20&to=2026-10-26')
            ->assertOk()->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $first->id)
            ->assertJsonPath('data.1.id', $last->id);
    }

    public function test_invalid_dates_produce_validation_errors_instead_of_server_errors(): void
    {
        $this->actingAs(User::factory()->create(), 'web');
        $this->getJson('/api/meal-items')->assertUnprocessable()->assertJsonValidationErrors('from');
        $this->getJson('/api/meal-items?from=invalid&to=2026-10-26')
            ->assertUnprocessable()->assertJsonValidationErrors('from');
        $this->getJson('/api/meal-items?from=2026-10-20&to=2026-10-19')
            ->assertUnprocessable()->assertJsonValidationErrors('to');
        $this->getJson('/api/meal-items?from=2026-10-20&to=2026-11-20')
            ->assertUnprocessable()->assertJsonValidationErrors('to');
    }

    public function test_invalid_meal_data_is_not_saved(): void
    {
        $this->actingAs(User::factory()->create(), 'web')
            ->postJson('/api/meal-items', [
                ...$this->meal(),
                'quantity_g' => 0,
                'meal_type' => 'unknown',
                'proteins_per_100g' => -1,
                'fat_per_100g' => 101,
            ])->assertUnprocessable()
            ->assertJsonValidationErrors(['quantity_g', 'meal_type', 'proteins_per_100g', 'fat_per_100g']);
        $this->assertDatabaseCount('meal_items', 0);
    }

    public function test_owner_can_update_quantity_and_delete_without_changing_food_snapshot(): void
    {
        $user = User::factory()->create();
        $item = $user->mealItems()->create([...$this->meal(), 'calories_per_100g' => 359]);
        $this->actingAs($user, 'web')->patchJson('/api/meal-items/'.$item->id, [
            'quantity_g' => 120.5,
            'food_name' => 'Tampered',
            'calories_per_100g' => 0,
        ])->assertOk()->assertJsonPath('data.quantity_g', '120.50')
            ->assertJsonPath('data.food_name', 'Spaghetti')
            ->assertJsonPath('data.calories_per_100g', '359.000');

        $this->getJson('/api/meal-items?from=2026-10-20&to=2026-10-20')
            ->assertOk()->assertJsonPath('data.0.quantity_g', '120.50');
        $this->deleteJson('/api/meal-items/'.$item->id)->assertNoContent();
        $this->assertDatabaseMissing('meal_items', ['id' => $item->id]);
    }

    public function test_other_users_cannot_update_or_delete_a_meal(): void
    {
        $owner = User::factory()->create();
        $item = $owner->mealItems()->create($this->meal());
        $this->actingAs(User::factory()->create(), 'web');
        $this->patchJson('/api/meal-items/'.$item->id, ['quantity_g' => 200])->assertNotFound();
        $this->deleteJson('/api/meal-items/'.$item->id)->assertNotFound();
        $this->assertDatabaseHas('meal_items', ['id' => $item->id, 'user_id' => $owner->id, 'quantity_g' => 80]);
    }

    public function test_invalid_update_keeps_existing_quantity(): void
    {
        $user = User::factory()->create();
        $item = $user->mealItems()->create($this->meal());
        $this->actingAs($user, 'web');
        foreach ([0, -1, 10001, 1.123] as $quantity) {
            $this->patchJson('/api/meal-items/'.$item->id, ['quantity_g' => $quantity])
                ->assertUnprocessable()->assertJsonValidationErrors('quantity_g');
        }
        $this->assertDatabaseHas('meal_items', ['id' => $item->id, 'quantity_g' => 80]);
    }

    public function test_guest_cannot_update_or_delete_a_meal(): void
    {
        $item = User::factory()->create()->mealItems()->create($this->meal());
        $this->patchJson('/api/meal-items/'.$item->id, ['quantity_g' => 200])->assertUnauthorized();
        $this->deleteJson('/api/meal-items/'.$item->id)->assertUnauthorized();
        $this->assertDatabaseHas('meal_items', ['id' => $item->id]);
    }
}
