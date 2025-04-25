import { useState, useEffect } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import axios from 'axios'
import './App.css'

function Home() {
  return (
    <div className="page">
      <h1>Home Page</h1>
      <p>Welcome to the sample application.</p>
      <Link to="/items" className="link">View Items</Link>
    </div>
  )
}

function Items() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/items`)
        setItems(response.data)
        setLoading(false)
      } catch (err) {
        setError('Failed to fetch items')
        setLoading(false)
        console.error(err)
      }
    }

    fetchItems()
  }, [])

  if (loading) return <div className="loading">Loading...</div>
  if (error) return <div className="error">{error}</div>

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
  )
}

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>Sample Application</h1>
        <nav>
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/items" className="nav-link">Items</Link>
        </nav>
      </header>
      
      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/items" element={<Items />} />
        </Routes>
      </main>
      
      <footer className="footer">
        <p>FastAPI + React Example Application</p>
      </footer>
    </div>
  )
}

export default App 