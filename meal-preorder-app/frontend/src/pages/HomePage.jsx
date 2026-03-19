import React from 'react';
import '../styles/app.css';

export default function HomePage() {
  const categories = ['Meal', 'Coffee', 'Drinks', 'Dessert'];

  return (
    <div className="customer-page">
      <header className="customer-header">
        <button className="language-toggle">ENG</button>
        <nav className="category-nav">
          {categories.map((category) => (
            <button key={category} className="category-btn">
              {category}
            </button>
          ))}
        </nav>
      </header>

      <div className="meal-grid">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="meal-card">
            <div className="meal-image">
              <img src="/path/to/meal-image.jpg" alt="Meal" />
            </div>
            <div className="quantity-control">
              <button className="quantity-btn">-</button>
              <span className="quantity">1</span>
              <button className="quantity-btn">+</button>
            </div>
          </div>
        ))}
      </div>

      <footer className="bottom-nav">
        <button className="nav-btn">🏠</button>
        <button className="nav-btn">🛒</button>
        <button className="nav-btn">📅</button>
        <button className="nav-btn">☰</button>
      </footer>

      <div className="order-summary">
        <p>Ordered meals and drinks</p>
      </div>
    </div>
  );
}
