const API_BASE_URL = "http://127.0.0.1:8000/api";

export async function getProducts(category?: string) {
  const url = category
    ? `${API_BASE_URL}/products?category=${encodeURIComponent(category)}`
    : `${API_BASE_URL}/products`;

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }

  return response.json();
}

export async function getCategories() {
  const response = await fetch(`${API_BASE_URL}/categories`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }

  return response.json();
}

export async function getProductBySlug(slug: string) {
  const response = await fetch(`${API_BASE_URL}/products/${slug}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch product");
  }

  return response.json();
}