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
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['calories', 'carbohydrates', 'proteins', 'fat']);

        $this->assertDatabaseCount('ingredients', 0);
    }

    public function test_open_food_facts_ingredient_can_be_saved_with_completed_values(): void
    {
        $this->actingAs(User::factory()->create(), 'web')
            ->postJson('/api/ingredients', [
                ...$this->ingredient(),
                'barcode' => '0089686120073',
                'brand' => 'Example',
            ])
            ->assertCreated()
            ->assertJsonPath('data.barcode', '0089686120073')
            ->assertJsonPath('data.source', 'open_food_facts');
    }

    public function test_source_is_inferred_by_the_server_and_cannot_be_forged(): void
    {
        $this->actingAs(User::factory()->create(), 'web')
            ->postJson('/api/ingredients', [
                ...$this->ingredient(),
                'source' => 'open_food_facts',
            ])
            ->assertCreated()
            ->assertJsonPath('data.source', 'manual');
    }

    public function test_barcode_is_unique_per_user_but_can_be_saved_by_another_user(): void
    {
        $owner = User::factory()->create();
        $payload = [...$this->ingredient(), 'barcode' => '123456'];
        $this->actingAs($owner, 'web')->postJson('/api/ingredients', $payload)->assertCreated();
        $this->postJson('/api/ingredients', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('barcode');
    }

    public function test_another_user_can_save_the_same_barcode(): void
    {
        $owner = User::factory()->create();
        $payload = [...$this->ingredient(), 'barcode' => '123456'];
        $this->actingAs($owner, 'web')->postJson('/api/ingredients', $payload)->assertCreated();

        $other = User::factory()->create();
        $this->actingAs($other, 'sanctum')->assertAuthenticatedAs($other, 'sanctum')
            ->postJson('/api/ingredients', $payload)
            ->assertCreated();
    }
}
