import Link from "next/link";
import { getProducts, homeProductIds } from "@/lib/catalog";
import { imageUrl } from "@/lib/catalog-images";
import { ProductGrid } from "@/components/MenuGrid";
import { getSession } from "@/lib/session";

export default async function HomePage() {
  const session = await getSession();
  const catalog = await getProducts();
  const featuredProducts = homeProductIds.flatMap((id) => {
    const product = catalog.find((item) => item.id === id);
    return product ? [product] : [];
  });
  return (
    <main>
      <section id="home" className="hero">
        <div className="container hero-inner">
          <div className="hero-text">
            <h2>Handcrafted Momos, Made with Love</h2>
            <p>Discover steamed, fried, and specialty momos crafted from fresh ingredients and authentic recipes.</p>
            <div className="hero-actions">
              <a className="btn" href="#menu">See Menu</a>
              <Link className="btn btn-light" href={session.userId ? "/checkout" : "/register_prompt"}>Order Now</Link>
            </div>
          </div>
          <div className="hero-image" aria-hidden="true">
            <img className="hero-img" src={imageUrl("front_pic.png")} alt="Plate of momos" />
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <div className="description"><h2>Why choose Momo Delights?</h2><hr /></div>
          <div className="features-grid">
            <article className="feature"><i className="fas fa-utensils feature-icon" aria-hidden="true" /><h3>Authentic Recipes</h3><p>Family recipes passed down through generations for a true momo experience.</p></article>
            <article className="feature"><i className="fas fa-seedling feature-icon" aria-hidden="true" /><h3>Fresh Ingredients</h3><p>We source local produce daily to keep each bite fresh and flavorful.</p></article>
            <article className="feature"><i className="fas fa-stopwatch feature-icon" aria-hidden="true" /><h3>Quick Service</h3><p>Fast, friendly service whether you dine in, take away, or order online.</p></article>
          </div>
        </div>
      </section>

      <section id="menu" className="menu">
        <div className="container">
          <div className="heading"><h2>Our Menu</h2><hr /><p>Handcrafted varieties to suit every taste.</p></div>
          <ProductGrid products={featuredProducts} />
          <div className="menu-actions"><Link className="btn" href="/menu">See Full Menu</Link></div>
        </div>
      </section>

      <section className="about" id="about">
        <div className="container">
          <div className="about-inner">
            <div className="about-text">
              <h2>Our Story</h2>
              <p>At Momo Delights, every momo is crafted with care. We combine traditional techniques with high-quality ingredients to deliver consistent flavor and texture.</p>
              <ul className="check-list"><li>Authentic Recipes</li><li>Fresh Ingredients</li><li>Quick Service</li><li>Cozy Ambiance</li></ul>
            </div>
            <aside className="about-info"><h3>Visit Us</h3><p>K4/LIG-57, Kalinga Vihar, Bhubaneswar, Odisha</p><p>Mon-Fri: 10:00 - 22:00 • Sat-Sun: 11:00 - 23:00</p><p>Phone: 7815064177</p></aside>
          </div>
        </div>
      </section>

      <section className="testimonials" aria-labelledby="testimonials-title">
        <div className="container">
          <div className="description"><h2 id="testimonials-title">What our customers say</h2><hr /><p>A few words from people who have visited us.</p></div>
          <div className="testimonials-grid">
            <article className="testimonial"><div className="testimonial-meta"><span className="testimonial-rating" aria-label="Rated 5 out of 5">★★★★★</span><span className="testimonial-rating-value">5.0</span></div><blockquote>Fresh, tasty momos and hospitable staff.</blockquote><footer><span className="reviewer-avatar" aria-hidden="true">S</span><span className="reviewer-details"><strong>Savina</strong><span>Customer review</span></span></footer></article>
            <article className="testimonial"><div className="testimonial-meta"><span className="testimonial-rating" aria-label="Rated 5 out of 5">★★★★★</span><span className="testimonial-rating-value">5.0</span></div><blockquote>Good food, plenty of options and quick service.</blockquote><footer><span className="reviewer-avatar" aria-hidden="true">IB</span><span className="reviewer-details"><strong>Ishaan Bakshi</strong><span>Customer review</span></span></footer></article>
            <article className="testimonial"><div className="testimonial-meta"><span className="testimonial-rating" aria-label="Rated 5 out of 5">★★★★★</span><span className="testimonial-rating-value">5.0</span></div><blockquote>Described them as the best momos in Panchkula.</blockquote><footer><span className="reviewer-avatar" aria-hidden="true">NJ</span><span className="reviewer-details"><strong>Nitin Jaiswal</strong><span>Customer review</span></span></footer></article>
            <article className="testimonial"><div className="testimonial-meta"><span className="testimonial-sentiment positive">Positive feedback</span></div><blockquote>Momos prepared and organised hygienically.</blockquote><footer><span className="reviewer-avatar" aria-hidden="true">RM</span><span className="reviewer-details"><strong>RUCHI MANGAL</strong><span>Customer review</span></span></footer></article>
            <article className="testimonial"><div className="testimonial-meta"><span className="testimonial-sentiment mixed">Mixed feedback</span></div><blockquote>Enjoyed the momos, especially gyoza, and suggested improvements to the ambience.</blockquote><footer><span className="reviewer-avatar" aria-hidden="true">TL</span><span className="reviewer-details"><strong>Tavleen Lamba</strong><span>Customer review</span></span></footer></article>
          </div>
        </div>
      </section>

      <section id="contact" className="form-info">
        <div className="container">
          <div className="cont"><h2>Contact Us</h2><hr /><p>Have questions or feedback? We&apos;d love to hear from you!</p></div>
          <div className="contact-grid">
            <form className="contact-form" action="/api/contact" method="post">
              <label htmlFor="contact-name">Name</label><input type="text" id="contact-name" name="name" required />
              <label htmlFor="contact-email">Email</label><input type="email" id="contact-email" name="email" required />
              <label htmlFor="contact-subject">Subject</label><input type="text" id="contact-subject" name="subject" required />
              <label htmlFor="contact-message">Message</label><textarea id="contact-message" name="message" rows={5} required />
              <button className="btn" type="submit">Send Message</button>
            </form>
            <div className="contact-info aside"><h3>Find Us</h3><p><i className="fas fa-location-dot" /> K4/LIG-57, Kalinga Vihar, Bhubaneswar, Odisha</p><p><i className="fas fa-phone" /> <a href="tel:+917815064177">7815064177</a></p><p><i className="fas fa-envelope" /> <a href="mailto:biswapritij15@gmail.com">biswapritij15@gmail.com</a></p></div>
          </div>
        </div>
      </section>
    </main>
  );
}
