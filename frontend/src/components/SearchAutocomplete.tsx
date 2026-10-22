"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";
const DEBOUNCE_TIME = 250;

type CategorySuggestion = {
  id: number;
  name: string;
  slug: string;
};

type ProductVariant = {
  id: number;
  label: string | null;
  size_label: string | null;
  price: string;
  stock_status: string;
};

type ProductSuggestion = {
  id: number;
  name: string;
  slug: string;
  brand: string | null;
  image_path: string | null;

  category: {
    name: string;
    slug: string;
  } | null;

  variants: ProductVariant[];
};

type SearchResponse = {
  query: string;
  categories: CategorySuggestion[];
  products: ProductSuggestion[];
};

type SearchItem =
  | {
      type: "category";
      id: string;
      label: string;
      category: CategorySuggestion;
    }
  | {
      type: "product";
      id: string;
      label: string;
      product: ProductSuggestion;
    }
  | {
      type: "all";
      id: string;
      label: string;
    };

type SearchAutocompleteProps = {
  variant?: "desktop" | "mobile";
};

function SearchIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function formatPrice(price: string | number) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(Number(price));
}

function getProductImage(product: ProductSuggestion) {
  if (!product.image_path) {
    return null;
  }

  return `${API_URL}/storage/${product.image_path}`;
}

function getLowestPrice(product: ProductSuggestion) {
  const prices = product.variants
    .filter(
      (variant) =>
        variant.stock_status === "in_stock"
    )
    .map((variant) => Number(variant.price))
    .filter((price) => Number.isFinite(price));

  if (prices.length === 0) {
    return null;
  }

  return Math.min(...prices);
}

function HighlightMatch({
  text,
  query,
}: {
  text: string;
  query: string;
}) {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return <>{text}</>;
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = trimmedQuery.toLowerCase();

  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) {
    return <>{text}</>;
  }

  const before = text.slice(0, index);
  const match = text.slice(
    index,
    index + trimmedQuery.length
  );
  const after = text.slice(
    index + trimmedQuery.length
  );

  return (
    <>
      {before}
      <span className="font-extrabold">
        {match}
      </span>
      <span className="font-semibold">
        {after}
      </span>
    </>
  );
}

export default function SearchAutocomplete({
  variant = "desktop",
}: SearchAutocompleteProps) {
  const router = useRouter();

  const wrapperRef =
    useRef<HTMLDivElement | null>(null);

  const inputRef =
    useRef<HTMLInputElement | null>(null);

  const abortControllerRef =
    useRef<AbortController | null>(null);

  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<
    CategorySuggestion[]
  >([]);
  const [products, setProducts] = useState<
    ProductSuggestion[]
  >([]);

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] =
    useState(-1);

  /*
  |--------------------------------------------------------------------------
  | Build Keyboard Navigation List
  |--------------------------------------------------------------------------
  */

  const searchItems: SearchItem[] = [
    ...categories.map((category) => ({
      type: "category" as const,
      id: `category-${category.id}`,
      label: category.name,
      category,
    })),

    ...products.map((product) => ({
      type: "product" as const,
      id: `product-${product.id}`,
      label: product.name,
      product,
    })),

    ...(query.trim()
      ? [
          {
            type: "all" as const,
            id: "all-results",
            label: query.trim(),
          },
        ]
      : []),
  ];

  /*
  |--------------------------------------------------------------------------
  | Live Search
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const cleanQuery = query.trim();

    if (!cleanQuery) {
      abortControllerRef.current?.abort();

      setCategories([]);
      setProducts([]);
      setLoading(false);
      setIsOpen(false);
      setActiveIndex(-1);

      return;
    }

    setLoading(true);

    const timeout = window.setTimeout(
      async () => {
        abortControllerRef.current?.abort();

        const controller =
          new AbortController();

        abortControllerRef.current =
          controller;

        try {
          const response = await fetch(
            `${API_URL}/api/search?q=${encodeURIComponent(
              cleanQuery
            )}`,
            {
              signal: controller.signal,
              headers: {
                Accept: "application/json",
              },
              cache: "no-store",
            }
          );

          if (!response.ok) {
            throw new Error(
              "Search request failed."
            );
          }

          const data: SearchResponse =
            await response.json();

          setCategories(data.categories ?? []);
          setProducts(data.products ?? []);
          setIsOpen(true);
          setActiveIndex(-1);
        } catch (error) {
          if (
            error instanceof DOMException &&
            error.name === "AbortError"
          ) {
            return;
          }

          setCategories([]);
          setProducts([]);
          setIsOpen(true);
        } finally {
          if (
            !controller.signal.aborted
          ) {
            setLoading(false);
          }
        }
      },
      DEBOUNCE_TIME
    );

    return () => {
      window.clearTimeout(timeout);
    };
  }, [query]);

  /*
  |--------------------------------------------------------------------------
  | Click Outside
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    function handlePointerDown(
      event: MouseEvent | TouchEvent
    ) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target as Node
        )
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener(
      "mousedown",
      handlePointerDown
    );

    document.addEventListener(
      "touchstart",
      handlePointerDown
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown
      );

      document.removeEventListener(
        "touchstart",
        handlePointerDown
      );
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  function goToAllResults(
    searchQuery = query
  ) {
    const cleanQuery = searchQuery.trim();

    if (!cleanQuery) {
      return;
    }

    setIsOpen(false);
    setActiveIndex(-1);

    router.push(
      `/shop?q=${encodeURIComponent(
        cleanQuery
      )}`
    );
  }

  function selectItem(item: SearchItem) {
    setIsOpen(false);
    setActiveIndex(-1);

    if (item.type === "product") {
      router.push(
        `/products/${item.product.slug}`
      );

      return;
    }

    if (item.type === "category") {
      setQuery(item.category.name);

      router.push(
        `/shop?category=${encodeURIComponent(
          item.category.slug
        )}`
      );

      return;
    }

    goToAllResults(item.label);
  }

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      isOpen &&
      activeIndex >= 0 &&
      searchItems[activeIndex]
    ) {
      selectItem(searchItems[activeIndex]);
      return;
    }

    goToAllResults();
  }

  /*
  |--------------------------------------------------------------------------
  | Keyboard Controls
  |--------------------------------------------------------------------------
  */

  function handleKeyDown(
    event: KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);

      return;
    }

    if (
      event.key === "ArrowDown"
    ) {
      event.preventDefault();

      if (!isOpen) {
        setIsOpen(true);
      }

      if (searchItems.length === 0) {
        return;
      }

      setActiveIndex((current) =>
        current >=
        searchItems.length - 1
          ? 0
          : current + 1
      );

      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (searchItems.length === 0) {
        return;
      }

      setActiveIndex((current) =>
        current <= 0
          ? searchItems.length - 1
          : current - 1
      );

      return;
    }

    if (
      event.key === "Enter" &&
      isOpen &&
      activeIndex >= 0 &&
      searchItems[activeIndex]
    ) {
      event.preventDefault();

      selectItem(
        searchItems[activeIndex]
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Shared Dropdown
  |--------------------------------------------------------------------------
  */

  const dropdown =
    isOpen && query.trim() ? (
      <div
        className={`absolute left-0 right-0 top-full z-[100] overflow-hidden border border-border-soft bg-white shadow-2xl ${
          variant === "desktop"
            ? "mt-1 rounded-b-2xl rounded-t-md"
            : "mt-2 rounded-2xl"
        }`}
      >
        {loading ? (
          <div className="flex items-center gap-3 px-4 py-4 text-sm text-text-muted">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-navy/20 border-t-brand-navy" />

            Searching...
          </div>
        ) : (
          <>
            {categories.length === 0 &&
            products.length === 0 ? (
              <button
                type="button"
                onClick={() =>
                  goToAllResults()
                }
                className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-surface-soft"
              >
                <SearchIcon className="h-5 w-5 shrink-0 text-text-muted" />

                <span className="text-sm text-text-main">
                  Search for{" "}
                  <strong>
                    &quot;{query.trim()}&quot;
                  </strong>
                </span>
              </button>
            ) : (
              <>
                {/* Category / Phrase Suggestions */}
                {categories.map(
                  (category, index) => {
                    const isActive =
                      activeIndex === index;

                    return (
                      <button
                        key={category.id}
                        type="button"
                        onMouseEnter={() =>
                          setActiveIndex(
                            index
                          )
                        }
                        onClick={() =>
                          selectItem({
                            type: "category",
                            id: `category-${category.id}`,
                            label:
                              category.name,
                            category,
                          })
                        }
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                          isActive
                            ? "bg-surface-soft"
                            : "hover:bg-surface-soft"
                        }`}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-soft text-brand-navy">
                          <SearchIcon className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm text-text-main">
                            <HighlightMatch
                              text={
                                category.name
                              }
                              query={query}
                            />
                          </p>

                          <p className="mt-0.5 text-[11px] text-text-muted">
                            Category
                          </p>
                        </div>
                      </button>
                    );
                  }
                )}

                {/* Product Suggestions */}
                {products.map(
                  (product, index) => {
                    const itemIndex =
                      categories.length +
                      index;

                    const isActive =
                      activeIndex ===
                      itemIndex;

                    const image =
                      getProductImage(
                        product
                      );

                    const lowestPrice =
                      getLowestPrice(
                        product
                      );

                    return (
                      <button
                        key={product.id}
                        type="button"
                        onMouseEnter={() =>
                          setActiveIndex(
                            itemIndex
                          )
                        }
                        onClick={() =>
                          selectItem({
                            type: "product",
                            id: `product-${product.id}`,
                            label:
                              product.name,
                            product,
                          })
                        }
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${
                          isActive
                            ? "bg-surface-soft"
                            : "hover:bg-surface-soft"
                        }`}
                      >
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-border-soft bg-surface-soft">
                          {image ? (
                            <img
                              src={image}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-brand-navy">
                              <SearchIcon className="h-4 w-4" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-text-main">
                            <HighlightMatch
                              text={
                                product.name
                              }
                              query={query}
                            />
                          </p>

                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-text-muted">
                            {product.brand && (
                              <span>
                                {
                                  product.brand
                                }
                              </span>
                            )}

                            {product.category && (
                              <span>
                                {
                                  product
                                    .category
                                    .name
                                }
                              </span>
                            )}

                            {lowestPrice !==
                              null && (
                              <span className="font-semibold text-brand-navy">
                                From{" "}
                                {formatPrice(
                                  lowestPrice
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  }
                )}

                {/* View All */}
                <button
                  type="button"
                  onMouseEnter={() =>
                    setActiveIndex(
                      searchItems.length -
                        1
                    )
                  }
                  onClick={() =>
                    goToAllResults()
                  }
                  className={`flex w-full items-center gap-3 border-t border-border-soft px-4 py-3.5 text-left transition ${
                    activeIndex ===
                    searchItems.length - 1
                      ? "bg-surface-soft"
                      : "hover:bg-surface-soft"
                  }`}
                >
                  <SearchIcon className="h-5 w-5 shrink-0 text-brand-navy" />

                  <p className="min-w-0 truncate text-sm font-semibold text-brand-navy">
                    See all results for
                    &quot;{query.trim()}&quot;
                  </p>

                  <span className="ml-auto text-brand-navy">
                    →
                  </span>
                </button>
              </>
            )}
          </>
        )}
      </div>
    ) : null;

  /*
  |--------------------------------------------------------------------------
  | Desktop
  |--------------------------------------------------------------------------
  */

  if (variant === "desktop") {
    return (
      <div
        ref={wrapperRef}
        className="relative min-w-0 flex-1"
      >
        <form
          onSubmit={handleSubmit}
          className="flex h-11 overflow-visible"
          role="search"
        >
          <div className="relative min-w-0 flex-1">
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(
                  event.target.value
                );

                if (
                  event.target.value.trim()
                ) {
                  setIsOpen(true);
                }
              }}
              onFocus={() => {
                if (query.trim()) {
                  setIsOpen(true);
                }
              }}
              onKeyDown={
                handleKeyDown
              }
              placeholder="Search mattresses, pillows, duvets..."
              autoComplete="off"
              aria-label="Search products"
              aria-expanded={isOpen}
              className="h-11 w-full rounded-l-xl border border-r-0 border-border-soft bg-surface px-4 text-sm text-text-main outline-none placeholder:text-text-muted focus:border-brand-navy"
            />
          </div>

          <button
            type="submit"
            aria-label="Search"
            className="flex h-11 w-12 shrink-0 items-center justify-center rounded-r-xl bg-brand-yellow text-brand-navy transition hover:brightness-95"
          >
            <SearchIcon className="h-5 w-5" />
          </button>
        </form>

        {dropdown}
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Mobile
  |--------------------------------------------------------------------------
  */

  return (
    <div
      ref={wrapperRef}
      className="relative w-full"
    >
      <form
        onSubmit={handleSubmit}
        className="flex h-11"
        role="search"
      >
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);

            if (
              event.target.value.trim()
            ) {
              setIsOpen(true);
            }
          }}
          onFocus={() => {
            if (query.trim()) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search products..."
          autoComplete="off"
          aria-label="Search products"
          aria-expanded={isOpen}
          className="min-w-0 flex-1 rounded-l-xl border border-r-0 border-border-soft bg-surface px-4 text-sm text-text-main outline-none placeholder:text-text-muted focus:border-brand-navy"
        />

        <button
          type="submit"
          aria-label="Search"
          className="flex w-12 shrink-0 items-center justify-center rounded-r-xl bg-brand-yellow text-brand-navy"
        >
          <SearchIcon className="h-5 w-5" />
        </button>
      </form>

      {dropdown}
    </div>
  );
}