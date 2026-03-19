import { useEffect, useState } from 'react';
import api from '../api/client.js';
import MealCard from '../components/MealCard.jsx';
import '../styles/app.css';

export default function HomePage() {
  const [meals, setMeals] = useState([]);
  const [categories, setCategories] = useState(['Meal', 'Coffee', 'Drinks', 'Dessert']);
  const [selectedCategory, setSelectedCategory] = useState('Meal');

  useEffect(() => {
    api.get('/menu/items').then((res) => {
      setMeals(res.data);
    }).catch((err) => {
      console.error('Error fetching meals:', err);
    });
  }, []);

  const filteredMeals = meals.filter(meal => meal.category === selectedCategory);

  return (
    <div className="customer-page">
      <header className="customer-header">
        <button className="language-toggle">ENG</button>
        <nav className="category-nav">
          {categories.map((category) => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </nav>
      </header>

      <div className="meal-grid">
        {filteredMeals.map((meal) => (
          <MealCard key={meal.id} item={meal} />
        ))}
      </div>

      <footer className="bottom-nav">
        <button className="nav-btn">🏠</button>
        <button className="nav-btn">🛒</button>
        <button className="nav-btn">📅</button>
        <button className="nav-btn">☰</button>
      </footer>
    </div>
  );
}
