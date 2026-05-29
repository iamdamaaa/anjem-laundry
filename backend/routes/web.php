<?php

use Illuminate\Support\Facades\Route;

// Menangkap semua URL (seperti /services, /login) kecuali /api, 
// lalu memberikan file React index.html
Route::get('/{any?}', function () {
    $path = base_path('../frontend/dist/index.html');
    if (file_exists($path)) {
        return file_get_contents($path);
    }
    return view('welcome');
})->where('any', '^(?!api).*$');
