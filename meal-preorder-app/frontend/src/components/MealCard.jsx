export default function MealCard({ item }) {
  return (
    <div className="meal-card">
      <div className="meal-image">
        {item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : <span>No image</span>}
      </div>
      <div className="meal-content">
        <h3>{item.name}</h3>
        <p>{item.description || 'No description available.'}</p>
        <div className="meal-footer">
          <span className="price">{item.price} so'm</span>
          <div className="quantity-control">
            <button>➖</button>
            <span className="quantity">1</span>
            <button>➕</button>
          </div>
        </div>
      </div>
    </div>
  );
}
