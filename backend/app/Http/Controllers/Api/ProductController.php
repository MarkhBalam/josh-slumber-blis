<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::query()
            ->where('is_active', true)
            ->with([
                'category',
                'variants' => function ($query) {
                    $query->where('is_active', true);
                },
                'images',
            ]);

        // Filter by category, including all child categories.
        if ($request->filled('category')) {
            $category = Category::query()
                ->where('slug', $request->category)
                ->where('is_active', true)
                ->first();

            if ($category) {
                $categoryIds = $this->collectCategoryIds($category);

                $query->whereIn('category_id', $categoryIds);
            } else {
                // Invalid category slug should simply return no products.
                $query->whereRaw('1 = 0');
            }
        }

        if ($request->boolean('featured')) {
            $query->where('is_featured', true);
        }

        $products = $query
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $product = Product::query()
            ->where('slug', $slug)
            ->where('is_active', true)
            ->with([
                'category.parent',
                'variants' => function ($query) {
                    $query->where('is_active', true);
                },
                'images',
            ])
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $product,
        ]);
    }

    private function collectCategoryIds(Category $category): array
    {
        $ids = [$category->id];

        foreach ($category->children as $child) {
            $ids = array_merge(
                $ids,
                $this->collectCategoryIds($child)
            );
        }

        return $ids;
    }
}