<?php

use Illuminate\Support\Facades\Route;

Route::get('/{page?}', function () {
    if (is_file(public_path('spa.html'))) {
        return response()->file(public_path('spa.html'), [
            'Cache-Control' => 'no-cache',
        ]);
    }

    return view('welcome');
})->where('page', 'account|planner');
