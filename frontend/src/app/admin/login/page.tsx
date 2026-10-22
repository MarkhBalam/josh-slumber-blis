"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/admin/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to log in."
        );
      }

      localStorage.setItem(
        "josh-slumber-blis-admin-token",
        data.token
      );

      localStorage.setItem(
        "josh-slumber-blis-admin-user",
        JSON.stringify(data.user)
      );

      router.push("/admin");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while logging in."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f6f2] px-6 py-12 text-[#1f1f1f]">
      <section className="w-full max-w-md rounded-[2rem] border border-black/10 bg-white p-8 shadow-sm">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gray-500">
            Josh Slumber Blis
          </p>

          <h1 className="mt-3 text-3xl font-bold">
            Admin Login
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-500">
            Sign in to manage products, prices, stock, images and customer
            orders.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >
          <div>
            <label
              htmlFor="email"
              className="text-sm font-semibold"
            >
              Email Address
            </label>

            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="admin@example.com"
              className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none transition focus:border-black"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-sm font-semibold"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter your password"
              className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none transition focus:border-black"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-black px-6 py-4 font-semibold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? "Signing In..."
              : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm font-semibold text-gray-500 hover:text-black"
          >
            ← Back to Store
          </Link>
        </div>
      </section>
    </main>
  );
}