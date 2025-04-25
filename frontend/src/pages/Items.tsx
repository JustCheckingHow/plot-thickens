import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Item } from '../types';
import { fetchItems } from '../services/api';

const Items: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getItems = async () => {
      try {
        const data = await fetchItems();
        setItems(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch items');
        setLoading(false);
        console.error(err);
      }
    };

    getItems();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="page">
      <h1>Items</h1>
      <ul className="items-list">
        {items.map(item => (
          <li key={item.id} className="item">
            {item.name}
          </li>
        ))}
      </ul>
      <Link to="/" className="link">Back to Home</Link>
    </div>
  );
};

export default Items; 