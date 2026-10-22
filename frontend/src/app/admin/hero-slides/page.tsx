"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

type HeroSlide = {
  id: number;
  title: string;
  image_path: string;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type FormState = {
  title: string;
  link_url: string;
  sort_order: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  title: "",
  link_url: "",
  sort_order: "0",
  is_active: true,
};

function getImageUrl(path: string) {
  return `${API_URL}/storage/${path}`;
}

export default function AdminHeroSlidesPage() {
  const router = useRouter();

  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [editingSlide, setEditingSlide] =
    useState<HeroSlide | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Load Slides
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    async function loadSlides() {
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

        const response = await fetch(
          `${API_URL}/api/admin/hero-slides`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

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

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load homepage highlights."
          );
        }

        setSlides(data.data ?? []);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Something went wrong while loading homepage highlights."
        );
      } finally {
        setLoading(false);
      }
    }

    loadSlides();
  }, [router]);

  /*
  |--------------------------------------------------------------------------
  | Image Preview Cleanup
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  /*
  |--------------------------------------------------------------------------
  | Stats
  |--------------------------------------------------------------------------
  */

  const activeSlides = useMemo(
    () => slides.filter((slide) => slide.is_active).length,
    [slides]
  );

  /*
  |--------------------------------------------------------------------------
  | Form Helpers
  |--------------------------------------------------------------------------
  */

  function updateForm<K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetForm() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setForm(emptyForm);
    setSelectedImage(null);
    setPreviewUrl("");
    setEditingSlide(null);
    setError("");
  }

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0] ?? null;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedImage(file);

    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl("");
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Start Editing
  |--------------------------------------------------------------------------
  */

  function handleEdit(slide: HeroSlide) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setEditingSlide(slide);

    setForm({
      title: slide.title,
      link_url: slide.link_url ?? "",
      sort_order: String(slide.sort_order),
      is_active: slide.is_active,
    });

    setSelectedImage(null);
    setPreviewUrl("");
    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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

    const token = localStorage.getItem(
      "josh-slumber-blis-admin-token"
    );

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    if (!form.title.trim()) {
      setError("Please enter a title.");
      return;
    }

    if (!editingSlide && !selectedImage) {
      setError("Please choose an image.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const formData = new FormData();

      formData.append("title", form.title.trim());

      formData.append(
        "link_url",
        form.link_url.trim()
      );

      formData.append(
        "sort_order",
        form.sort_order || "0"
      );

      formData.append(
        "is_active",
        form.is_active ? "1" : "0"
      );

      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      const endpoint = editingSlide
        ? `${API_URL}/api/admin/hero-slides/${editingSlide.id}`
        : `${API_URL}/api/admin/hero-slides`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

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

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 422 && data.errors) {
          const firstError =
            Object.values(data.errors)
              .flat()
              .find(
                (message): message is string =>
                  typeof message === "string"
              );

          throw new Error(
            firstError ||
              "Please check the form and try again."
          );
        }

        throw new Error(
          data.message ||
            "Failed to save homepage highlight."
        );
      }

      if (editingSlide) {
        setSlides((current) =>
          current
            .map((slide) =>
              slide.id === editingSlide.id
                ? data.data
                : slide
            )
            .sort(
              (a, b) =>
                a.sort_order - b.sort_order ||
                a.id - b.id
            )
        );

        setSuccess(
          "Homepage highlight updated successfully."
        );
      } else {
        setSlides((current) =>
          [...current, data.data].sort(
            (a, b) =>
              a.sort_order - b.sort_order ||
              a.id - b.id
          )
        );

        setSuccess(
          "Homepage highlight uploaded successfully."
        );
      }

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setForm(emptyForm);
      setSelectedImage(null);
      setPreviewUrl("");
      setEditingSlide(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while saving the highlight."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Toggle Active
  |--------------------------------------------------------------------------
  */

  async function handleToggleActive(
    slide: HeroSlide
  ) {
    const token = localStorage.getItem(
      "josh-slumber-blis-admin-token"
    );

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    try {
      setError("");
      setSuccess("");

      const formData = new FormData();

      formData.append(
        "is_active",
        slide.is_active ? "0" : "1"
      );

      const response = await fetch(
        `${API_URL}/api/admin/hero-slides/${slide.id}`,
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

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update highlight status."
        );
      }

      setSlides((current) =>
        current.map((item) =>
          item.id === slide.id
            ? data.data
            : item
        )
      );

      setSuccess(
        data.data.is_active
          ? "Highlight activated."
          : "Highlight deactivated."
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update highlight status."
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Delete
  |--------------------------------------------------------------------------
  */

  async function handleDelete(slide: HeroSlide) {
    const confirmed = window.confirm(
      `Delete "${slide.title}"? This will also delete its uploaded image.`
    );

    if (!confirmed) {
      return;
    }

    const token = localStorage.getItem(
      "josh-slumber-blis-admin-token"
    );

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    try {
      setDeletingId(slide.id);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/api/admin/hero-slides/${slide.id}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete homepage highlight."
        );
      }

      setSlides((current) =>
        current.filter(
          (item) => item.id !== slide.id
        )
      );

      if (editingSlide?.id === slide.id) {
        resetForm();
      }

      setSuccess(
        "Homepage highlight deleted successfully."
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete homepage highlight."
      );
    } finally {
      setDeletingId(null);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f6f2]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-black/10 border-t-[#040D52]" />

          <p className="mt-4 font-semibold text-[#1f1f1f]">
            Loading homepage highlights...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f6f2] text-[#1f1f1f]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Header */}
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-[#040D52]"
            >
              ← Admin Dashboard
            </Link>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-[#040D52]">
              Homepage Management
            </p>

            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Homepage Highlights
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
              Upload and manage the images that rotate
              in the right side of the homepage hero.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="rounded-2xl border border-black/10 bg-white px-5 py-3">
              <p className="text-xs font-medium text-gray-400">
                Total
              </p>

              <p className="mt-1 text-xl font-bold">
                {slides.length}
              </p>
            </div>

            <div className="rounded-2xl bg-[#040D52] px-5 py-3 text-white">
              <p className="text-xs font-medium text-white/60">
                Active
              </p>

              <p className="mt-1 text-xl font-bold">
                {activeSlides}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-7 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
            {success}
          </div>
        )}

        {/* Form */}
        <section className="mt-8 rounded-3xl border border-black/10 bg-white p-5 sm:p-7 lg:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                {editingSlide
                  ? "Edit Highlight"
                  : "New Highlight"}
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                {editingSlide
                  ? editingSlide.title
                  : "Add homepage image"}
              </h2>
            </div>

            {editingSlide && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-black/10 bg-[#f8f6f2] px-4 py-2 text-sm font-semibold transition hover:border-black"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-7 grid gap-7 lg:grid-cols-[1fr_0.9fr]"
          >
            {/* Fields */}
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="title"
                  className="text-sm font-semibold"
                >
                  Internal title
                </label>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  This helps you identify the image in
                  Admin. It does not have to appear on
                  the homepage.
                </p>

                <input
                  id="title"
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    updateForm(
                      "title",
                      event.target.value
                    )
                  }
                  placeholder="e.g. Martyrs Day Promotion"
                  className="mt-3 w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-[#040D52]"
                />
              </div>

              <div>
                <label
                  htmlFor="image"
                  className="text-sm font-semibold"
                >
                  Highlight image
                </label>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  JPG, PNG or WebP. Maximum size 8 MB.
                  Use a landscape design for the best
                  homepage appearance.
                </p>

                <input
                  id="image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="mt-3 block w-full rounded-2xl border border-dashed border-black/20 bg-[#f8f6f2] px-4 py-4 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-[#040D52] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-[#040D52]"
                />

                {editingSlide && (
                  <p className="mt-2 text-xs text-gray-500">
                    Leave this empty if you want to
                    keep the current image.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="link_url"
                  className="text-sm font-semibold"
                >
                  Destination link
                  <span className="ml-2 font-normal text-gray-400">
                    Optional
                  </span>
                </label>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Where the customer should go after
                  clicking this highlight.
                </p>

                <input
                  id="link_url"
                  type="text"
                  value={form.link_url}
                  onChange={(event) =>
                    updateForm(
                      "link_url",
                      event.target.value
                    )
                  }
                  placeholder="/shop?category=mattresses"
                  className="mt-3 w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-[#040D52]"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="sort_order"
                    className="text-sm font-semibold"
                  >
                    Display order
                  </label>

                  <p className="mt-1 text-xs text-gray-500">
                    Lower numbers appear first.
                  </p>

                  <input
                    id="sort_order"
                    type="number"
                    min="0"
                    value={form.sort_order}
                    onChange={(event) =>
                      updateForm(
                        "sort_order",
                        event.target.value
                      )
                    }
                    className="mt-3 w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-[#040D52]"
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    Visibility
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Only active images appear publicly.
                  </p>

                  <label className="mt-3 flex min-h-[52px] cursor-pointer items-center gap-3 rounded-2xl border border-black/10 px-4">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(event) =>
                        updateForm(
                          "is_active",
                          event.target.checked
                        )
                      }
                      className="h-4 w-4 accent-[#040D52]"
                    />

                    <span className="text-sm font-semibold">
                      Active
                    </span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-2xl bg-[#040D52] px-5 py-4 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[220px]"
              >
                {saving
                  ? "Saving..."
                  : editingSlide
                    ? "Save Changes"
                    : "Upload Highlight"}
              </button>
            </div>

            {/* Preview */}
            <div>
              <p className="text-sm font-semibold">
                Homepage preview
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                The final homepage may crop slightly
                depending on screen size.
              </p>

              <div className="mt-3 overflow-hidden rounded-3xl border border-black/10 bg-[#f2f1ec]">
                <div className="relative aspect-[4/3] overflow-hidden bg-[#040D52]">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Selected highlight preview"
                      className="h-full w-full object-cover"
                    />
                  ) : editingSlide ? (
                    <img
                      src={getImageUrl(
                        editingSlide.image_path
                      )}
                      alt={editingSlide.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-8 text-center text-white">
                      <div>
                        <div className="text-5xl">
                          🖼️
                        </div>

                        <p className="mt-4 text-sm font-semibold">
                          Your uploaded highlight will
                          appear here.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-4 bg-white p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      {form.title ||
                        "Homepage Highlight"}
                    </p>

                    <p className="mt-1 truncate text-xs text-gray-500">
                      {form.link_url ||
                        "No destination link"}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                      form.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {form.is_active
                      ? "ACTIVE"
                      : "INACTIVE"}
                  </span>
                </div>
              </div>
            </div>
          </form>
        </section>

        {/* Existing Slides */}
        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                Current Highlights
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Homepage carousel
              </h2>
            </div>

            <p className="text-sm text-gray-500">
              {slides.length === 0
                ? "No highlights uploaded yet"
                : `${slides.length} highlight${
                    slides.length === 1 ? "" : "s"
                  }`}
            </p>
          </div>

          {slides.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-black/15 bg-white px-6 py-14 text-center">
              <div className="text-5xl">
                🖼️
              </div>

              <h3 className="mt-5 text-xl font-bold">
                No homepage highlights yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                Upload your first promotional image
                above. Once active, it will be available
                to the homepage carousel.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {slides.map((slide) => (
                <article
                  key={slide.id}
                  className="overflow-hidden rounded-3xl border border-black/10 bg-white"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#040D52]">
                    <img
                      src={getImageUrl(
                        slide.image_path
                      )}
                      alt={slide.title}
                      className="h-full w-full object-cover"
                    />

                    <div className="absolute left-3 top-3">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold shadow-sm ${
                          slide.is_active
                            ? "bg-green-500 text-white"
                            : "bg-gray-800 text-white"
                        }`}
                      >
                        {slide.is_active
                          ? "ACTIVE"
                          : "INACTIVE"}
                      </span>
                    </div>

                    <div className="absolute right-3 top-3">
                      <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#040D52] shadow-sm">
                        #{slide.sort_order}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-bold">
                      {slide.title}
                    </h3>

                    <div className="mt-3 rounded-2xl bg-[#f8f6f2] p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
                        Destination
                      </p>

                      <p className="mt-1 break-all text-sm text-gray-600">
                        {slide.link_url ||
                          "No destination link"}
                      </p>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleEdit(slide)
                        }
                        className="rounded-xl bg-[#040D52] px-3 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleToggleActive(slide)
                        }
                        className="rounded-xl border border-black/10 bg-white px-3 py-3 text-sm font-semibold transition hover:border-[#040D52]"
                      >
                        {slide.is_active
                          ? "Deactivate"
                          : "Activate"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(slide)
                        }
                        disabled={
                          deletingId === slide.id
                        }
                        className="col-span-2 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId === slide.id
                          ? "Deleting..."
                          : "Delete Highlight"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}