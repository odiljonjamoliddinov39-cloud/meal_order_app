export default function MealCard({ item, onAdd }) {
  const remaining = item.plannedQuantity - item.orderedQuantity;

  return (
    <div className="meal-card">
      <div className="meal-image">
        {item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : <span>No image</span>}
      </div>
      <div className="meal-content">
        <div className="meal-row">
          <h3>{item.name}</h3>
          <strong>{Number(item.price).toLocaleString()} so'm</strong>
        </div>
        <p>{item.description || 'No description yet.'}</p>
        <div className="meal-row">
          <span className={remaining > 0 ? 'badge open' : 'badge sold'}>
            {remaining > 0 ? `${remaining} left` : 'Sold out'}
          </span>
          <button disabled={remaining <= 0} onClick={() => onAdd && onAdd(item)}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
