<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlannerStorageTest extends TestCase
{
    use RefreshDatabase;

    public function test_meal_snapshot_preserves_unknown_nutrition_and_barcode_leading_zeroes(): void
    {
        $user = User::factory()->create();
        $item = $user->mealItems()->create([
            'date' => '2026-10-20',
            'meal_type' => 'lunch',
            'food_name' => 'Spaghetti',
            'barcode' => '0012345678901',
            'quantity_g' => 80.5,
            'calories_per_100g' => 359,
            'carbohydrates_per_100g' => null,
            'fat_per_100g' => 0,
        ])->fresh();

        $this->assertSame('2026-10-20', $item->toArray()['date']);
        $this->assertSame('0012345678901', $item->barcode);
        $this->assertSame('80.50', $item->quantity_g);
        $this->assertSame('359.000', $item->calories_per_100g);
        $this->assertNull($item->carbohydrates_per_100g);
        $this->assertNull($item->proteins_per_100g);
        $this->assertSame('0.000', $item->fat_per_100g);
        $this->assertTrue($item->user->is($user));
        $this->assertDatabaseCount('ingredients', 0);
    }

    public function test_user_relations_only_return_their_own_records(): void
    {
        $first = User::factory()->create();
        $second = User::factory()->create();

        foreach ([$first, $second] as $user) {
            $user->mealItems()->create([
                'date' => '2026-10-20', 'meal_type' => 'breakfast',
                'food_name' => 'Latte', 'quantity_g' => 200,
            ]);
            $user->scheduleEvents()->create([
                'type' => 'work', 'starts_at' => '2026-10-20 08:00:00',
                'ends_at' => '2026-10-20 16:00:00',
            ]);
            $user->shoppingItems()->create(['name' => 'Latte', 'quantity' => '2 confezioni']);
        }

        foreach (['mealItems', 'scheduleEvents', 'shoppingItems'] as $relation) {
            $this->assertSame([$first->id], $first->$relation()->pluck('user_id')->unique()->all());
            $this->assertSame([$second->id], $second->$relation()->pluck('user_id')->unique()->all());
        }

        $first->delete();
        foreach (['meal_items', 'schedule_events', 'shopping_items'] as $table) {
            $this->assertDatabaseMissing($table, ['user_id' => $first->id]);
            $this->assertDatabaseHas($table, ['user_id' => $second->id]);
        }
    }

    public function test_manual_shopping_item_can_be_checked_and_unchecked_without_a_meal(): void
    {
        $user = User::factory()->create();
        $item = $user->shoppingItems()->create(['name' => 'Detersivo'])->fresh();
        $this->assertFalse($item->is_purchased);
        $this->assertNull($item->quantity);

        $item->update(['is_purchased' => true]);
        $this->assertTrue($item->fresh()->is_purchased);
        $item->update(['is_purchased' => false]);
        $this->assertFalse($item->fresh()->is_purchased);
        $this->assertDatabaseCount('meal_items', 0);
    }
}
