import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDatabase, ObjectId, type OrderDocument, type UserDocument } from "@/lib/database";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "My Profile | Momo Delights" };

function parseItems(raw: unknown): Array<{ name?: string }> {
  if (Array.isArray(raw)) {
    return raw.filter((item): item is { name?: string } =>
      typeof item === "object" &&
      item !== null &&
      (!("name" in item) || typeof item.name === "string"),
    );
  }
  if (typeof raw !== "string" || !raw) return [];
  try {
    const items: unknown = JSON.parse(raw);
    return parseItems(items);
  } catch (error) {
    console.error("Could not read saved order items:", error);
    return [];
  }
}

export default async function ProfilePage() {
  const session = await getSession();
  if (!session.userId) redirect("/login?notice=Please%20log%20in%20to%20access%20your%20profile&type=warning");

  const db = await getDatabase();
  const user = await db.collection<UserDocument>("users").findOne({
    _id: new ObjectId(session.userId),
  });
  if (!user) redirect("/logout");

  const orders = await db.collection<OrderDocument>("orders")
    .find({ userId: user._id })
    .sort({ createdAt: -1 })
    .toArray();
  const address = user.address || session.profileAddress;

  return (
    <main className="cart-main">
      <div className="container cart-wrap">
        <h1 className="profile-title">My Profile</h1>
        <div className="profile-grid">
          <aside className="profile-sidebar">
            <div className="profile-card">
              <div className="avatar">{user.username.slice(0, 1).toUpperCase()}</div>
              <div className="profile-info">
                <h3>{user.username}</h3>
                <p className="muted">{user.email || "—"}</p>
                <p className="muted">Member since: {String(user.createdAt)}</p>
              </div>
            </div>
            <nav className="profile-nav" aria-label="Profile sections">
              <ul><li className="active">Account</li><li><a href="#orders">Orders</a></li><li><a href="#addresses">Addresses</a></li><li><a href="/logout">Logout</a></li></ul>
            </nav>
            <div className="address-card">
              <h4>Default delivery address</h4>
              {address ? <div className="address-box"><pre>{address}</pre></div> : <p className="muted">No saved address</p>}
              <a className="btn-link" href="#addresses">{address ? "Change" : "Add address"}</a>
            </div>
          </aside>
          <section className="profile-content">
            <div id="orders" className="card">
              <div className="card-header"><h2>Recent Orders</h2></div>
              <div className="card-body">
                {orders.length ? (
                  <ul className="orders-list">
                    {orders.map((order) => (
                      <li className="order-item" key={order._id.toHexString()}>
                        <div className="order-row"><div><strong>Order #{order._id.toHexString()}</strong><div className="muted">Placed: {String(order.createdAt)}</div></div><div className="order-total">₹{Number(order.total).toFixed(2)}</div></div>
                        <div className="order-items small">{parseItems(order.items).map((item, index) => <span className="pill" key={`${item.name ?? "item"}-${index}`}>{item.name ?? "Order item"}</span>)}</div>
                        <div className="order-address small muted">{order.address}</div>
                      </li>
                    ))}
                  </ul>
                ) : <p className="muted">No past orders found. Your completed orders will appear here.</p>}
              </div>
            </div>
            <div id="addresses" className="card address-manage-card">
              <div className="card-header"><h2>Manage Addresses</h2></div>
              <div className="card-body">
                <form method="post" action="/api/profile/address" className="address-form-grid">
                  <div className="form-row"><label htmlFor="line1">Address Line 1</label><input id="line1" name="line1" required /></div>
                  <div className="form-row"><label htmlFor="line2">Address Line 2</label><input id="line2" name="line2" /></div>
                  <div className="form-row"><label htmlFor="city">City</label><input id="city" name="city" required /></div>
                  <div className="form-row"><label htmlFor="state">State</label><input id="state" name="state" /></div>
                  <div className="form-row"><label htmlFor="zipcode">ZIP / Postal Code</label><input id="zipcode" name="zipcode" /></div>
                  <div className="form-row"><label htmlFor="phone">Phone</label><input id="phone" name="phone" required /></div>
                  <div className="address-submit"><button className="btn" type="submit">Save Address</button></div>
                </form>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
