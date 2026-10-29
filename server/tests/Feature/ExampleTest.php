<?php

namespace Tests\Feature;

// use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_production_pages_serve_react_without_intercepting_api_routes(): void
    {
        $publicDirectory = sys_get_temp_dir().'/chromameal-spa-'.bin2hex(random_bytes(8));
        mkdir($publicDirectory);
        file_put_contents($publicDirectory.'/spa.html', '<html><body>ChromaMeal SPA</body></html>');
        $this->app->usePublicPath($publicDirectory);

        try {
            foreach (['/', '/account', '/planner'] as $path) {
                $response = $this->get($path)->assertOk();
                $this->assertSame(
                    realpath($publicDirectory.'/spa.html'),
                    $response->baseResponse->getFile()->getRealPath(),
                );
            }

            $this->getJson('/api/health')->assertOk()->assertJsonPath('status', 'ok');
            $this->getJson('/api/unknown')->assertNotFound();
            $this->getJson('/api/user')->assertUnauthorized();
        } finally {
            unlink($publicDirectory.'/spa.html');
            rmdir($publicDirectory);
        }
    }

    /**
     * A basic test example.
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }
}
