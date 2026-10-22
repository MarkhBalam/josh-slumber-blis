"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Category = {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  children?: Category[];
};

type StockStatus = "in_stock" | "out_of_stock";

type VariantForm = {
  label: string;
  size_label: string;
  width_ft: string;
  length_ft: string;
  thickness_inches: string;
  package_quantity: string;
  price: string;
  stock_status: StockStatus;
};

type VariantKind = "mattress" | "duvet" | "standard";

/*
|--------------------------------------------------------------------------
| Product Options
|--------------------------------------------------------------------------
*/

const MATTRESS_SIZES = [
  "2×3",
  "2×4",
  "2.5×3",
  "2.5×4",
  "2.5×6",
  "3×3",
  "3×4",
  "3×6",
  "3×8",
  "3.5×6",
  "3.5×8",
  "4×4",
  "4×6",
  "4×8",
  "4.5×6",
  "4.5×8",
  "5×6",
  "5×8",
  "5×10",
  "5×12",
  "6×6",
  "6×8",
  "6×10",
  "6×12",
];

const DUVET_PACKAGES = [
  { label: "1 Piece", quantity: "1" },
  { label: "4 Pieces", quantity: "4" },
  { label: "6 Pieces", quantity: "6" },
  { label: "8 Pieces", quantity: "8" },
  { label: "10 Pieces", quantity: "10" },
];

const FIRMNESS_OPTIONS = [
  "Soft",
  "Medium",
  "Medium Firm",
  "Firm",
  "Extra Firm",
  "Other / Custom",
];

/*
|--------------------------------------------------------------------------
| Variant Helpers
|--------------------------------------------------------------------------
*/

function emptyVariant(): VariantForm {
  return {
    label: "Standard",
    size_label: "",
    width_ft: "",
    length_ft: "",
    thickness_inches: "",
    package_quantity: "",
    price: "",
    stock_status: "in_stock",
  };
}

function mattressVariant(): VariantForm {
  return {
    label: "",
    size_label: "",
    width_ft: "",
    length_ft: "",
    thickness_inches: "",
    package_quantity: "",
    price: "",
    stock_status: "in_stock",
  };
}

function duvetVariant(): VariantForm {
  return {
    label: "",
    size_label: "",
    width_ft: "",
    length_ft: "",
    thickness_inches: "",
    package_quantity: "",
    price: "",
    stock_status: "in_stock",
  };
}

/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

export default function CreateProductPage() {
  const router = useRouter();

  /*
  |--------------------------------------------------------------------------
  | Categories
  |--------------------------------------------------------------------------
  */

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [categoryId, setCategoryId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [productCategoryId, setProductCategoryId] = useState("");

  const [customType, setCustomType] = useState("");
  const [customProductName, setCustomProductName] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Product Details
  |--------------------------------------------------------------------------
  */

  const [brand, setBrand] = useState("");
  const [material, setMaterial] = useState("");

  const [firmness, setFirmness] = useState("");
  const [customFirmness, setCustomFirmness] = useState("");

  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Images
  |--------------------------------------------------------------------------
  */

  const [images, setImages] = useState<File[]>([]);

  const imagePreviews = useMemo(
    () =>
      images.map((image) => ({
        file: image,
        url: URL.createObjectURL(image),
      })),
    [images]
  );

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => {
        URL.revokeObjectURL(preview.url);
      });
    };
  }, [imagePreviews]);

  /*
  |--------------------------------------------------------------------------
  | Product Visibility
  |--------------------------------------------------------------------------
  */

  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);

  /*
  |--------------------------------------------------------------------------
  | Variants
  |--------------------------------------------------------------------------
  */

  const [variants, setVariants] = useState<VariantForm[]>([
    emptyVariant(),
  ]);

  /*
  |--------------------------------------------------------------------------
  | Form State
  |--------------------------------------------------------------------------
  */

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Load Categories From Laravel
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/categories",
          {
            headers: {
              Accept: "application/json",
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load categories."
          );
        }

        setCategories(data.data ?? []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load categories."
        );
      } finally {
        setLoadingCategories(false);
      }
    }

    loadCategories();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Selected Category
  |--------------------------------------------------------------------------
  */

  const selectedCategory = useMemo(
    () =>
      categories.find(
        (category) => String(category.id) === categoryId
      ) ?? null,
    [categories, categoryId]
  );

  const firstLevelChildren = selectedCategory?.children ?? [];

  /*
  |--------------------------------------------------------------------------
  | Determine Hierarchy Depth
  |--------------------------------------------------------------------------
  */

  const categoryHasTypes = firstLevelChildren.some(
    (child) => (child.children?.length ?? 0) > 0
  );

  const selectedType = useMemo(
    () =>
      firstLevelChildren.find(
        (child) => String(child.id) === typeId
      ) ?? null,
    [firstLevelChildren, typeId]
  );

  const productOptions = categoryHasTypes
    ? selectedType?.children ?? []
    : firstLevelChildren;

  const selectedProductCategory = useMemo(
    () =>
      productOptions.find(
        (product) => String(product.id) === productCategoryId
      ) ?? null,
    [productOptions, productCategoryId]
  );

  const isCustomType = typeId === "custom";
  const isCustomProduct = productCategoryId === "custom";

  /*
  |--------------------------------------------------------------------------
  | Variant Kind
  |--------------------------------------------------------------------------
  */

  const variantKind: VariantKind = useMemo(() => {
    if (selectedCategory?.slug === "mattresses") {
      return "mattress";
    }

    if (
      selectedCategory?.slug === "duvets-blankets-bed-covers"
    ) {
      return "duvet";
    }

    return "standard";
  }, [selectedCategory]);

  /*
  |--------------------------------------------------------------------------
  | Category Handlers
  |--------------------------------------------------------------------------
  */

  function handleCategoryChange(value: string) {
    setCategoryId(value);

    setTypeId("");
    setProductCategoryId("");

    setCustomType("");
    setCustomProductName("");

    const category = categories.find(
      (item) => String(item.id) === value
    );

    if (category?.slug === "mattresses") {
      setVariants([mattressVariant()]);
    } else if (
      category?.slug === "duvets-blankets-bed-covers"
    ) {
      setVariants([duvetVariant()]);
    } else {
      setVariants([emptyVariant()]);
    }
  }

  function handleTypeChange(value: string) {
    setTypeId(value);

    setProductCategoryId("");

    setCustomType("");
    setCustomProductName("");
  }

  function handleProductChange(value: string) {
    setProductCategoryId(value);
    setCustomProductName("");
  }

  /*
  |--------------------------------------------------------------------------
  | Final Product Name
  |--------------------------------------------------------------------------
  */

  const finalProductName = isCustomProduct
    ? customProductName.trim()
    : selectedProductCategory?.name ?? "";

  /*
  |--------------------------------------------------------------------------
  | Final Category ID
  |--------------------------------------------------------------------------
  */

  function resolveFinalCategoryId(): number | null {
    if (!selectedCategory) {
      return null;
    }

    if (selectedProductCategory) {
      return selectedProductCategory.id;
    }

    if (selectedType && !isCustomType) {
      return selectedType.id;
    }

    return selectedCategory.id;
  }

  /*
  |--------------------------------------------------------------------------
  | Image Handlers
  |--------------------------------------------------------------------------
  */

  function handleImageSelection(files: FileList | null) {
    if (!files) {
      return;
    }

    const selectedFiles = Array.from(files).filter((file) =>
      ["image/jpeg", "image/png", "image/webp"].includes(file.type)
    );

    setImages((current) => {
      const combined = [...current, ...selectedFiles];

      return combined.slice(0, 8);
    });
  }

  function removeImage(index: number) {
    setImages((current) =>
      current.filter(
        (_, currentIndex) => currentIndex !== index
      )
    );
  }

  function makePrimaryImage(index: number) {
    setImages((current) => {
      const selectedImage = current[index];

      if (!selectedImage) {
        return current;
      }

      return [
        selectedImage,
        ...current.filter(
          (_, currentIndex) => currentIndex !== index
        ),
      ];
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Variant Handlers
  |--------------------------------------------------------------------------
  */

  function createVariant(): VariantForm {
    if (variantKind === "mattress") {
      return mattressVariant();
    }

    if (variantKind === "duvet") {
      return duvetVariant();
    }

    return emptyVariant();
  }

  function addVariant() {
    setVariants((current) => [
      ...current,
      createVariant(),
    ]);
  }

  function removeVariant(index: number) {
    setVariants((current) =>
      current.filter(
        (_, currentIndex) => currentIndex !== index
      )
    );
  }

  function updateVariant(
    index: number,
    changes: Partial<VariantForm>
  ) {
    setVariants((current) =>
      current.map((variant, currentIndex) =>
        currentIndex === index
          ? {
              ...variant,
              ...changes,
            }
          : variant
      )
    );
  }

  function changeMattressSize(index: number, size: string) {
    updateVariant(index, {
      label: size,
      size_label: size,
    });
  }

  function changeDuvetPackage(index: number, label: string) {
    const option = DUVET_PACKAGES.find(
      (item) => item.label === label
    );

    updateVariant(index, {
      label,
      package_quantity: option?.quantity ?? "",
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Submit Product
  |--------------------------------------------------------------------------
  */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const token = localStorage.getItem(
      "josh-slumber-blis-admin-token"
    );

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Validation
    |--------------------------------------------------------------------------
    */

    if (!selectedCategory) {
      setError("Please choose a category.");
      return;
    }

    if (categoryHasTypes && !typeId) {
      setError("Please choose a product type.");
      return;
    }

    if (
      categoryHasTypes &&
      isCustomType &&
      !customType.trim()
    ) {
      setError("Please enter the custom product type.");
      return;
    }

    if (!productCategoryId) {
      setError("Please choose a product name.");
      return;
    }

    if (isCustomProduct && !customProductName.trim()) {
      setError("Please enter the custom product name.");
      return;
    }

    if (!finalProductName) {
      setError("Please choose or enter a product name.");
      return;
    }

    if (variants.length === 0) {
      setError("Please add at least one product option.");
      return;
    }

    for (const variant of variants) {
      if (!variant.label.trim()) {
        setError("Every product option must have a label.");
        return;
      }

      if (!variant.price) {
        setError("Every product option must have a price.");
        return;
      }
    }

    const finalCategoryId = resolveFinalCategoryId();

    if (!finalCategoryId) {
      setError("Unable to determine the product category.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      /*
      |--------------------------------------------------------------------------
      | Product
      |--------------------------------------------------------------------------
      */

      formData.append(
        "category_id",
        String(finalCategoryId)
      );

      formData.append("name", finalProductName);

      if (brand.trim()) {
        formData.append("brand", brand.trim());
      }

      if (material.trim()) {
        formData.append("material", material.trim());
      }

      const finalFirmness =
        firmness === "Other / Custom"
          ? customFirmness.trim()
          : firmness;

      if (finalFirmness) {
        formData.append("firmness", finalFirmness);
      }

      if (shortDescription.trim()) {
        formData.append(
          "short_description",
          shortDescription.trim()
        );
      }

      if (description.trim()) {
        formData.append(
          "description",
          description.trim()
        );
      }

      formData.append(
        "is_featured",
        isFeatured ? "1" : "0"
      );

      formData.append(
        "is_active",
        isActive ? "1" : "0"
      );

      /*
      |--------------------------------------------------------------------------
      | Variants
      |--------------------------------------------------------------------------
      */

      variants.forEach((variant, index) => {
        formData.append(
          `variants[${index}][label]`,
          variant.label
        );

        formData.append(
          `variants[${index}][price]`,
          variant.price
        );

        formData.append(
          `variants[${index}][stock_status]`,
          variant.stock_status
        );

        if (variant.size_label) {
          formData.append(
            `variants[${index}][size_label]`,
            variant.size_label
          );
        }

        if (variant.width_ft) {
          formData.append(
            `variants[${index}][width_ft]`,
            variant.width_ft
          );
        }

        if (variant.length_ft) {
          formData.append(
            `variants[${index}][length_ft]`,
            variant.length_ft
          );
        }

        if (variant.thickness_inches) {
          formData.append(
            `variants[${index}][thickness_inches]`,
            variant.thickness_inches
          );
        }

        if (variant.package_quantity) {
          formData.append(
            `variants[${index}][package_quantity]`,
            variant.package_quantity
          );
        }
      });

      /*
      |--------------------------------------------------------------------------
      | Images
      |--------------------------------------------------------------------------
      |
      | Image 0 is primary because makePrimaryImage() moves the selected
      | image to the beginning of the array.
      |
      */

      images.forEach((image) => {
        formData.append("images[]", image);
      });

      /*
      |--------------------------------------------------------------------------
      | Request
      |--------------------------------------------------------------------------
      */

      const response = await fetch(
        "http://127.0.0.1:8000/api/admin/products",
        {
          method: "POST",

          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: formData,
        }
      );

      const data = await response.json();

      /*
      |--------------------------------------------------------------------------
      | Expired Login
      |--------------------------------------------------------------------------
      */

      if (response.status === 401) {
        localStorage.removeItem(
          "josh-slumber-blis-admin-token"
        );

        localStorage.removeItem(
          "josh-slumber-blis-admin-user"
        );

        router.replace("/admin/login");
        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Backend Validation
      |--------------------------------------------------------------------------
      */

      if (!response.ok) {
        const validationErrors = data.errors
          ? Object.values(data.errors).flat().join(" ")
          : "";

        throw new Error(
          validationErrors ||
            data.message ||
            "Failed to create product."
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Success
      |--------------------------------------------------------------------------
      */

      router.push("/admin/products");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while creating the product."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen bg-[#f8f6f2] text-[#1f1f1f]">
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gray-500">
              Josh Slumber Blis
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Add Product
            </h1>

            <p className="mt-2 max-w-2xl text-gray-500">
              Choose the category first. The next options are loaded
              automatically from the Josh Slumber Blis catalogue.
            </p>
          </div>

          <Link
            href="/admin/products"
            className="rounded-full border border-black px-5 py-2.5 text-sm font-semibold transition hover:bg-black hover:text-white"
          >
            ← Back to Products
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-8"
        >
          {/* Catalogue */}
          <section className="rounded-3xl border border-black/10 bg-white p-6">
            <h2 className="text-xl font-bold">
              Catalogue
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Select where this product belongs.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {/* Main Category */}
              <div className="sm:col-span-2">
                <label className="text-sm font-semibold">
                  Category
                </label>

                <select
                  required
                  value={categoryId}
                  disabled={loadingCategories}
                  onChange={(event) =>
                    handleCategoryChange(event.target.value)
                  }
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-black"
                >
                  <option value="">
                    {loadingCategories
                      ? "Loading categories..."
                      : "Select category"}
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Type */}
              {selectedCategory && categoryHasTypes && (
                <div className="sm:col-span-2">
                  <label className="text-sm font-semibold">
                    Product Type
                  </label>

                  <select
                    required
                    value={typeId}
                    onChange={(event) =>
                      handleTypeChange(event.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-black"
                  >
                    <option value="">
                      Select product type
                    </option>

                    {firstLevelChildren.map((type) => (
                      <option
                        key={type.id}
                        value={type.id}
                      >
                        {type.name}
                      </option>
                    ))}

                    <option value="custom">
                      + Other / Custom Type
                    </option>
                  </select>

                  {isCustomType && (
                    <input
                      type="text"
                      value={customType}
                      onChange={(event) =>
                        setCustomType(event.target.value)
                      }
                      placeholder="Enter custom product type"
                      className="mt-3 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-black"
                    />
                  )}
                </div>
              )}

              {/* Product Name */}
              {selectedCategory &&
                (!categoryHasTypes || typeId) && (
                  <div className="sm:col-span-2">
                    <label className="text-sm font-semibold">
                      Product Name
                    </label>

                    <select
                      required
                      value={productCategoryId}
                      onChange={(event) =>
                        handleProductChange(event.target.value)
                      }
                      className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-black"
                    >
                      <option value="">
                        Select product
                      </option>

                      {!isCustomType &&
                        productOptions.map((product) => (
                          <option
                            key={product.id}
                            value={product.id}
                          >
                            {product.name}
                          </option>
                        ))}

                      <option value="custom">
                        + Other / Custom Product
                      </option>
                    </select>

                    {productOptions.length === 0 &&
                      !isCustomProduct && (
                        <p className="mt-2 text-xs text-gray-500">
                          No predefined products are available for this
                          category yet. Choose Other / Custom Product.
                        </p>
                      )}

                    {isCustomProduct && (
                      <input
                        type="text"
                        required
                        value={customProductName}
                        onChange={(event) =>
                          setCustomProductName(event.target.value)
                        }
                        placeholder="Enter product name"
                        className="mt-3 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-black"
                      />
                    )}
                  </div>
                )}
            </div>
          </section>

          {/* Product Details */}
          <section className="rounded-3xl border border-black/10 bg-white p-6">
            <h2 className="text-xl font-bold">
              Product Details
            </h2>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold">
                  Brand
                </label>

                <input
                  type="text"
                  value={brand}
                  onChange={(event) =>
                    setBrand(event.target.value)
                  }
                  placeholder="e.g. Rosefoam"
                  className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">
                  Material
                </label>

                <input
                  type="text"
                  value={material}
                  onChange={(event) =>
                    setMaterial(event.target.value)
                  }
                  placeholder="Optional"
                  className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-black"
                />
              </div>

              {variantKind === "mattress" && (
                <div>
                  <label className="text-sm font-semibold">
                    Firmness
                  </label>

                  <select
                    value={firmness}
                    onChange={(event) =>
                      setFirmness(event.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-black"
                  >
                    <option value="">
                      Not specified
                    </option>

                    {FIRMNESS_OPTIONS.map((option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {option}
                      </option>
                    ))}
                  </select>

                  {firmness === "Other / Custom" && (
                    <input
                      type="text"
                      value={customFirmness}
                      onChange={(event) =>
                        setCustomFirmness(event.target.value)
                      }
                      placeholder="Enter firmness"
                      className="mt-3 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-black"
                    />
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Description */}
          <section className="rounded-3xl border border-black/10 bg-white p-6">
            <h2 className="text-xl font-bold">
              Description
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <label className="text-sm font-semibold">
                  Short Description
                </label>

                <textarea
                  rows={2}
                  value={shortDescription}
                  onChange={(event) =>
                    setShortDescription(event.target.value)
                  }
                  placeholder="Short description shown on product cards."
                  className="mt-2 w-full resize-none rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">
                  Full Description
                </label>

                <textarea
                  rows={5}
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Full product information."
                  className="mt-2 w-full resize-none rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-black"
                />
              </div>
            </div>
          </section>

          {/* Product Images */}
          <section className="rounded-3xl border border-black/10 bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">
                  Product Images
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Upload up to 8 product photos. The first image will
                  be used as the main product image.
                </p>
              </div>

              <div className="rounded-full bg-[#f8f6f2] px-4 py-2 text-sm font-semibold">
                {images.length} / 8 images
              </div>
            </div>

            {/* Upload Area */}
            {images.length < 8 && (
              <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-black/15 bg-[#f8f6f2] px-6 py-10 text-center transition hover:border-black/40">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-xl text-white">
                  +
                </div>

                <p className="mt-4 font-semibold">
                  Add product photos
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  JPEG, PNG or WebP
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  You can select multiple photos at once.
                </p>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(event) => {
                    handleImageSelection(event.target.files);

                    event.target.value = "";
                  }}
                  className="hidden"
                />
              </label>
            )}

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="mt-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold">
                    Selected Photos
                  </p>

                  <p className="text-xs text-gray-400">
                    Choose Make Primary to change the main product
                    photo.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {imagePreviews.map((preview, index) => (
                    <div
                      key={`${preview.file.name}-${preview.file.lastModified}-${index}`}
                      className={[
                        "overflow-hidden rounded-2xl border bg-white",
                        index === 0
                          ? "border-black"
                          : "border-black/10",
                      ].join(" ")}
                    >
                      {/* Preview */}
                      <div className="relative aspect-square overflow-hidden bg-[#ece8e1]">
                        <img
                          src={preview.url}
                          alt={`Product preview ${index + 1}`}
                          className="h-full w-full object-cover"
                        />

                        {index === 0 && (
                          <div className="absolute left-3 top-3 rounded-full bg-black px-3 py-1.5 text-xs font-bold text-white shadow">
                            Primary
                          </div>
                        )}

                        <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold shadow">
                          {index + 1}
                        </div>
                      </div>

                      {/* Image Information */}
                      <div className="p-4">
                        <p
                          className="truncate text-sm font-semibold"
                          title={preview.file.name}
                        >
                          {preview.file.name}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {(preview.file.size / 1024 / 1024).toFixed(2)}{" "}
                          MB
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {index !== 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                makePrimaryImage(index)
                              }
                              className="rounded-full border border-black/15 px-3 py-2 text-xs font-semibold transition hover:border-black"
                            >
                              Make Primary
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {images.length === 0 && (
              <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                No product photos selected yet.
              </div>
            )}

            {/* Maximum */}
            {images.length === 8 && (
              <div className="mt-5 rounded-2xl bg-[#f8f6f2] px-4 py-3 text-sm text-gray-600">
                Maximum of 8 product photos reached. Remove a photo
                if you want to replace it.
              </div>
            )}
          </section>

          {/* Options & Prices */}
          <section className="rounded-3xl border border-black/10 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">
                  Options & Prices
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Add the available options and their selling prices.
                </p>
              </div>

              <button
                type="button"
                onClick={addVariant}
                className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white"
              >
                + Add Another Option
              </button>
            </div>

            <div className="mt-6 space-y-5">
              {variants.map((variant, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-black/10 bg-[#f8f6f2] p-5"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">
                      Option {index + 1}
                    </h3>

                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="text-sm font-semibold text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Mattress */}
                  {variantKind === "mattress" && (
                    <div className="mt-5 grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="text-sm font-semibold">
                          Mattress Size
                        </label>

                        <select
                          required
                          value={variant.size_label}
                          onChange={(event) =>
                            changeMattressSize(
                              index,
                              event.target.value
                            )
                          }
                          className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                        >
                          <option value="">
                            Select size
                          </option>

                          {MATTRESS_SIZES.map((size) => (
                            <option
                              key={size}
                              value={size}
                            >
                              {size}
                            </option>
                          ))}
                        </select>
                      </div>

                      <PriceField
                        value={variant.price}
                        onChange={(value) =>
                          updateVariant(index, {
                            price: value,
                          })
                        }
                      />

                      <StockField
                        value={variant.stock_status}
                        onChange={(value) =>
                          updateVariant(index, {
                            stock_status: value,
                          })
                        }
                      />
                    </div>
                  )}

                  {/* Duvet */}
                  {variantKind === "duvet" && (
                    <div className="mt-5 grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="text-sm font-semibold">
                          Package
                        </label>

                        <select
                          required
                          value={variant.label}
                          onChange={(event) =>
                            changeDuvetPackage(
                              index,
                              event.target.value
                            )
                          }
                          className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                        >
                          <option value="">
                            Select package
                          </option>

                          {DUVET_PACKAGES.map((option) => (
                            <option
                              key={option.label}
                              value={option.label}
                            >
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <PriceField
                        value={variant.price}
                        onChange={(value) =>
                          updateVariant(index, {
                            price: value,
                          })
                        }
                      />

                      <StockField
                        value={variant.stock_status}
                        onChange={(value) =>
                          updateVariant(index, {
                            stock_status: value,
                          })
                        }
                      />
                    </div>
                  )}

                  {/* Standard */}
                  {variantKind === "standard" && (
                    <div className="mt-5 grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="text-sm font-semibold">
                          Option
                        </label>

                        <input
                          type="text"
                          required
                          value={variant.label}
                          onChange={(event) =>
                            updateVariant(index, {
                              label: event.target.value,
                            })
                          }
                          placeholder="e.g. Standard, Large, Pair"
                          className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                        />
                      </div>

                      <PriceField
                        value={variant.price}
                        onChange={(value) =>
                          updateVariant(index, {
                            price: value,
                          })
                        }
                      />

                      <StockField
                        value={variant.stock_status}
                        onChange={(value) =>
                          updateVariant(index, {
                            stock_status: value,
                          })
                        }
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Product Visibility */}
          <section className="rounded-3xl border border-black/10 bg-white p-6">
            <h2 className="text-xl font-bold">
              Product Visibility
            </h2>

            <div className="mt-6 space-y-4">
              <label className="flex cursor-pointer gap-3 rounded-2xl border border-black/10 p-4">
                <input
                  type="radio"
                  name="status"
                  checked={isActive}
                  onChange={() => setIsActive(true)}
                  className="mt-1"
                />

                <div>
                  <p className="font-semibold">
                    Active
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Customers can see and purchase this product.
                  </p>
                </div>
              </label>

              <label className="flex cursor-pointer gap-3 rounded-2xl border border-black/10 p-4">
                <input
                  type="radio"
                  name="status"
                  checked={!isActive}
                  onChange={() => setIsActive(false)}
                  className="mt-1"
                />

                <div>
                  <p className="font-semibold">
                    Hidden
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Keep the product in the dashboard without
                    displaying it in the shop.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 pt-2 font-semibold">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(event) =>
                    setIsFeatured(event.target.checked)
                  }
                />

                Feature this product on the homepage
              </label>
            </div>
          </section>

          {/* Error */}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap justify-end gap-4">
            <Link
              href="/admin/products"
              className="rounded-full border border-black px-7 py-3.5 font-semibold transition hover:bg-black hover:text-white"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-black px-8 py-3.5 font-semibold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? "Creating Product..."
                : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

/*
|--------------------------------------------------------------------------
| Price Field
|--------------------------------------------------------------------------
*/

function PriceField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-semibold">
        Price (UGX)
      </label>

      <input
        type="number"
        min="0"
        required
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder="e.g. 850000"
        className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
      />
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Stock Field
|--------------------------------------------------------------------------
*/

function StockField({
  value,
  onChange,
}: {
  value: StockStatus;
  onChange: (value: StockStatus) => void;
}) {
  return (
    <div>
      <label className="text-sm font-semibold">
        Stock
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value as StockStatus
          )
        }
        className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
      >
        <option value="in_stock">
          In Stock
        </option>

        <option value="out_of_stock">
          Out of Stock
        </option>
      </select>
    </div>
  );
}