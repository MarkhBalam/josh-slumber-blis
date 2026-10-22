<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Orthopedic D/L Mattress
        $orthopedicCategory = Category::where('slug', 'orthopedic-dl')->first();

        if ($orthopedicCategory) {
            $product = Product::updateOrCreate(
                ['slug' => 'orthopedic-d-l-mattress'],
                [
                    'category_id' => $orthopedicCategory->id,
                    'name' => 'Orthopedic D/L Mattress',
                    'brand' => 'Rosefoam',
                    'material' => null,
                    'firmness' => 'Firm',
                    'short_description' => 'A firm orthopedic mattress designed for long-lasting support and comfort.',
                    'description' => 'Orthopedic double-layer mattress suitable for customers looking for firm support and durability.',
                    'is_featured' => true,
                    'is_active' => true,
                ]
            );

            $this->createMattressVariants($product, 'ORTHO-DL', [
                ['label' => '6×6',  'width' => 6, 'length' => 6, 'thickness' => 6,  'price' => 700000],
                ['label' => '6×8',  'width' => 6, 'length' => 6, 'thickness' => 8,  'price' => 850000],
                ['label' => '6×10', 'width' => 6, 'length' => 6, 'thickness' => 10, 'price' => 1000000],
                ['label' => '6×12', 'width' => 6, 'length' => 6, 'thickness' => 12, 'price' => 1200000],
            ]);
        }

        // 2. High Density SMART Mattress
        $smartCategory = Category::where('slug', 'high-density-smart')->first();

        if ($smartCategory) {
            $product = Product::updateOrCreate(
                ['slug' => 'high-density-smart-mattress'],
                [
                    'category_id' => $smartCategory->id,
                    'name' => 'High Density SMART Mattress',
                    'brand' => 'Rosefoam',
                    'material' => null,
                    'firmness' => 'Medium Firm',
                    'short_description' => 'High-density premium mattress for comfort and dependable support.',
                    'description' => 'Premium high-density SMART mattress suitable for customers seeking comfort, support and durability.',
                    'is_featured' => true,
                    'is_active' => true,
                ]
            );

            $this->createMattressVariants($product, 'SMART-HD', [
                ['label' => '5×6', 'width' => 5, 'length' => 6, 'thickness' => 6, 'price' => 550000],
                ['label' => '5×8', 'width' => 5, 'length' => 6, 'thickness' => 8, 'price' => 700000],
                ['label' => '6×6', 'width' => 6, 'length' => 6, 'thickness' => 6, 'price' => 650000],
                ['label' => '6×8', 'width' => 6, 'length' => 6, 'thickness' => 8, 'price' => 800000],
            ]);
        }

        // 3. Memory Foam Pillow
        $pillowCategory = Category::where('slug', 'memory-foam-pillows')->first();

        if ($pillowCategory) {
            $product = Product::updateOrCreate(
                ['slug' => 'memory-foam-pillow'],
                [
                    'category_id' => $pillowCategory->id,
                    'name' => 'Memory Foam Pillow',
                    'brand' => null,
                    'material' => 'Memory Foam',
                    'firmness' => 'Medium',
                    'short_description' => 'Comfortable memory foam pillow designed to support the head and neck.',
                    'description' => 'Memory foam pillow designed for comfort and supportive sleep.',
                    'is_featured' => true,
                    'is_active' => true,
                ]
            );

            ProductVariant::updateOrCreate(
                ['sku' => 'PILLOW-MF-PAIR'],
                [
                    'product_id' => $product->id,
                    'label' => 'Pair',
                    'size_label' => null,
                    'package_quantity' => 2,
                    'price' => 90000,
                    'stock_status' => 'in_stock',
                    'is_active' => true,
                ]
            );
        }

        // 4. Jin Li Duvet
        $duvetCategory = Category::where('slug', 'jin-li-duvets')->first();

        if ($duvetCategory) {
            $product = Product::updateOrCreate(
                ['slug' => 'jin-li-duvet'],
                [
                    'category_id' => $duvetCategory->id,
                    'name' => 'Jin Li Duvet',
                    'brand' => null,
                    'material' => null,
                    'firmness' => null,
                    'short_description' => 'Jin Li duvet available in different package sizes.',
                    'description' => 'Duvet set available in multiple package quantities depending on customer preference.',
                    'is_featured' => false,
                    'is_active' => true,
                ]
            );

            $duvetVariants = [
                ['label' => '1 Piece', 'qty' => 1, 'price' => 100000],
                ['label' => '4 Pieces', 'qty' => 4, 'price' => 180000],
                ['label' => '6 Pieces', 'qty' => 6, 'price' => 250000],
                ['label' => '8 Pieces', 'qty' => 8, 'price' => 320000],
                ['label' => '10 Pieces', 'qty' => 10, 'price' => 400000],
            ];

            foreach ($duvetVariants as $variant) {
                ProductVariant::updateOrCreate(
                    [
                        'sku' => 'JINLI-' . $variant['qty'] . 'PC',
                    ],
                    [
                        'product_id' => $product->id,
                        'label' => $variant['label'],
                        'package_quantity' => $variant['qty'],
                        'price' => $variant['price'],
                        'stock_status' => 'in_stock',
                        'is_active' => true,
                    ]
                );
            }
        }

        // 5. Latex Topper
        $topperCategory = Category::where('slug', 'latex-toppers')->first();

        if ($topperCategory) {
            $product = Product::updateOrCreate(
                ['slug' => 'latex-topper'],
                [
                    'category_id' => $topperCategory->id,
                    'name' => 'Latex Mattress Topper',
                    'brand' => null,
                    'material' => 'Latex',
                    'firmness' => 'Medium',
                    'short_description' => 'Latex mattress topper designed to improve comfort and support.',
                    'description' => 'A latex mattress topper suitable for customers looking to add extra comfort and support to their mattress.',
                    'is_featured' => false,
                    'is_active' => true,
                ]
            );

            ProductVariant::updateOrCreate(
                ['sku' => 'TOPPER-LATEX-6X6'],
                [
                    'product_id' => $product->id,
                    'label' => '6×6',
                    'width_ft' => 6,
                    'length_ft' => 6,
                    'size_label' => '6×6',
                    'price' => 300000,
                    'stock_status' => 'in_stock',
                    'is_active' => true,
                ]
            );
        }
    }

    private function createMattressVariants(Product $product, string $skuPrefix, array $variants): void
    {
        foreach ($variants as $variant) {
            ProductVariant::updateOrCreate(
                [
                    'sku' => $skuPrefix . '-' . Str::upper(str_replace('×', 'X', $variant['label'])),
                ],
                [
                    'product_id' => $product->id,
                    'label' => $variant['label'],
                    'width_ft' => $variant['width'],
                    'length_ft' => $variant['length'],
                    'thickness_inches' => $variant['thickness'],
                    'size_label' => $variant['label'],
                    'price' => $variant['price'],
                    'stock_status' => 'in_stock',
                    'is_active' => true,
                ]
            );
        }
    }
}