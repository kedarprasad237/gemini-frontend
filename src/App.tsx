import { useState } from 'react'
import './App.css'

interface Result {
  prompt: string
  brand: string
  mentioned: boolean
  position: number
  raw?: string
  error?: string
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function App() {
  const [prompt, setPrompt] = useState('')
  const [brand, setBrand] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!prompt.trim() || !brand.trim()) {
      setError('Please fill in both prompt and brand name')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/api/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, brand }),
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
        setLoading(false)
        return
      }

      // Add new result to the table
      setResults((prev) => [
        ...prev,
        {
          prompt: data.prompt,
          brand: data.brand,
          mentioned: data.mentioned,
          position: data.position,
          raw: data.raw,
          error: data.error || (data.raw === 'API_ERROR' ? 'API Error: Service temporarily unavailable' : undefined),
        },
      ])

      // Show error message if API error occurred
      if (data.error || data.raw === 'API_ERROR') {
        setError(data.error || 'API Error: Service temporarily unavailable')
      }

      // Clear form
      setPrompt('')
      setBrand('')
    } catch (err) {
      setError('Failed to connect to backend. Please check if the server is running.')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const downloadCSV = () => {
    if (results.length === 0) {
      alert('No results to download')
      return
    }

    // CSV header
    const headers = ['Prompt', 'Brand', 'Mentioned', 'Position']
    
    // CSV rows
    const rows = results.map((result) => {
      const prompt = `"${result.prompt.replace(/"/g, '""')}"`
      const brand = `"${result.brand.replace(/"/g, '""')}"`
      const mentioned = result.mentioned ? 'Yes' : 'No'
      const position = result.position.toString()
      return [prompt, brand, mentioned, position].join(',')
    })

    const csvContent = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', 'brand-mention-results.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="app">
      <h1 className="title">Gemini Brand Mention Checker</h1>
      
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="prompt">Prompt</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here..."
            rows={4}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="brand">Brand Name</label>
          <input
            id="brand"
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="Enter brand name"
            disabled={loading}
          />
        </div>

        <button type="submit" className="run-button" disabled={loading}>
          {loading ? 'Running...' : 'Run'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {results.length > 0 && (
        <div className="results-section">
          <div className="results-header">
            <h2>Results</h2>
            <button onClick={downloadCSV} className="download-button">
              Download CSV
            </button>
          </div>

          <table className="results-table">
            <thead>
              <tr>
                <th>Prompt</th>
                <th>Mentioned</th>
                <th>Position</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr key={index}>
                  <td>{result.prompt}</td>
                  <td>{result.mentioned ? 'Yes' : 'No'}</td>
                  <td>{result.position > 0 ? result.position : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default App

