"use client";

import { useState } from "react";
import type { Category, Product } from "@/lib/catalog";

type ProductDraft = {
  id: string;
  name: string;
  description: string;
  image: string;
  price: string;
  types: string[];
  vegMenu: boolean;
};

const emptyDraft: ProductDraft = {
  id: "",
  name: "",
  description: "",
  image: "",
  price: "",
  types: [],
  vegMenu: false,
};

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function AdminDashboard({
  initialProducts,
  initialCategories,
}: {
  initialProducts: Product[];
  initialCategories: Category[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [categories, setCategories] = useState(initialCategories);
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft);
  const [categoryName, setCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState("");
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(url: string, method: string, body?: unknown) {
    const response = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const result: unknown = await response.json();
    if (!response.ok) {
      const message = result && typeof result === "object" && "error" in result && typeof result.error === "string"
        ? result.error
        : "The request could not be completed.";
      throw new Error(message);
    }
    return result;
  }

  function startEditing(product: Product) {
    setError("");
    setNotice("");
    setDraft({
      id: product.id,
      name: product.name,
      description: product.description,
      image: product.image,
      price: String(product.price),
      types: [...product.types],
      vegMenu: Boolean(product.vegMenu),
    });
    document.getElementById("admin-product-form")?.scrollIntoView({ behavior: "smooth" });
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const editing = products.some((product) => product.id === draft.id);
      const id = editing ? draft.id : slugify(draft.name);
      if (!id) throw new Error("Enter a product name that can be used to create its ID.");
      const payload = {
        id,
        name: draft.name,
        description: draft.description,
        image: draft.image,
        price: Number(draft.price),
        types: draft.types,
        vegMenu: draft.vegMenu,
      };
      await send(editing ? `/api/admin/products/${id}` : "/api/admin/products", editing ? "PATCH" : "POST", payload);
      const response = await fetch("/api/admin/products");
      if (!response.ok) throw new Error("Product saved, but the product list could not be refreshed.");
      const result = await response.json() as { products: Product[] };
      setProducts(result.products);
      setDraft(emptyDraft);
      setNotice(editing ? "Product updated." : "Product added.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save product.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteProduct(product: Product) {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await send(`/api/admin/products/${product.id}`, "DELETE");
      setProducts((current) => current.filter((entry) => entry.id !== product.id));
      if (draft.id === product.id) setDraft(emptyDraft);
      setNotice("Product deleted.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete product.");
    } finally {
      setBusy(false);
    }
  }

  async function createCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const id = slugify(categoryName);
      if (!id) throw new Error("Enter a category name containing letters or numbers.");
      await send("/api/admin/categories", "POST", { id, name: categoryName });
      setCategories((current) => [...current, { id, name: categoryName.trim() }].sort((a, b) => a.name.localeCompare(b.name)));
      setCategoryName("");
      setNotice("Category added.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not add category.");
    } finally {
      setBusy(false);
    }
  }

  async function renameCategory(id: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await send(`/api/admin/categories/${id}`, "PATCH", { name: editingCategoryName });
      setCategories((current) => current.map((category) =>
        category.id === id ? { ...category, name: editingCategoryName.trim() } : category,
      ).sort((a, b) => a.name.localeCompare(b.name)));
      setEditingCategory("");
      setNotice("Category updated.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update category.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteCategory(category: Category) {
    if (!window.confirm(`Delete category "${category.name}"?`)) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await send(`/api/admin/categories/${category.id}`, "DELETE");
      setCategories((current) => current.filter((entry) => entry.id !== category.id));
      setNotice("Category deleted.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete category.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-main">
      <div className="admin-wrap">
        <header className="admin-heading">
          <div><p className="admin-eyebrow">Store management</p><h1>Admin dashboard</h1></div>
          <p>Manage the products and categories customers see in the storefront.</p>
        </header>
        {error && <p className="admin-message admin-error" role="alert">{error}</p>}
        {notice && <p className="admin-message admin-success" role="status">{notice}</p>}

        <section className="admin-panel" aria-labelledby="product-form-title">
          <h2 id="product-form-title">{products.some((product) => product.id === draft.id) ? "Edit product" : "Add a product"}</h2>
          <form id="admin-product-form" className="admin-product-form" onSubmit={saveProduct}>
            <label>Product name<input required maxLength={120} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
            <label>Price<input required type="number" min="0" max="1000000" step="0.01" value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} /></label>
            <label className="admin-wide">Description<textarea maxLength={1000} rows={3} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
            <label className="admin-wide">Image URL or static filename<input required maxLength={1000} placeholder="classic_momo.jpg or https://…" value={draft.image} onChange={(event) => setDraft({ ...draft, image: event.target.value })} /></label>
            <fieldset className="admin-wide admin-category-picker">
              <legend>Categories (choose at least one)</legend>
              <div>{categories.map((category) => (
                <label key={category.id}><input type="checkbox" checked={draft.types.includes(category.id)} onChange={(event) => setDraft({
                  ...draft,
                  types: event.target.checked
                    ? [...draft.types, category.id]
                    : draft.types.filter((id) => id !== category.id),
                })} /> {category.name}</label>
              ))}</div>
            </fieldset>
            <label className="admin-checkbox"><input type="checkbox" checked={draft.vegMenu} onChange={(event) => setDraft({ ...draft, vegMenu: event.target.checked })} /> Show in vegetarian menu</label>
            <div className="admin-form-actions admin-wide">
              <button className="btn" type="submit" disabled={busy || categories.length === 0}>{busy ? "Saving…" : products.some((product) => product.id === draft.id) ? "Save changes" : "Add product"}</button>
              {products.some((product) => product.id === draft.id) && <button className="admin-secondary" type="button" disabled={busy} onClick={() => setDraft(emptyDraft)}>Cancel edit</button>}
            </div>
          </form>
        </section>

        <section className="admin-panel" aria-labelledby="products-title">
          <div className="admin-panel-heading"><h2 id="products-title">Products <span>{products.length}</span></h2></div>
          {products.length ? (
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead><tr><th>Product</th><th>Price</th><th>Categories</th><th>Actions</th></tr></thead>
                <tbody>{products.map((product) => (
                  <tr key={product.id}>
                    <td><strong>{product.name}</strong><small>{product.id}</small></td>
                    <td>₹{product.price.toFixed(2)}</td>
                    <td>{product.types.map((id) => categories.find((category) => category.id === id)?.name ?? id).join(", ")}</td>
                    <td className="admin-row-actions"><button type="button" className="admin-secondary" disabled={busy} onClick={() => startEditing(product)}>Edit</button><button type="button" className="admin-danger" disabled={busy} onClick={() => void deleteProduct(product)}>Delete</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <p className="admin-empty">No products yet. Add a product above.</p>}
        </section>

        <section className="admin-panel" aria-labelledby="categories-title">
          <div className="admin-panel-heading"><h2 id="categories-title">Categories <span>{categories.length}</span></h2></div>
          <form className="admin-category-create" onSubmit={createCategory}>
            <label htmlFor="new-category">New category</label>
            <input id="new-category" required maxLength={80} value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="e.g. Tandoori" />
            <button type="submit" className="btn" disabled={busy}>Add category</button>
          </form>
          <ul className="admin-category-list">{categories.map((category) => (
            <li key={category.id}>
              {editingCategory === category.id ? (
                <form onSubmit={(event) => { event.preventDefault(); void renameCategory(category.id); }}>
                  <input aria-label={`Rename ${category.name}`} required maxLength={80} value={editingCategoryName} onChange={(event) => setEditingCategoryName(event.target.value)} />
                  <button className="admin-secondary" type="submit" disabled={busy}>Save</button>
                  <button className="admin-secondary" type="button" onClick={() => setEditingCategory("")}>Cancel</button>
                </form>
              ) : (
                <>
                  <span><strong>{category.name}</strong><small>{category.id}</small></span>
                  <div className="admin-row-actions">
                    <button className="admin-secondary" type="button" disabled={busy} onClick={() => { setEditingCategory(category.id); setEditingCategoryName(category.name); }}>Rename</button>
                    <button className="admin-danger" type="button" disabled={busy} onClick={() => void deleteCategory(category)}>Delete</button>
                  </div>
                </>
              )}
            </li>
          ))}</ul>
        </section>
      </div>
    </main>
  );
}
