<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShoppingItemApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_add_edit_check_reload_and_delete_an_item(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'web');
        $response = $this->postJson('/api/shopping-items', ['name' => 'Latte', 'quantity' => '2 confezioni'])
            ->assertCreated()->assertJsonPath('data.is_purchased', false);
        $id = $response->json('data.id');

        $this->patchJson('/api/shopping-items/'.$id, ['name' => 'Latte intero', 'quantity' => '3 confezioni'])
            ->assertOk()->assertJsonPath('data.name', 'Latte intero');
        $this->patchJson('/api/shopping-items/'.$id, ['is_purchased' => true])
            ->assertOk()->assertJsonPath('data.quantity', '3 confezioni');
        $this->getJson('/api/shopping-items')->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.is_purchased', true)->assertJsonPath('data.0.name', 'Latte intero');
        $this->patchJson('/api/shopping-items/'.$id, ['is_purchased' => false, 'quantity' => null])
            ->assertOk()->assertJsonPath('data.quantity', null)->assertJsonPath('data.is_purchased', false);
        $this->deleteJson('/api/shopping-items/'.$id)->assertNoContent();
        $this->assertDatabaseMissing('shopping_items', ['id' => $id]);
    }

    public function test_other_users_cannot_see_edit_or_delete_the_item(): void
    {
        $owner = User::factory()->create();
        $item = $owner->shoppingItems()->create(['name' => 'Pane']);
        $other = User::factory()->create();
        $this->actingAs($other, 'web');
        $this->getJson('/api/shopping-items')->assertOk()->assertJsonCount(0, 'data');
        $this->patchJson('/api/shopping-items/'.$item->id, ['name' => 'Changed'])->assertNotFound();
        $this->deleteJson('/api/shopping-items/'.$item->id)->assertNotFound();
        $this->postJson('/api/shopping-items', ['name' => 'Riso', 'user_id' => $owner->id])
            ->assertCreated()->assertJsonPath('data.user_id', $other->id);
        $this->assertDatabaseHas('shopping_items', ['id' => $item->id, 'user_id' => $owner->id, 'name' => 'Pane']);
    }

    public function test_guests_cannot_access_any_shopping_operation(): void
    {
        $item = User::factory()->create()->shoppingItems()->create(['name' => 'Pane']);
        $this->getJson('/api/shopping-items')->assertUnauthorized();
        $this->postJson('/api/shopping-items', ['name' => 'Riso'])->assertUnauthorized();
        $this->patchJson('/api/shopping-items/'.$item->id, ['is_purchased' => true])->assertUnauthorized();
        $this->deleteJson('/api/shopping-items/'.$item->id)->assertUnauthorized();
    }

    public function test_invalid_input_does_not_modify_data(): void
    {
        $user = User::factory()->create();
        $item = $user->shoppingItems()->create(['name' => 'Pane']);
        $this->actingAs($user, 'web');
        $this->postJson('/api/shopping-items', ['name' => '   '])
            ->assertUnprocessable()->assertJsonValidationErrors('name');
        $this->patchJson('/api/shopping-items/'.$item->id, ['name' => '', 'is_purchased' => 'yes', 'quantity' => []])
            ->assertUnprocessable()->assertJsonValidationErrors(['name', 'is_purchased', 'quantity']);
        $this->assertDatabaseHas('shopping_items', ['id' => $item->id, 'name' => 'Pane', 'is_purchased' => false]);
        $this->assertDatabaseCount('shopping_items', 1);
    }

    public function test_planned_foods_do_not_automatically_create_shopping_items(): void
    {
        $user = User::factory()->create();
        $user->mealItems()->create([
            'date' => '2026-10-23', 'meal_type' => 'lunch', 'food_name' => 'Pasta', 'quantity_g' => 80,
        ]);
        $this->actingAs($user, 'web')->getJson('/api/shopping-items')
            ->assertOk()->assertJsonCount(0, 'data');
        $this->assertDatabaseCount('shopping_items', 0);
    }
}
