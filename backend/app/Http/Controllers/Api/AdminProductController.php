<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AdminProductController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | List Products
    |--------------------------------------------------------------------------
    */

    public function index(): JsonResponse
    {
        $products = Product::query()
            ->with([
                'category',
                'variants',
                'images',
            ])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Show Product
    |--------------------------------------------------------------------------
    */

    public function show(Product $product): JsonResponse
    {
        $product->load([
            'category',
            'variants',
            'images',
        ]);

        return response()->json([
            'success' => true,
            'data' => $product,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Create Product
    |--------------------------------------------------------------------------
    */

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => [
                'required',
                'integer',
                'exists:categories,id',
            ],

            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'brand' => [
                'nullable',
                'string',
                'max:255',
            ],

            'material' => [
                'nullable',
                'string',
                'max:255',
            ],

            'firmness' => [
                'nullable',
                'string',
                'max:255',
            ],

            'short_description' => [
                'nullable',
                'string',
                'max:500',
            ],

            'description' => [
                'nullable',
                'string',
            ],

            'is_featured' => [
                'nullable',
                'boolean',
            ],

            'is_active' => [
                'nullable',
                'boolean',
            ],

            /*
            |--------------------------------------------------------------------------
            | Variants
            |--------------------------------------------------------------------------
            */

            'variants' => [
                'required',
                'array',
                'min:1',
            ],

            'variants.*.label' => [
                'required',
                'string',
                'max:255',
            ],

            'variants.*.size_label' => [
                'nullable',
                'string',
                'max:255',
            ],

            'variants.*.width_ft' => [
                'nullable',
                'numeric',
            ],

            'variants.*.length_ft' => [
                'nullable',
                'numeric',
            ],

            'variants.*.thickness_inches' => [
                'nullable',
                'numeric',
            ],

            'variants.*.package_quantity' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'variants.*.price' => [
                'required',
                'numeric',
                'min:0',
            ],

            'variants.*.stock_status' => [
                'required',
                'string',
                'in:in_stock,out_of_stock',
            ],

            /*
            |--------------------------------------------------------------------------
            | Images
            |--------------------------------------------------------------------------
            */

            'images' => [
                'nullable',
                'array',
                'max:8',
            ],

            'images.*' => [
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:10240',
            ],
        ]);

        $product = DB::transaction(function () use ($request, $validated) {

            /*
            |--------------------------------------------------------------------------
            | Create Product
            |--------------------------------------------------------------------------
            */

            $baseSlug = Str::slug($validated['name']);
            $slug = $baseSlug;
            $counter = 1;

            while (Product::where('slug', $slug)->exists()) {
                $slug = $baseSlug . '-' . $counter;
                $counter++;
            }

            $product = Product::create([
                'category_id' => $validated['category_id'],
                'name' => $validated['name'],
                'slug' => $slug,
                'brand' => $validated['brand'] ?? null,
                'material' => $validated['material'] ?? null,
                'firmness' => $validated['firmness'] ?? null,
                'short_description' =>
                    $validated['short_description'] ?? null,
                'description' =>
                    $validated['description'] ?? null,
                'is_featured' =>
                    $request->boolean('is_featured'),
                'is_active' =>
                    $request->has('is_active')
                        ? $request->boolean('is_active')
                        : true,
            ]);

            /*
            |--------------------------------------------------------------------------
            | Create Variants
            |--------------------------------------------------------------------------
            */

            foreach ($validated['variants'] as $index => $variant) {
                $product->variants()->create([
                    'sku' =>
                        strtoupper($slug)
                        . '-'
                        . str_pad(
                            (string) ($index + 1),
                            2,
                            '0',
                            STR_PAD_LEFT
                        ),

                    'label' => $variant['label'],

                    'size_label' =>
                        $variant['size_label'] ?? null,

                    'width_ft' =>
                        $variant['width_ft'] ?? null,

                    'length_ft' =>
                        $variant['length_ft'] ?? null,

                    'thickness_inches' =>
                        $variant['thickness_inches'] ?? null,

                    'package_quantity' =>
                        $variant['package_quantity'] ?? null,

                    'price' => $variant['price'],

                    'stock_status' =>
                        $variant['stock_status'],

                    'is_active' => true,
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | Store Images
            |--------------------------------------------------------------------------
            */

            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $index => $image) {
                    $path = $image->store(
                        'products',
                        'public'
                    );

                    $product->images()->create([
                        'image_path' => $path,
                        'is_primary' => $index === 0,
                        'sort_order' => $index,
                    ]);
                }
            }

            return $product->load([
                'category',
                'variants',
                'images',
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Product created successfully.',
            'data' => $product,
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | Update Product
    |--------------------------------------------------------------------------
    */

    public function update(
        Request $request,
        Product $product
    ): JsonResponse {
        $validated = $request->validate([
            /*
            |--------------------------------------------------------------------------
            | Product
            |--------------------------------------------------------------------------
            */

            'category_id' => [
                'required',
                'integer',
                'exists:categories,id',
            ],

            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'brand' => [
                'nullable',
                'string',
                'max:255',
            ],

            'material' => [
                'nullable',
                'string',
                'max:255',
            ],

            'firmness' => [
                'nullable',
                'string',
                'max:255',
            ],

            'short_description' => [
                'nullable',
                'string',
                'max:500',
            ],

            'description' => [
                'nullable',
                'string',
            ],

            'is_featured' => [
                'nullable',
                'boolean',
            ],

            'is_active' => [
                'nullable',
                'boolean',
            ],

            /*
            |--------------------------------------------------------------------------
            | Variants
            |--------------------------------------------------------------------------
            */

            'variants' => [
                'required',
                'array',
                'min:1',
            ],

            'variants.*.id' => [
                'nullable',
                'integer',
            ],

            'variants.*.label' => [
                'required',
                'string',
                'max:255',
            ],

            'variants.*.size_label' => [
                'nullable',
                'string',
                'max:255',
            ],

            'variants.*.width_ft' => [
                'nullable',
                'numeric',
            ],

            'variants.*.length_ft' => [
                'nullable',
                'numeric',
            ],

            'variants.*.thickness_inches' => [
                'nullable',
                'numeric',
            ],

            'variants.*.package_quantity' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'variants.*.price' => [
                'required',
                'numeric',
                'min:0',
            ],

            'variants.*.stock_status' => [
                'required',
                'string',
                'in:in_stock,out_of_stock',
            ],

            /*
            |--------------------------------------------------------------------------
            | Existing Image Management
            |--------------------------------------------------------------------------
            */

            'remove_image_ids' => [
                'nullable',
                'array',
            ],

            'remove_image_ids.*' => [
                'integer',
            ],

            'primary_image_id' => [
                'nullable',
                'integer',
            ],

            /*
            |--------------------------------------------------------------------------
            | New Images
            |--------------------------------------------------------------------------
            */

            'images' => [
                'nullable',
                'array',
                'max:8',
            ],

            'images.*' => [
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:10240',
            ],
        ]);

        $updatedProduct = DB::transaction(
            function () use ($request, $validated, $product) {

                /*
                |--------------------------------------------------------------------------
                | Update Slug
                |--------------------------------------------------------------------------
                */

                $baseSlug = Str::slug($validated['name']);
                $slug = $baseSlug;
                $counter = 1;

                while (
                    Product::where('slug', $slug)
                        ->where('id', '!=', $product->id)
                        ->exists()
                ) {
                    $slug = $baseSlug . '-' . $counter;
                    $counter++;
                }

                /*
                |--------------------------------------------------------------------------
                | Update Product
                |--------------------------------------------------------------------------
                */

                $product->update([
                    'category_id' =>
                        $validated['category_id'],

                    'name' =>
                        $validated['name'],

                    'slug' =>
                        $slug,

                    'brand' =>
                        $validated['brand'] ?? null,

                    'material' =>
                        $validated['material'] ?? null,

                    'firmness' =>
                        $validated['firmness'] ?? null,

                    'short_description' =>
                        $validated['short_description'] ?? null,

                    'description' =>
                        $validated['description'] ?? null,

                    'is_featured' =>
                        $request->boolean('is_featured'),

                    'is_active' =>
                        $request->has('is_active')
                            ? $request->boolean('is_active')
                            : true,
                ]);

                /*
                |--------------------------------------------------------------------------
                | Update / Create Variants
                |--------------------------------------------------------------------------
                */

                $submittedVariantIds = [];

                foreach (
                    $validated['variants']
                    as $index => $variant
                ) {
                    /*
                    |--------------------------------------------------------------------------
                    | Existing Variant
                    |--------------------------------------------------------------------------
                    */

                    if (!empty($variant['id'])) {
                        $existingVariant = $product
                            ->variants()
                            ->where('id', $variant['id'])
                            ->first();

                        if (!$existingVariant) {
                            abort(
                                422,
                                'One of the selected variants does not belong to this product.'
                            );
                        }

                        $existingVariant->update([
                            'label' =>
                                $variant['label'],

                            'size_label' =>
                                $variant['size_label'] ?? null,

                            'width_ft' =>
                                $variant['width_ft'] ?? null,

                            'length_ft' =>
                                $variant['length_ft'] ?? null,

                            'thickness_inches' =>
                                $variant['thickness_inches'] ?? null,

                            'package_quantity' =>
                                $variant['package_quantity'] ?? null,

                            'price' =>
                                $variant['price'],

                            'stock_status' =>
                                $variant['stock_status'],

                            'is_active' => true,
                        ]);

                        $submittedVariantIds[] =
                            $existingVariant->id;

                        continue;
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | New Variant
                    |--------------------------------------------------------------------------
                    */

                    $newVariantNumber =
                        ($product->variants()->max('id') ?? 0) + 1;

                    $newVariant = $product
                        ->variants()
                        ->create([
                            'sku' =>
                                strtoupper($slug)
                                . '-'
                                . $newVariantNumber,

                            'label' =>
                                $variant['label'],

                            'size_label' =>
                                $variant['size_label'] ?? null,

                            'width_ft' =>
                                $variant['width_ft'] ?? null,

                            'length_ft' =>
                                $variant['length_ft'] ?? null,

                            'thickness_inches' =>
                                $variant['thickness_inches'] ?? null,

                            'package_quantity' =>
                                $variant['package_quantity'] ?? null,

                            'price' =>
                                $variant['price'],

                            'stock_status' =>
                                $variant['stock_status'],

                            'is_active' => true,
                        ]);

                    $submittedVariantIds[] =
                        $newVariant->id;
                }

                /*
                |--------------------------------------------------------------------------
                | Variants Removed From Edit Form
                |--------------------------------------------------------------------------
                |
                | If the variant has already appeared in an order, we do not
                | physically delete it. We simply deactivate it.
                |
                | This protects historical order records.
                |
                */

                $removedVariants = $product
                    ->variants()
                    ->whereNotIn(
                        'id',
                        $submittedVariantIds
                    )
                    ->get();

                foreach ($removedVariants as $removedVariant) {
                    if ($removedVariant->orderItems()->exists()) {
                        $removedVariant->update([
                            'is_active' => false,
                            'stock_status' => 'out_of_stock',
                        ]);
                    } else {
                        $removedVariant->delete();
                    }
                }

                /*
                |--------------------------------------------------------------------------
                | Remove Selected Existing Images
                |--------------------------------------------------------------------------
                */

                $removeImageIds =
                    $validated['remove_image_ids'] ?? [];

                if (!empty($removeImageIds)) {
                    $imagesToRemove = $product
                        ->images()
                        ->whereIn('id', $removeImageIds)
                        ->get();

                    foreach ($imagesToRemove as $image) {
                        Storage::disk('public')->delete(
                            $image->image_path
                        );

                        $image->delete();
                    }
                }

                /*
                |--------------------------------------------------------------------------
                | Check Image Limit
                |--------------------------------------------------------------------------
                */

                $existingImageCount =
                    $product->images()->count();

                $newImages =
                    $request->file('images', []);

                if (
                    $existingImageCount +
                    count($newImages) >
                    8
                ) {
                    abort(
                        422,
                        'A product can have a maximum of 8 images.'
                    );
                }

                /*
                |--------------------------------------------------------------------------
                | Add New Images
                |--------------------------------------------------------------------------
                */

                if (!empty($newImages)) {
                    $nextSortOrder =
                        ($product->images()->max('sort_order') ?? -1) + 1;

                    foreach ($newImages as $image) {
                        $path = $image->store(
                            'products',
                            'public'
                        );

                        $product->images()->create([
                            'image_path' => $path,
                            'is_primary' => false,
                            'sort_order' =>
                                $nextSortOrder,
                        ]);

                        $nextSortOrder++;
                    }
                }

                /*
                |--------------------------------------------------------------------------
                | Set Primary Image
                |--------------------------------------------------------------------------
                */

                $requestedPrimaryId =
                    $validated['primary_image_id'] ?? null;

                if ($requestedPrimaryId) {
                    $primaryImage = $product
                        ->images()
                        ->where(
                            'id',
                            $requestedPrimaryId
                        )
                        ->first();

                    if ($primaryImage) {
                        $product
                            ->images()
                            ->update([
                                'is_primary' => false,
                            ]);

                        $primaryImage->update([
                            'is_primary' => true,
                        ]);
                    }
                }

                /*
                |--------------------------------------------------------------------------
                | Guarantee One Primary Image
                |--------------------------------------------------------------------------
                */

                $hasPrimaryImage = $product
                    ->images()
                    ->where('is_primary', true)
                    ->exists();

                if (!$hasPrimaryImage) {
                    $firstImage = $product
                        ->images()
                        ->orderBy('sort_order')
                        ->first();

                    if ($firstImage) {
                        $firstImage->update([
                            'is_primary' => true,
                        ]);
                    }
                }

                return $product->fresh()->load([
                    'category',
                    'variants',
                    'images',
                ]);
            }
        );

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully.',
            'data' => $updatedProduct,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Delete Product
    |--------------------------------------------------------------------------
    */

    public function destroy(Product $product): JsonResponse
    {
        /*
        |--------------------------------------------------------------------------
        | Protect Products Used In Previous Orders
        |--------------------------------------------------------------------------
        |
        | We do not permanently delete a product that already appears in an
        | order because that would damage order history.
        |
        */

        if ($product->orderItems()->exists()) {
            $product->update([
                'is_active' => false,
            ]);

            $product->variants()->update([
                'is_active' => false,
                'stock_status' => 'out_of_stock',
            ]);

            return response()->json([
                'success' => true,
                'message' =>
                    'This product has previous orders, so it was hidden instead of permanently deleted.',
            ]);
        }

        DB::transaction(function () use ($product) {

            /*
            |--------------------------------------------------------------------------
            | Delete Image Files
            |--------------------------------------------------------------------------
            */

            foreach ($product->images as $image) {
                Storage::disk('public')->delete(
                    $image->image_path
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Delete Related Records
            |--------------------------------------------------------------------------
            */

            $product->images()->delete();
            $product->variants()->delete();

            /*
            |--------------------------------------------------------------------------
            | Delete Product
            |--------------------------------------------------------------------------
            */

            $product->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully.',
        ]);
    }
}