<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PreferencesController extends Controller
{
    /**
     * Display the preferences page.
     */
    public function index(): Response
    {
        return Inertia::render('preferences', [
            'user' => auth()->user(),
            'available_currencies' => ['CAD', 'USD', 'COP'],
            'available_category_languages' => ['es', 'en'],
        ]);
    }

    /**
     * Update user preferences.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'default_currency' => 'required|in:CAD,USD,COP',
            'category_language' => 'required|in:es,en',
        ]);

        $request->user()->update($validated);

        return redirect()->route('preferences.index')
            ->with('success', 'Preferences updated successfully');
    }
}
