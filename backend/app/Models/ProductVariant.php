<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductVariant extends Model
{
    protected $fillable = [
        'product_id',
        'sku',
        'label',
        'width_ft',
        'length_ft',
        'thickness_inches',
        'size_label',
        'package_quantity',
        'price',
        'stock_status',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'width_ft' => 'decimal:2',
            'length_ft' => 'decimal:2',
            'thickness_inches' => 'decimal:2',
            'price' => 'decimal:2',
            'package_quantity' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}