"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

type Category = {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  children?: Category[];
};

type StockStatus = "in_stock" | "out_of_stock";

type VariantKind = "mattress" | "duvet" | "standard";

type ProductVariant = {
  id?: number;
  label: string;
  size_label: string;
  width_ft: string;
  length_ft: string;
  thickness_inches: string;
  package_quantity: string;
  price: string;
  stock_status: StockStatus;
};

type ProductImage = {
  id: number;
  image_path: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
};

type Product = {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  brand: string | null;
  material: string | null;
  firmness: string | null;
  short_description: string | null;
  description: string | null;
  is_featured: boolean;
  is_active: boolean;

  variants: Array<{
    id: number;
    label: string;
    size_label: string | null;
    width_ft: string | null;
    length_ft: string | null;
    thickness_inches: string | null;
    package_quantity: number | null;
    price: string;
    stock_status: StockStatus;
  }>;

  images: ProductImage[];
};

/*
|--------------------------------------------------------------------------
| Guided Variant Options
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
  {
    label: "1 Piece",
    quantity: "1",
  },
  {
    label: "4 Pieces",
    quantity: "4",
  },
  {
    label: "6 Pieces",
    quantity: "6",
  },
  {
    label: "8 Pieces",
    quantity: "8",
  },
  {
    label: "10 Pieces",
    quantity: "10",
  },
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
| Helpers
|--------------------------------------------------------------------------
*/

function emptyVariant(): ProductVariant {
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

function mattressVariant(): ProductVariant {
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

function duvetVariant(): ProductVariant {
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

function getImageUrl(path: string) {
  if (
    path.startsWith("http://") ||
    path.startsWith("https://")
  ) {
    return path;
  }

  return `${API_URL}/storage/${path}`;
}

/*
|--------------------------------------------------------------------------
| Find Category Path
|--------------------------------------------------------------------------
|
| Examples:
|
| Mattresses
| -> Rebonded Mattresses
| -> Orthopedic S/L
|
| Pillows
| -> Memory Foam Pillows
|
*/

function findCategoryPath(
  categories: Category[],
  targetId: number,
  path: Category[] = []
): Category[] | null {
  for (const category of categories) {
    const currentPath = [...path, category];

    if (category.id === targetId) {
      return currentPath;
    }

    if (category.children?.length) {
      const found = findCategoryPath(
        category.children,
        targetId,
        currentPath
      );

      if (found) {
        return found;
      }
    }
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();

  const productId = String(params.id);

  /*
  |--------------------------------------------------------------------------
  | Catalogue
  |--------------------------------------------------------------------------
  */

  const [categories, setCategories] = useState<Category[]>([]);

  const [categoryId, setCategoryId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [productCategoryId, setProductCategoryId] =
    useState("");

  const [customType, setCustomType] = useState("");
  const [customProductName, setCustomProductName] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | Product
  |--------------------------------------------------------------------------
  */

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [material, setMaterial] = useState("");

  const [firmness, setFirmness] = useState("");
  const [customFirmness, setCustomFirmness] =
    useState("");

  const [shortDescription, setShortDescription] =
    useState("");

  const [description, setDescription] = useState("");

  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);

  /*
  |--------------------------------------------------------------------------
  | Variants
  |--------------------------------------------------------------------------
  */

  const [variants, setVariants] = useState<ProductVariant[]>(
    []
  );

  /*
  |--------------------------------------------------------------------------
  | Images
  |--------------------------------------------------------------------------
  */

  const [existingImages, setExistingImages] = useState<
    ProductImage[]
  >([]);

  const [removeImageIds, setRemoveImageIds] = useState<
    number[]
  >([]);

  const [primaryImageId, setPrimaryImageId] = useState<
    number | null
  >(null);

  const [newImages, setNewImages] = useState<File[]>([]);

  /*
  |--------------------------------------------------------------------------
  | State
  |--------------------------------------------------------------------------
  */

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Image Previews
  |--------------------------------------------------------------------------
  */

  const newImagePreviews = useMemo(
    () =>
      newImages.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [newImages]
  );

  useEffect(() => {
    return () => {
      newImagePreviews.forEach((preview) => {
        URL.revokeObjectURL(preview.url);
      });
    };
  }, [newImagePreviews]);

  /*
  |--------------------------------------------------------------------------
  | Selected Catalogue Hierarchy
  |--------------------------------------------------------------------------
  */

  const selectedCategory = useMemo(
    () =>
      categories.find(
        (category) =>
          String(category.id) === categoryId
      ) ?? null,
    [categories, categoryId]
  );

  const firstLevelChildren =
    selectedCategory?.children ?? [];

  const categoryHasTypes = firstLevelChildren.some(
    (child) => (child.children?.length ?? 0) > 0
  );

  const selectedType = useMemo(
    () =>
      firstLevelChildren.find(
        (type) => String(type.id) === typeId
      ) ?? null,
    [firstLevelChildren, typeId]
  );

  const productOptions = categoryHasTypes
    ? selectedType?.children ?? []
    : firstLevelChildren;

  const selectedProductCategory = useMemo(
    () =>
      productOptions.find(
        (product) =>
          String(product.id) === productCategoryId
      ) ?? null,
    [productOptions, productCategoryId]
  );

  const isCustomType = typeId === "custom";

  const isCustomProduct =
    productCategoryId === "custom";

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
      selectedCategory?.slug ===
      "duvets-blankets-bed-covers"
    ) {
      return "duvet";
    }

    return "standard";
  }, [selectedCategory]);

  /*
  |--------------------------------------------------------------------------
  | Load Product
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    async function loadPage() {
      const token = localStorage.getItem(
        "josh-slumber-blis-admin-token"
      );

      if (!token) {
        router.replace("/admin/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [productResponse, categoryResponse] =
          await Promise.all([
            fetch(
              `${API_URL}/api/admin/products/${productId}`,
              {
                headers: {
                  Accept: "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            ),

            fetch(`${API_URL}/api/categories`, {
              headers: {
                Accept: "application/json",
              },
            }),
          ]);

        if (productResponse.status === 401) {
          localStorage.removeItem(
            "josh-slumber-blis-admin-token"
          );

          localStorage.removeItem(
            "josh-slumber-blis-admin-user"
          );

          router.replace("/admin/login");
          return;
        }

        const productData =
          await productResponse.json();

        const categoryData =
          await categoryResponse.json();

        if (!productResponse.ok) {
          throw new Error(
            productData.message ||
              "Failed to load product."
          );
        }

        if (!categoryResponse.ok) {
          throw new Error(
            categoryData.message ||
              "Failed to load categories."
          );
        }

        const product: Product =
          productData.data;

        const loadedCategories: Category[] =
          categoryData.data ?? [];

        setCategories(loadedCategories);

        /*
        |--------------------------------------------------------------------------
        | Resolve Existing Catalogue Hierarchy
        |--------------------------------------------------------------------------
        */

        const path = findCategoryPath(
          loadedCategories,
          product.category_id
        );

        if (path && path.length > 0) {
          const rootCategory = path[0];

          setCategoryId(
            String(rootCategory.id)
          );

          const rootChildren =
            rootCategory.children ?? [];

          const rootHasTypes =
            rootChildren.some(
              (child) =>
                (child.children?.length ?? 0) >
                0
            );

          /*
          |--------------------------------------------------------------------------
          | Category -> Type -> Product
          |--------------------------------------------------------------------------
          */

          if (rootHasTypes) {
            if (path.length >= 3) {
              setTypeId(
                String(path[1].id)
              );

              setProductCategoryId(
                String(path[2].id)
              );
            } else if (
              path.length === 2 &&
              (path[1].children?.length ?? 0) >
                0
            ) {
              /*
               * Existing custom product saved under
               * a product type.
               */

              setTypeId(
                String(path[1].id)
              );

              setProductCategoryId(
                "custom"
              );

              setCustomProductName(
                product.name
              );
            } else {
              /*
               * Product is attached only to the
               * main category.
               */

              setTypeId("custom");
              setCustomType("Custom");

              setProductCategoryId(
                "custom"
              );

              setCustomProductName(
                product.name
              );
            }
          } else {
            /*
            |--------------------------------------------------------------------------
            | Category -> Product
            |--------------------------------------------------------------------------
            */

            if (path.length >= 2) {
              setProductCategoryId(
                String(path[1].id)
              );
            } else {
              setProductCategoryId(
                "custom"
              );

              setCustomProductName(
                product.name
              );
            }
          }
        }

        /*
        |--------------------------------------------------------------------------
        | Product Details
        |--------------------------------------------------------------------------
        */

        setName(product.name ?? "");
        setBrand(product.brand ?? "");
        setMaterial(product.material ?? "");

        const knownFirmness =
          FIRMNESS_OPTIONS.includes(
            product.firmness ?? ""
          );

        if (
          product.firmness &&
          !knownFirmness
        ) {
          setFirmness(
            "Other / Custom"
          );

          setCustomFirmness(
            product.firmness
          );
        } else {
          setFirmness(
            product.firmness ?? ""
          );
        }

        setShortDescription(
          product.short_description ?? ""
        );

        setDescription(
          product.description ?? ""
        );

        setIsFeatured(
          Boolean(product.is_featured)
        );

        setIsActive(
          Boolean(product.is_active)
        );

        /*
        |--------------------------------------------------------------------------
        | Variants
        |--------------------------------------------------------------------------
        */

        setVariants(
          product.variants.map(
            (variant) => ({
              id: variant.id,

              label:
                variant.label ?? "",

              size_label:
                variant.size_label ?? "",

              width_ft:
                variant.width_ft ?? "",

              length_ft:
                variant.length_ft ?? "",

              thickness_inches:
                variant.thickness_inches ??
                "",

              package_quantity:
                variant.package_quantity !==
                null
                  ? String(
                      variant.package_quantity
                    )
                  : "",

              price:
                variant.price ?? "",

              stock_status:
                variant.stock_status,
            })
          )
        );

        /*
        |--------------------------------------------------------------------------
        | Images
        |--------------------------------------------------------------------------
        */

        setExistingImages(
          product.images ?? []
        );

        const primary =
          product.images?.find(
            (image) => image.is_primary
          );

        setPrimaryImageId(
          primary?.id ?? null
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading the product."
        );
      } finally {
        setLoading(false);
      }
    }

    if (productId) {
      loadPage();
    }
  }, [productId, router]);

  /*
  |--------------------------------------------------------------------------
  | Catalogue Changes
  |--------------------------------------------------------------------------
  */

  function handleCategoryChange(
    value: string
  ) {
    setCategoryId(value);

    setTypeId("");
    setProductCategoryId("");

    setCustomType("");
    setCustomProductName("");

    const category = categories.find(
      (item) =>
        String(item.id) === value
    );

    if (
      category?.slug === "mattresses"
    ) {
      setVariants([
        mattressVariant(),
      ]);
    } else if (
      category?.slug ===
      "duvets-blankets-bed-covers"
    ) {
      setVariants([
        duvetVariant(),
      ]);
    } else {
      setVariants([
        emptyVariant(),
      ]);
    }
  }

  function handleTypeChange(
    value: string
  ) {
    setTypeId(value);

    setProductCategoryId("");
    setCustomProductName("");
    setCustomType("");
  }

  function handleProductChange(
    value: string
  ) {
    setProductCategoryId(value);

    if (value === "custom") {
      setCustomProductName("");
      return;
    }

    const selected =
      productOptions.find(
        (product) =>
          String(product.id) === value
      );

    if (selected) {
      setName(selected.name);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Final Product Name
  |--------------------------------------------------------------------------
  */

  const finalProductName =
    isCustomProduct
      ? customProductName.trim()
      : selectedProductCategory?.name ??
        name.trim();

  /*
  |--------------------------------------------------------------------------
  | Final Laravel Category
  |--------------------------------------------------------------------------
  */

  function resolveFinalCategoryId():
    | number
    | null {
    if (!selectedCategory) {
      return null;
    }

    if (selectedProductCategory) {
      return selectedProductCategory.id;
    }

    if (
      selectedType &&
      !isCustomType
    ) {
      return selectedType.id;
    }

    return selectedCategory.id;
  }

  /*
  |--------------------------------------------------------------------------
  | Variant Functions
  |--------------------------------------------------------------------------
  */

  function createVariant(): ProductVariant {
    if (
      variantKind === "mattress"
    ) {
      return mattressVariant();
    }

    if (
      variantKind === "duvet"
    ) {
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

  function removeVariant(
    index: number
  ) {
    if (variants.length === 1) {
      setError(
        "A product must have at least one option."
      );

      return;
    }

    setError("");

    setVariants((current) =>
      current.filter(
        (_, variantIndex) =>
          variantIndex !== index
      )
    );
  }

  function updateVariant(
    index: number,
    changes: Partial<ProductVariant>
  ) {
    setVariants((current) =>
      current.map(
        (
          variant,
          variantIndex
        ) =>
          variantIndex === index
            ? {
                ...variant,
                ...changes,
              }
            : variant
      )
    );
  }

  function changeMattressSize(
    index: number,
    size: string
  ) {
    updateVariant(index, {
      label: size,
      size_label: size,
    });
  }

  function changeDuvetPackage(
    index: number,
    label: string
  ) {
    const packageOption =
      DUVET_PACKAGES.find(
        (item) =>
          item.label === label
      );

    updateVariant(index, {
      label,
      package_quantity:
        packageOption?.quantity ??
        "",
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Existing Images
  |--------------------------------------------------------------------------
  */

  function toggleRemoveExistingImage(
    imageId: number
  ) {
    setRemoveImageIds(
      (current) => {
        const removed =
          current.includes(imageId);

        if (removed) {
          return current.filter(
            (id) => id !== imageId
          );
        }

        if (
          primaryImageId === imageId
        ) {
          setPrimaryImageId(
            null
          );
        }

        return [
          ...current,
          imageId,
        ];
      }
    );
  }

  /*
  |--------------------------------------------------------------------------
  | New Images
  |--------------------------------------------------------------------------
  */

  function handleNewImages(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(
      event.target.files ?? []
    );

    if (files.length === 0) {
      return;
    }

    const activeExisting =
      existingImages.length -
      removeImageIds.length;

    if (
      activeExisting +
        newImages.length +
        files.length >
      8
    ) {
      setError(
        "A product can have a maximum of 8 images."
      );

      event.target.value = "";
      return;
    }

    setError("");

    setNewImages((current) => [
      ...current,
      ...files,
    ]);

    event.target.value = "";
  }

  function removeNewImage(
    index: number
  ) {
    setNewImages((current) =>
      current.filter(
        (_, imageIndex) =>
          imageIndex !== index
      )
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Save
  |--------------------------------------------------------------------------
  */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const token =
      localStorage.getItem(
        "josh-slumber-blis-admin-token"
      );

    if (!token) {
      router.replace(
        "/admin/login"
      );

      return;
    }

    if (!selectedCategory) {
      setError(
        "Please choose a category."
      );

      return;
    }

    if (
      categoryHasTypes &&
      !typeId
    ) {
      setError(
        "Please choose a product type."
      );

      return;
    }

    if (
      categoryHasTypes &&
      isCustomType &&
      !customType.trim()
    ) {
      setError(
        "Please enter the custom product type."
      );

      return;
    }

    if (!productCategoryId) {
      setError(
        "Please choose a product name."
      );

      return;
    }

    if (
      isCustomProduct &&
      !customProductName.trim()
    ) {
      setError(
        "Please enter the custom product name."
      );

      return;
    }

    if (!finalProductName) {
      setError(
        "Product name is required."
      );

      return;
    }

    if (variants.length === 0) {
      setError(
        "Add at least one product option."
      );

      return;
    }

    for (const variant of variants) {
      if (!variant.label.trim()) {
        setError(
          "Every product option must have a label."
        );

        return;
      }

      if (
        variant.price === "" ||
        Number(variant.price) < 0
      ) {
        setError(
          "Every product option must have a valid price."
        );

        return;
      }
    }

    const finalCategoryId =
      resolveFinalCategoryId();

    if (!finalCategoryId) {
      setError(
        "Unable to determine the product category."
      );

      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const formData =
        new FormData();

      /*
      |--------------------------------------------------------------------------
      | Spoof PUT
      |--------------------------------------------------------------------------
      */

      formData.append(
        "_method",
        "PUT"
      );

      /*
      |--------------------------------------------------------------------------
      | Product
      |--------------------------------------------------------------------------
      */

      formData.append(
        "category_id",
        String(finalCategoryId)
      );

      formData.append(
        "name",
        finalProductName
      );

      formData.append(
        "brand",
        brand.trim()
      );

      formData.append(
        "material",
        material.trim()
      );

      const finalFirmness =
        firmness ===
        "Other / Custom"
          ? customFirmness.trim()
          : firmness;

      formData.append(
        "firmness",
        finalFirmness
      );

      formData.append(
        "short_description",
        shortDescription
      );

      formData.append(
        "description",
        description
      );

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

      variants.forEach(
        (variant, index) => {
          if (variant.id) {
            formData.append(
              `variants[${index}][id]`,
              String(variant.id)
            );
          }

          formData.append(
            `variants[${index}][label]`,
            variant.label
          );

          if (
            variant.size_label
          ) {
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

          if (
            variant.length_ft
          ) {
            formData.append(
              `variants[${index}][length_ft]`,
              variant.length_ft
            );
          }

          if (
            variant.thickness_inches
          ) {
            formData.append(
              `variants[${index}][thickness_inches]`,
              variant.thickness_inches
            );
          }

          if (
            variant.package_quantity
          ) {
            formData.append(
              `variants[${index}][package_quantity]`,
              variant.package_quantity
            );
          }

          formData.append(
            `variants[${index}][price]`,
            variant.price
          );

          formData.append(
            `variants[${index}][stock_status]`,
            variant.stock_status
          );
        }
      );

      /*
      |--------------------------------------------------------------------------
      | Removed Images
      |--------------------------------------------------------------------------
      */

      removeImageIds.forEach(
        (imageId, index) => {
          formData.append(
            `remove_image_ids[${index}]`,
            String(imageId)
          );
        }
      );

      /*
      |--------------------------------------------------------------------------
      | Primary Image
      |--------------------------------------------------------------------------
      */

      if (
        primaryImageId &&
        !removeImageIds.includes(
          primaryImageId
        )
      ) {
        formData.append(
          "primary_image_id",
          String(primaryImageId)
        );
      }

      /*
      |--------------------------------------------------------------------------
      | New Images
      |--------------------------------------------------------------------------
      */

      newImages.forEach(
        (image) => {
          formData.append(
            "images[]",
            image
          );
        }
      );

      /*
      |--------------------------------------------------------------------------
      | Request
      |--------------------------------------------------------------------------
      */

      const response =
        await fetch(
          `${API_URL}/api/admin/products/${productId}`,
          {
            method: "POST",

            headers: {
              Accept:
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: formData,
          }
        );

      if (
        response.status === 401
      ) {
        localStorage.removeItem(
          "josh-slumber-blis-admin-token"
        );

        localStorage.removeItem(
          "josh-slumber-blis-admin-user"
        );

        router.replace(
          "/admin/login"
        );

        return;
      }

      const data =
        await response.json();

      if (!response.ok) {
        const validationErrors =
          data.errors
            ? Object.values(
                data.errors
              )
                .flat()
                .join(" ")
            : null;

        throw new Error(
          validationErrors ||
            data.message ||
            "Failed to update product."
        );
      }

      const updated: Product =
        data.data;

      /*
      |--------------------------------------------------------------------------
      | Refresh Updated Data
      |--------------------------------------------------------------------------
      */

      setName(
        updated.name ?? ""
      );

      setBrand(
        updated.brand ?? ""
      );

      setMaterial(
        updated.material ?? ""
      );

      const updatedKnownFirmness =
        FIRMNESS_OPTIONS.includes(
          updated.firmness ?? ""
        );

      if (
        updated.firmness &&
        !updatedKnownFirmness
      ) {
        setFirmness(
          "Other / Custom"
        );

        setCustomFirmness(
          updated.firmness
        );
      } else {
        setFirmness(
          updated.firmness ?? ""
        );

        setCustomFirmness("");
      }

      setShortDescription(
        updated.short_description ??
          ""
      );

      setDescription(
        updated.description ?? ""
      );

      setIsFeatured(
        Boolean(
          updated.is_featured
        )
      );

      setIsActive(
        Boolean(updated.is_active)
      );

      setVariants(
        updated.variants.map(
          (variant) => ({
            id: variant.id,

            label:
              variant.label ?? "",

            size_label:
              variant.size_label ??
              "",

            width_ft:
              variant.width_ft ?? "",

            length_ft:
              variant.length_ft ??
              "",

            thickness_inches:
              variant.thickness_inches ??
              "",

            package_quantity:
              variant.package_quantity !==
              null
                ? String(
                    variant.package_quantity
                  )
                : "",

            price:
              variant.price ?? "",

            stock_status:
              variant.stock_status,
          })
        )
      );

      setExistingImages(
        updated.images ?? []
      );

      setRemoveImageIds([]);
      setNewImages([]);

      const newPrimary =
        updated.images?.find(
          (image) =>
            image.is_primary
        );

      setPrimaryImageId(
        newPrimary?.id ?? null
      );

      setSuccess(
        "Product updated successfully."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while updating the product."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Delete
  |--------------------------------------------------------------------------
  */

  async function handleDelete() {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${name}"?\n\nIf this product has previous orders, it will be hidden instead of permanently deleted.`
      );

    if (!confirmed) {
      return;
    }

    const token =
      localStorage.getItem(
        "josh-slumber-blis-admin-token"
      );

    if (!token) {
      router.replace(
        "/admin/login"
      );

      return;
    }

    try {
      setDeleting(true);
      setError("");
      setSuccess("");

      const response =
        await fetch(
          `${API_URL}/api/admin/products/${productId}`,
          {
            method: "DELETE",

            headers: {
              Accept:
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      if (
        response.status === 401
      ) {
        localStorage.removeItem(
          "josh-slumber-blis-admin-token"
        );

        localStorage.removeItem(
          "josh-slumber-blis-admin-user"
        );

        router.replace(
          "/admin/login"
        );

        return;
      }

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete product."
        );
      }

      window.alert(data.message);

      router.push(
        "/admin/products"
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while deleting the product."
      );
    } finally {
      setDeleting(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f6f2] text-[#1f1f1f]">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="rounded-3xl border border-black/10 bg-white p-10">
            <p className="font-semibold">
              Loading product...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen bg-[#f8f6f2] text-[#1f1f1f]">
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        {/* Top */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-black"
          >
            ← Back to Products
          </Link>
        </div>

        {/* Heading */}
        <div className="mt-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gray-500">
              Josh Slumber Blis
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Edit Product
            </h1>

            <p className="mt-2 text-gray-500">
              Update product information, options, prices, stock and images.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDelete}
            disabled={
              deleting || saving
            }
            className="rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
          >
            {deleting
              ? "Deleting..."
              : "Delete Product"}
          </button>
        </div>

        {success && (
          <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
            {success}
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-8"
        >
          {/* Catalogue */}
          <section className="rounded-3xl border border-black/10 bg-white p-6 md:p-8">
            <h2 className="text-2xl font-bold">
              Catalogue
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Change where this product belongs.
            </p>

            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              {/* Category */}
              <div className="sm:col-span-2">
                <label className="text-sm font-semibold">
                  Category
                </label>

                <select
                  required
                  value={categoryId}
                  onChange={(event) =>
                    handleCategoryChange(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-black"
                >
                  <option value="">
                    Select category
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={
                          category.id
                        }
                        value={
                          category.id
                        }
                      >
                        {
                          category.name
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Product Type */}
              {selectedCategory &&
                categoryHasTypes && (
                  <div className="sm:col-span-2">
                    <label className="text-sm font-semibold">
                      Product Type
                    </label>

                    <select
                      required
                      value={typeId}
                      onChange={(event) =>
                        handleTypeChange(
                          event.target
                            .value
                        )
                      }
                      className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-black"
                    >
                      <option value="">
                        Select product type
                      </option>

                      {firstLevelChildren.map(
                        (type) => (
                          <option
                            key={
                              type.id
                            }
                            value={
                              type.id
                            }
                          >
                            {type.name}
                          </option>
                        )
                      )}

                      <option value="custom">
                        + Other / Custom Type
                      </option>
                    </select>

                    {isCustomType && (
                      <input
                        type="text"
                        value={
                          customType
                        }
                        onChange={(
                          event
                        ) =>
                          setCustomType(
                            event.target
                              .value
                          )
                        }
                        placeholder="Enter custom product type"
                        className="mt-3 w-full rounded-2xl border border-black/10 px-4 py-3"
                      />
                    )}
                  </div>
                )}

              {/* Product Name */}
              {selectedCategory &&
                (!categoryHasTypes ||
                  typeId) && (
                  <div className="sm:col-span-2">
                    <label className="text-sm font-semibold">
                      Product Name
                    </label>

                    <select
                      required
                      value={
                        productCategoryId
                      }
                      onChange={(event) =>
                        handleProductChange(
                          event.target
                            .value
                        )
                      }
                      className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-black"
                    >
                      <option value="">
                        Select product
                      </option>

                      {!isCustomType &&
                        productOptions.map(
                          (product) => (
                            <option
                              key={
                                product.id
                              }
                              value={
                                product.id
                              }
                            >
                              {
                                product.name
                              }
                            </option>
                          )
                        )}

                      <option value="custom">
                        + Other / Custom Product
                      </option>
                    </select>

                    {productOptions.length ===
                      0 &&
                      !isCustomProduct && (
                        <p className="mt-2 text-xs text-gray-500">
                          No predefined products are available here yet. Choose Other / Custom Product.
                        </p>
                      )}

                    {isCustomProduct && (
                      <input
                        type="text"
                        required
                        value={
                          customProductName
                        }
                        onChange={(
                          event
                        ) => {
                          setCustomProductName(
                            event.target
                              .value
                          );

                          setName(
                            event.target
                              .value
                          );
                        }}
                        placeholder="Enter product name"
                        className="mt-3 w-full rounded-2xl border border-black/10 px-4 py-3"
                      />
                    )}
                  </div>
                )}
            </div>
          </section>

          {/* Product Details */}
          <section className="rounded-3xl border border-black/10 bg-white p-6 md:p-8">
            <h2 className="text-2xl font-bold">
              Product Details
            </h2>

            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold">
                  Brand
                </label>

                <input
                  type="text"
                  value={brand}
                  onChange={(event) =>
                    setBrand(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Rosefoam"
                  className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3"
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
                    setMaterial(
                      event.target.value
                    )
                  }
                  placeholder="Optional"
                  className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3"
                />
              </div>

              {variantKind ===
                "mattress" && (
                <div>
                  <label className="text-sm font-semibold">
                    Firmness
                  </label>

                  <select
                    value={firmness}
                    onChange={(event) =>
                      setFirmness(
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                  >
                    <option value="">
                      Not specified
                    </option>

                    {FIRMNESS_OPTIONS.map(
                      (option) => (
                        <option
                          key={option}
                          value={option}
                        >
                          {option}
                        </option>
                      )
                    )}
                  </select>

                  {firmness ===
                    "Other / Custom" && (
                    <input
                      type="text"
                      value={
                        customFirmness
                      }
                      onChange={(
                        event
                      ) =>
                        setCustomFirmness(
                          event.target
                            .value
                        )
                      }
                      placeholder="Enter firmness"
                      className="mt-3 w-full rounded-2xl border border-black/10 px-4 py-3"
                    />
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Description */}
          <section className="rounded-3xl border border-black/10 bg-white p-6 md:p-8">
            <h2 className="text-2xl font-bold">
              Description
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <label className="text-sm font-semibold">
                  Short Description
                </label>

                <textarea
                  rows={3}
                  maxLength={500}
                  value={
                    shortDescription
                  }
                  onChange={(event) =>
                    setShortDescription(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full resize-none rounded-2xl border border-black/10 px-4 py-3"
                />

                <p className="mt-1 text-right text-xs text-gray-400">
                  {shortDescription.length}
                  /500
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold">
                  Full Description
                </label>

                <textarea
                  rows={6}
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full resize-none rounded-2xl border border-black/10 px-4 py-3"
                />
              </div>
            </div>
          </section>

          {/* Options */}
          <section className="rounded-3xl border border-black/10 bg-white p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">
                  Options & Prices
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Update the available product options.
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

            <div className="mt-7 space-y-5">
              {variants.map(
                (
                  variant,
                  index
                ) => (
                  <div
                    key={
                      variant.id ??
                      `new-${index}`
                    }
                    className="rounded-2xl border border-black/10 bg-[#f8f6f2] p-5"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold">
                        Option{" "}
                        {index + 1}
                      </h3>

                      {variants.length >
                        1 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeVariant(
                              index
                            )
                          }
                          className="text-sm font-semibold text-red-600"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {/* Mattress */}
                    {variantKind ===
                      "mattress" && (
                      <div className="mt-5 grid gap-4 sm:grid-cols-3">
                        <div>
                          <label className="text-sm font-semibold">
                            Mattress Size
                          </label>

                          <select
                            required
                            value={
                              variant.size_label ||
                              variant.label
                            }
                            onChange={(
                              event
                            ) =>
                              changeMattressSize(
                                index,
                                event
                                  .target
                                  .value
                              )
                            }
                            className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                          >
                            <option value="">
                              Select size
                            </option>

                            {!MATTRESS_SIZES.includes(
                              variant.size_label ||
                                variant.label
                            ) &&
                              (variant.size_label ||
                                variant.label) && (
                                <option
                                  value={
                                    variant.size_label ||
                                    variant.label
                                  }
                                >
                                  {variant.size_label ||
                                    variant.label}
                                </option>
                              )}

                            {MATTRESS_SIZES.map(
                              (size) => (
                                <option
                                  key={
                                    size
                                  }
                                  value={
                                    size
                                  }
                                >
                                  {size}
                                </option>
                              )
                            )}
                          </select>
                        </div>

                        <PriceField
                          value={
                            variant.price
                          }
                          onChange={(
                            value
                          ) =>
                            updateVariant(
                              index,
                              {
                                price:
                                  value,
                              }
                            )
                          }
                        />

                        <StockField
                          value={
                            variant.stock_status
                          }
                          onChange={(
                            value
                          ) =>
                            updateVariant(
                              index,
                              {
                                stock_status:
                                  value,
                              }
                            )
                          }
                        />
                      </div>
                    )}

                    {/* Duvet */}
                    {variantKind ===
                      "duvet" && (
                      <div className="mt-5 grid gap-4 sm:grid-cols-3">
                        <div>
                          <label className="text-sm font-semibold">
                            Package
                          </label>

                          <select
                            required
                            value={
                              variant.label
                            }
                            onChange={(
                              event
                            ) =>
                              changeDuvetPackage(
                                index,
                                event
                                  .target
                                  .value
                              )
                            }
                            className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                          >
                            <option value="">
                              Select package
                            </option>

                            {!DUVET_PACKAGES.some(
                              (option) =>
                                option.label ===
                                variant.label
                            ) &&
                              variant.label && (
                                <option
                                  value={
                                    variant.label
                                  }
                                >
                                  {
                                    variant.label
                                  }
                                </option>
                              )}

                            {DUVET_PACKAGES.map(
                              (
                                option
                              ) => (
                                <option
                                  key={
                                    option.label
                                  }
                                  value={
                                    option.label
                                  }
                                >
                                  {
                                    option.label
                                  }
                                </option>
                              )
                            )}
                          </select>
                        </div>

                        <PriceField
                          value={
                            variant.price
                          }
                          onChange={(
                            value
                          ) =>
                            updateVariant(
                              index,
                              {
                                price:
                                  value,
                              }
                            )
                          }
                        />

                        <StockField
                          value={
                            variant.stock_status
                          }
                          onChange={(
                            value
                          ) =>
                            updateVariant(
                              index,
                              {
                                stock_status:
                                  value,
                              }
                            )
                          }
                        />
                      </div>
                    )}

                    {/* Standard */}
                    {variantKind ===
                      "standard" && (
                      <div className="mt-5 grid gap-4 sm:grid-cols-3">
                        <div>
                          <label className="text-sm font-semibold">
                            Option
                          </label>

                          <input
                            required
                            type="text"
                            value={
                              variant.label
                            }
                            onChange={(
                              event
                            ) =>
                              updateVariant(
                                index,
                                {
                                  label:
                                    event
                                      .target
                                      .value,
                                }
                              )
                            }
                            placeholder="e.g. Standard, Large, Pair"
                            className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                          />
                        </div>

                        <PriceField
                          value={
                            variant.price
                          }
                          onChange={(
                            value
                          ) =>
                            updateVariant(
                              index,
                              {
                                price:
                                  value,
                              }
                            )
                          }
                        />

                        <StockField
                          value={
                            variant.stock_status
                          }
                          onChange={(
                            value
                          ) =>
                            updateVariant(
                              index,
                              {
                                stock_status:
                                  value,
                              }
                            )
                          }
                        />
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </section>

          {/* Images */}
          <section className="rounded-3xl border border-black/10 bg-white p-6 md:p-8">
            <h2 className="text-2xl font-bold">
              Product Images
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Keep, remove or add product photos. Maximum 8 images.
            </p>

            {existingImages.length >
              0 && (
              <div className="mt-7">
                <h3 className="font-bold">
                  Current Images
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {existingImages.map(
                    (image) => {
                      const removed =
                        removeImageIds.includes(
                          image.id
                        );

                      return (
                        <div
                          key={
                            image.id
                          }
                          className={[
                            "overflow-hidden rounded-2xl border",
                            removed
                              ? "border-red-300 bg-red-50 opacity-60"
                              : primaryImageId ===
                                  image.id
                                ? "border-black"
                                : "border-black/10",
                          ].join(
                            " "
                          )}
                        >
                          <div className="aspect-square bg-[#ece8e1]">
                            <img
                              src={getImageUrl(
                                image.image_path
                              )}
                              alt={
                                image.alt_text ??
                                name
                              }
                              className="h-full w-full object-cover"
                            />
                          </div>

                          <div className="p-3">
                            {!removed && (
                              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                                <input
                                  type="radio"
                                  name="primaryImage"
                                  checked={
                                    primaryImageId ===
                                    image.id
                                  }
                                  onChange={() =>
                                    setPrimaryImageId(
                                      image.id
                                    )
                                  }
                                />

                                Primary image
                              </label>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                toggleRemoveExistingImage(
                                  image.id
                                )
                              }
                              className={[
                                "mt-3 text-sm font-semibold",
                                removed
                                  ? "text-gray-700"
                                  : "text-red-600",
                              ].join(
                                " "
                              )}
                            >
                              {removed
                                ? "Undo Remove"
                                : "Remove Image"}
                            </button>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {/* New Images */}
            <div className="mt-8">
              <h3 className="font-bold">
                Add New Images
              </h3>

              <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-black/15 bg-[#faf9f7] px-6 py-12 text-center transition hover:border-black">
                <span className="text-4xl">
                  📷
                </span>

                <span className="mt-3 font-semibold">
                  Choose product images
                </span>

                <span className="mt-1 text-sm text-gray-500">
                  JPG, PNG or WEBP — maximum 10MB each
                </span>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={
                    handleNewImages
                  }
                  className="hidden"
                />
              </label>

              {newImagePreviews.length >
                0 && (
                <div className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {newImagePreviews.map(
                    (
                      preview,
                      index
                    ) => (
                      <div
                        key={`${preview.file.name}-${index}`}
                        className="overflow-hidden rounded-2xl border border-black/10"
                      >
                        <div className="aspect-square bg-[#ece8e1]">
                          <img
                            src={
                              preview.url
                            }
                            alt={
                              preview.file
                                .name
                            }
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="p-3">
                          <p className="truncate text-xs text-gray-500">
                            {
                              preview.file
                                .name
                            }
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              removeNewImage(
                                index
                              )
                            }
                            className="mt-2 text-sm font-semibold text-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Visibility */}
          <section className="rounded-3xl border border-black/10 bg-white p-6 md:p-8">
            <h2 className="text-2xl font-bold">
              Product Visibility
            </h2>

            <div className="mt-6 space-y-4">
              <label className="flex cursor-pointer gap-3 rounded-2xl border border-black/10 p-4">
                <input
                  type="radio"
                  name="visibility"
                  checked={isActive}
                  onChange={() =>
                    setIsActive(true)
                  }
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
                  name="visibility"
                  checked={!isActive}
                  onChange={() =>
                    setIsActive(false)
                  }
                  className="mt-1"
                />

                <div>
                  <p className="font-semibold">
                    Hidden
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Keep it in the dashboard without displaying it in the shop.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 pt-2 font-semibold">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(event) =>
                    setIsFeatured(
                      event.target
                        .checked
                    )
                  }
                />

                Feature this product on the homepage
              </label>
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 rounded-3xl border border-black/10 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/admin/products"
              className="rounded-full border border-black/10 px-6 py-3 text-center font-semibold"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={
                saving || deleting
              }
              className="rounded-full bg-black px-8 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving Changes..."
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

/*
|--------------------------------------------------------------------------
| Price
|--------------------------------------------------------------------------
*/

function PriceField({
  value,
  onChange,
}: {
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div>
      <label className="text-sm font-semibold">
        Price (UGX)
      </label>

      <input
        required
        type="number"
        min="0"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder="e.g. 850000"
        className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
      />
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Stock
|--------------------------------------------------------------------------
*/

function StockField({
  value,
  onChange,
}: {
  value: StockStatus;
  onChange: (
    value: StockStatus
  ) => void;
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
            event.target
              .value as StockStatus
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