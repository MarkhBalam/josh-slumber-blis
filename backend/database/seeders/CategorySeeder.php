<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Mattresses',
                'children' => [
                    [
                        'name' => 'Rebonded Mattresses',
                        'children' => [
                            'Orthopedic S/L',
                            'Orthopedic D/L',
                            'Bonnel S/L',
                            'Bonnel D/L',
                            'Pocket Spring S/L',
                            'Pocket Spring D/L',
                            'Pocket Hybrid Spring',
                            'Pocket Hybrid Extra Hard Spring',
                            'Latex Spring',
                            'Memory Foam Spring',
                            'Fit Sleep',
                        ],
                    ],
                    [
                        'name' => 'Premium Mattresses',
                        'children' => [
                            'High Density SMART',
                            'Smart / Deluxe Quilted',
                            'Deluxe',
                            'Tape Edge',
                            'Open End',
                        ],
                    ],
                ],
            ],

            [
                'name' => 'Pillows',
                'children' => [
                    'Memory Foam Pillows',
                    'Latex Foam Pillows',
                    'Ordinary Pillows',
                    'Pregnancy Pillows',
                ],
            ],

            [
                'name' => 'Duvets, Blankets & Bed Covers',
                'children' => [
                    'Jin Li Duvets',
                    'Coral Duvets',
                    'Tufted Duvets',
                    'Silk Duvets',
                    'Plain Duvets',
                    'Velvet Duvets',
                ],
            ],

            [
                'name' => 'Bedsheets',
                'children' => [
                    'Fish Small',
                    'Fish Big / Colored',
                    'KG Bedsheets',
                    'King Size Bedsheets',
                    'Flat / Fitted Bedsheets',
                ],
            ],

            [
                'name' => 'Mattress Toppers',
                'children' => [
                    'Latex Toppers',
                    'Memory Toppers',
                    'High Density Toppers',
                ],
            ],

            ['name' => 'Pillow Cases'],
            ['name' => 'Towels'],
            ['name' => 'Cushions'],
            ['name' => 'Door Mats'],
            ['name' => 'Curtains'],
            ['name' => 'Mosquito Nets'],
            ['name' => 'Mattress Protectors'],
            ['name' => 'Fleece Blankets'],
            ['name' => 'Baby Cots'],
            ['name' => 'Shoe Racks'],
        ];

        foreach ($categories as $categoryData) {
            $this->createCategory($categoryData);
        }
    }

    private function createCategory(array $data, ?int $parentId = null): void
    {
        $category = Category::updateOrCreate(
            [
                'slug' => Str::slug($data['name']),
            ],
            [
                'parent_id' => $parentId,
                'name' => $data['name'],
                'description' => null,
                'image' => null,
                'is_active' => true,
            ]
        );

        if (! empty($data['children'])) {
            foreach ($data['children'] as $child) {
                if (is_string($child)) {
                    $this->createCategory([
                        'name' => $child,
                    ], $category->id);
                } else {
                    $this->createCategory($child, $category->id);
                }
            }
        }
    }
}