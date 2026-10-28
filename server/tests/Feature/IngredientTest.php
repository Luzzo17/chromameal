<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IngredientTest extends TestCase
{
    use RefreshDatabase;

    private function ingredient(): array
    {
        return [
            'name' => 'Spaghetti',
            'source' => 'manual',
            'calories' => 359,
            'carbohydrates' => 71,
            'proteins' => 13,
            'fat' => 0,
        ];
    }

    public function test_guests_cannot_save_ingredients(): void
    {
        $this->postJson('/api/ingredients', $this->ingredient())->assertUnauthorized();
        $this->assertDatabaseCount('ingredients', 0);
    }

    public function test_owner_is_authenticated_user_even_if_another_id_is_submitted(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();

        $this->actingAs($owner, 'web')
            ->postJson('/api/ingredients', [
                ...$this->ingredient(),
                'user_id' => $other->id,
            ])
            ->assertCreated()
            ->assertJsonPath('data.user_id', $owner->id);

        $this->assertDatabaseHas('ingredients', ['user_id' => $owner->id, 'fat' => 0]);
    }

    public function test_missing_and_invalid_nutrition_cannot_be_saved(): void
    {
        $this->actingAs(User::factory()->create(), 'web')
            ->postJson('/api/ingredients', [
                ...$this->ingredient(),
                'calories' => null,
                'carbohydrates' => -1,
                'proteins' => 101,
                'fat' => 1.1234,
                'source' => 'unknown',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['calories', 'carbohydrates', 'proteins', 'fat', 'source']);

        $this->assertDatabaseCount('ingredients', 0);
    }

    public function test_open_food_facts_ingredient_can_be_saved_with_completed_values(): void
    {
        $this->actingAs(User::factory()->create(), 'web')
            ->postJson('/api/ingredients', [
                ...$this->ingredient(),
                'source' => 'open_food_facts',
                'barcode' => '0089686120073',
                'brand' => 'Example',
            ])
            ->assertCreated()
            ->assertJsonPath('data.barcode', '0089686120073');
    }
}
