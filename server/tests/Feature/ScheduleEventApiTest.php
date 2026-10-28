<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScheduleEventApiTest extends TestCase
{
    use RefreshDatabase;

    private function event(): array
    {
        return [
            'type' => 'work',
            'starts_at' => '2026-10-21T06:00:00.000Z',
            'ends_at' => '2026-10-21T14:00:00.000Z',
        ];
    }

    public function test_guests_cannot_read_or_create_events(): void
    {
        $this->getJson('/api/schedule-events?from=2026-10-21&to=2026-10-21')->assertUnauthorized();
        $this->postJson('/api/schedule-events', $this->event())->assertUnauthorized();
        $this->assertDatabaseCount('schedule_events', 0);
    }

    public function test_event_is_stored_in_utc_for_the_authenticated_owner(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $this->actingAs($user, 'web')->postJson('/api/schedule-events', [
            ...$this->event(), 'user_id' => $other->id,
        ])->assertCreated()->assertJsonPath('data.user_id', $user->id)
            ->assertJsonPath('data.starts_at', '2026-10-21T06:00:00.000000Z');

        $this->assertDatabaseHas('schedule_events', [
            'user_id' => $user->id, 'starts_at' => '2026-10-21 06:00:00',
            'ends_at' => '2026-10-21 14:00:00', 'title' => null,
        ]);
    }

    public function test_invalid_dates_types_and_end_times_are_rejected(): void
    {
        $this->actingAs(User::factory()->create(), 'web');
        foreach (['2026-10-21T06:00:00.000Z', '2026-10-21T05:00:00.000Z'] as $end) {
            $this->postJson('/api/schedule-events', [...$this->event(), 'ends_at' => $end])
                ->assertUnprocessable()->assertJsonValidationErrors('ends_at');
        }
        $this->postJson('/api/schedule-events', [
            ...$this->event(), 'type' => 'unknown', 'starts_at' => '2026-10-21 08:00',
        ])->assertUnprocessable()->assertJsonValidationErrors(['type', 'starts_at']);
        $this->getJson('/api/schedule-events?from=invalid&to=2026-10-21')
            ->assertUnprocessable()->assertJsonValidationErrors('from');
        $this->assertDatabaseCount('schedule_events', 0);
    }

    public function test_listing_uses_italian_day_boundaries_and_includes_overnight_events(): void
    {
        $user = User::factory()->create();
        $overnight = $user->scheduleEvents()->create([
            'type' => 'work', 'starts_at' => '2026-10-20 21:00:00',
            'ends_at' => '2026-10-21 02:00:00',
        ]);
        // Midnight in Rome on October 22 is October 21 at 22:00 UTC.
        $user->scheduleEvents()->create([
            'type' => 'commitment', 'starts_at' => '2026-10-21 22:00:00',
            'ends_at' => '2026-10-21 23:00:00',
        ]);
        User::factory()->create()->scheduleEvents()->create([
            'type' => 'work', 'starts_at' => '2026-10-21 06:00:00',
            'ends_at' => '2026-10-21 14:00:00',
        ]);

        $this->actingAs($user, 'web')->getJson('/api/schedule-events?from=2026-10-21&to=2026-10-21')
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $overnight->id);
    }

    public function test_summer_time_day_has_correct_utc_boundaries(): void
    {
        $user = User::factory()->create();
        // March 29 has 23 hours in Rome: 23:00 UTC on March 28 to 22:00 UTC on March 29.
        $included = $user->scheduleEvents()->create([
            'type' => 'work', 'starts_at' => '2026-03-28 23:30:00',
            'ends_at' => '2026-03-29 00:30:00',
        ]);
        $user->scheduleEvents()->create([
            'type' => 'work', 'starts_at' => '2026-03-29 22:00:00',
            'ends_at' => '2026-03-29 23:00:00',
        ]);
        $this->actingAs($user, 'web')->getJson('/api/schedule-events?from=2026-03-29&to=2026-03-29')
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $included->id);
    }

    public function test_owner_can_reschedule_an_event_across_midnight_and_delete_it(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $this->actingAs($user, 'web');
        $created = $this->postJson('/api/schedule-events', $this->event())->assertCreated();
        $id = $created->json('data.id');

        $this->putJson('/api/schedule-events/'.$id, [
            'type' => 'commitment',
            'title' => 'Impegno serale',
            'starts_at' => '2026-10-21T21:00:00.000Z',
            'ends_at' => '2026-10-22T01:00:00.000Z',
            'user_id' => $other->id,
        ])->assertOk()->assertJsonPath('data.user_id', $user->id)
            ->assertJsonPath('data.type', 'commitment')
            ->assertJsonPath('data.ends_at', '2026-10-22T01:00:00.000000Z');

        $this->getJson('/api/schedule-events?from=2026-10-22&to=2026-10-22')
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $id);
        $this->deleteJson('/api/schedule-events/'.$id)->assertNoContent();
        $this->assertDatabaseMissing('schedule_events', ['id' => $id]);
    }

    public function test_unauthorized_updates_and_deletions_preserve_the_event(): void
    {
        $owner = User::factory()->create();
        $event = $owner->scheduleEvents()->create([
            'type' => 'work', 'starts_at' => '2026-10-21 06:00:00',
            'ends_at' => '2026-10-21 14:00:00',
        ]);
        $url = '/api/schedule-events/'.$event->id;
        $this->putJson($url, $this->event())->assertUnauthorized();
        $this->deleteJson($url)->assertUnauthorized();

        $this->actingAs(User::factory()->create(), 'web');
        $this->putJson($url, $this->event())->assertNotFound();
        $this->deleteJson($url)->assertNotFound();
        $this->assertDatabaseHas('schedule_events', ['id' => $event->id, 'user_id' => $owner->id]);
    }

    public function test_invalid_update_does_not_change_stored_times(): void
    {
        $user = User::factory()->create();
        $event = $user->scheduleEvents()->create([
            'type' => 'work', 'starts_at' => '2026-10-21 06:00:00',
            'ends_at' => '2026-10-21 14:00:00',
        ]);
        $this->actingAs($user, 'web')->putJson('/api/schedule-events/'.$event->id, [
            ...$this->event(), 'ends_at' => '2026-10-21T05:00:00.000Z',
        ])->assertUnprocessable()->assertJsonValidationErrors('ends_at');
        $this->assertDatabaseHas('schedule_events', [
            'id' => $event->id, 'ends_at' => '2026-10-21 14:00:00',
        ]);
    }
}
