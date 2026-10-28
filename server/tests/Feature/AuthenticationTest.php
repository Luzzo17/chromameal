<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_theme_requires_authentication(): void
    {
        $this->patchJson('/api/user/theme', ['theme' => 'summer'])
            ->assertUnauthorized();
    }

    public function test_theme_is_saved_only_for_the_authenticated_user(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();

        $this->actingAs($user, 'web');
        $this->getJson('/api/user')->assertJsonPath('theme', 'winter');

        foreach (['spring', 'summer', 'fall', 'winter'] as $theme) {
            $this->patchJson('/api/user/theme', [
                'theme' => $theme,
                'user_id' => $other->id,
            ])->assertOk()->assertJsonPath('theme', $theme);

            $this->assertSame($theme, $user->fresh()->theme);
            $this->getJson('/api/user')->assertJsonPath('theme', $theme);
        }

        $this->assertSame('winter', $other->fresh()->theme);
    }

    public function test_invalid_themes_do_not_change_the_saved_preference(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'web');

        foreach (['unknown', '', null, ['summer']] as $theme) {
            $this->patchJson('/api/user/theme', ['theme' => $theme])
                ->assertUnprocessable()->assertJsonValidationErrors('theme');
        }

        $this->assertSame('winter', $user->fresh()->theme);
    }

    public function test_registration_starts_a_session_and_logout_ends_it(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'example-password-123',
            'password_confirmation' => 'example-password-123',
        ])->assertCreated();

        $user = User::where('email', 'test@example.com')->firstOrFail();
        $this->assertTrue(Hash::check('example-password-123', $user->password));
        $this->assertAuthenticatedAs($user, 'web');
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/user')->assertOk()->assertJsonPath('email', $user->email);

        $this->postJson('/api/auth/logout')->assertNoContent();
        $this->assertGuest('web');
    }

    public function test_login_rejects_wrong_password_and_accepts_valid_credentials(): void
    {
        $user = User::factory()->create(['password' => Hash::make('example-password-123')]);

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->assertGuest('web');

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'example-password-123',
        ])->assertOk();
        $this->assertAuthenticatedAs($user, 'web');
    }

    public function test_registration_requires_matching_password_confirmation(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'example-password-123',
            'password_confirmation' => 'different-password',
        ])->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->assertDatabaseCount('users', 0);
    }
}
