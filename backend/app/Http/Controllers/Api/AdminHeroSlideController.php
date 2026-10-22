<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HeroSlide;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminHeroSlideController extends Controller
{
    public function index()
    {
        $slides = HeroSlide::query()
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'data' => $slides,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => [
                'required',
                'string',
                'max:255',
            ],

            'image' => [
                'required',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:8192',
            ],

            'link_url' => [
                'nullable',
                'string',
                'max:500',
            ],

            'sort_order' => [
                'nullable',
                'integer',
                'min:0',
            ],

            'is_active' => [
                'nullable',
                'boolean',
            ],
        ]);

        $imagePath = $request
            ->file('image')
            ->store('hero-slides', 'public');

        $slide = HeroSlide::create([
            'title' => $validated['title'],
            'image_path' => $imagePath,
            'link_url' => $validated['link_url'] ?? null,
            'sort_order' => $validated['sort_order'] ?? 0,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json([
            'message' => 'Hero slide created successfully.',
            'data' => $slide,
        ], 201);
    }

    public function show(HeroSlide $heroSlide)
    {
        return response()->json([
            'data' => $heroSlide,
        ]);
    }

    public function update(
        Request $request,
        HeroSlide $heroSlide
    ) {
        $validated = $request->validate([
            'title' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],

            'image' => [
                'sometimes',
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:8192',
            ],

            'link_url' => [
                'sometimes',
                'nullable',
                'string',
                'max:500',
            ],

            'sort_order' => [
                'sometimes',
                'integer',
                'min:0',
            ],

            'is_active' => [
                'sometimes',
                'boolean',
            ],
        ]);

        if ($request->hasFile('image')) {
            if (
                $heroSlide->image_path &&
                Storage::disk('public')->exists(
                    $heroSlide->image_path
                )
            ) {
                Storage::disk('public')->delete(
                    $heroSlide->image_path
                );
            }

            $validated['image_path'] = $request
                ->file('image')
                ->store('hero-slides', 'public');
        }

        unset($validated['image']);

        if ($request->has('is_active')) {
            $validated['is_active'] =
                $request->boolean('is_active');
        }

        $heroSlide->update($validated);

        return response()->json([
            'message' => 'Hero slide updated successfully.',
            'data' => $heroSlide->fresh(),
        ]);
    }

    public function destroy(HeroSlide $heroSlide)
    {
        if (
            $heroSlide->image_path &&
            Storage::disk('public')->exists(
                $heroSlide->image_path
            )
        ) {
            Storage::disk('public')->delete(
                $heroSlide->image_path
            );
        }

        $heroSlide->delete();

        return response()->json([
            'message' => 'Hero slide deleted successfully.',
        ]);
    }
}