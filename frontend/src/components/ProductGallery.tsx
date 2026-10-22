"use client";

import { useMemo, useState } from "react";

type ProductImage = {
  id: number;
  image_path: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
};

type Props = {
  productName: string;
  images: ProductImage[];
};

function getImageUrl(imagePath: string) {
  return `http://127.0.0.1:8000/storage/${imagePath}`;
}

export default function ProductGallery({
  productName,
  images,
}: Props) {
  const sortedImages = useMemo(() => {
    return [...images].sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;

      return a.sort_order - b.sort_order;
    });
  }, [images]);

  const [selectedImageId, setSelectedImageId] = useState<number | null>(
    sortedImages[0]?.id ?? null
  );

  const selectedImage =
    sortedImages.find(
      (image) => image.id === selectedImageId
    ) ?? sortedImages[0];

  if (sortedImages.length === 0) {
    return (
      <div className="flex min-h-[500px] items-center justify-center rounded-[2rem] 
bg-[#e8e2d8]">
        <span className="text-8xl">🛏️</span>
      </div>
    );
  }

  return (
    <div>
      {/* Main Image */}
      <div className="overflow-hidden rounded-[2rem] bg-[#e8e2d8]">
        <div className="aspect-square">
          <img
            src={getImageUrl(selectedImage.image_path)}
            alt={selectedImage.alt_text ?? productName}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {/* Thumbnails */}
      {sortedImages.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
          {sortedImages.map((image) => {
            const isSelected =
              image.id === selectedImage.id;

            return (
              <button
                key={image.id}
                type="button"
                onClick={() =>
                  setSelectedImageId(image.id)
                }
                className={[
                  "overflow-hidden rounded-2xl border bg-white transition",
                  isSelected
                    ? "border-black ring-2 ring-black/10"
                    : "border-black/10 hover:border-black/40",
                ].join(" ")}
              >
                <div className="aspect-square">
                  <img
                    src={getImageUrl(image.image_path)}
                    alt={
                      image.alt_text ??
                      `${productName} image`
                    }
                    className="h-full w-full object-cover"
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
