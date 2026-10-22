<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function index(Request $request)
    {
        $query = trim((string) $request->query('q', ''));

        /*
        |--------------------------------------------------------------------------
        | Require Some Search Text
        |--------------------------------------------------------------------------
        */

        if (mb_strlen($query) < 1) {
            return response()->json([
                'query' => $query,
                'categories' => [],
                'products' => [],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Category Suggestions
        |--------------------------------------------------------------------------
        */

        $categories = Category::query()
            ->where('name', 'like', '%' . $query . '%')
            ->orderByRaw(
                'CASE WHEN name LIKE ? THEN 0 ELSE 1 END',
                [$query . '%']
            )
            ->orderBy('name')
            ->limit(5)
            ->get([
                'id',
                'name',
                'slug',
            ]);

        /*
        |--------------------------------------------------------------------------
        | Product Suggestions
        |--------------------------------------------------------------------------
        */

        $products = Product::query()
            ->where('is_active', true)
            ->where(function ($builder) use ($query) {
                $builder
                    ->where('name', 'like', '%' . $query . '%')
                    ->orWhere('brand', 'like', '%' . $query . '%')
                    ->orWhere(
                        'short_description',
                        'like',
                        '%' . $query . '%'
                    )
                    ->orWhereHas(
                        'category',
                        function ($categoryQuery) use ($query) {
                            $categoryQuery->where(
                                'name',
                                'like',
                                '%' . $query . '%'
                            );
                        }
                    );
            })
            ->with([
                'category:id,name,slug',

                'images' => function ($imageQuery) {
                    $imageQuery
                        ->orderByDesc('is_primary')
                        ->orderBy('sort_order')
                        ->orderBy('id');
                },

                'variants' => function ($variantQuery) {
                    $variantQuery
                        ->where('is_active', true)
                        ->orderBy('id');
                },
            ])
            ->orderByRaw(
                'CASE
                    WHEN name LIKE ? THEN 0
                    WHEN name LIKE ? THEN 1
                    ELSE 2
                END',
                [
                    $query . '%',
                    '%' . $query . '%',
                ]
            )
            ->limit(7)
            ->get();

        /*
        |--------------------------------------------------------------------------
        | Shape Product Results
        |--------------------------------------------------------------------------
        */

        $productSuggestions = $products->map(
            function ($product) {
                $image = $product->images->first();

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'slug' => $product->slug,
                    'brand' => $product->brand,

                    'category' => $product->category
                        ? [
                            'name' => $product->category->name,
                            'slug' => $product->category->slug,
                        ]
                        : null,

                    'image_path' => $image?->image_path,

                    'variants' => $product->variants
                        ->map(function ($variant) {
                            return [
                                'id' => $variant->id,
                                'label' => $variant->label,
                                'size_label' => $variant->size_label,
                                'price' => $variant->price,
                                'stock_status' => $variant->stock_status,
                            ];
                        })
                        ->values(),
                ];
            }
        )->values();

        return response()->json([
            'query' => $query,
            'categories' => $categories,
            'products' => $productSuggestions,
        ]);
    }
}