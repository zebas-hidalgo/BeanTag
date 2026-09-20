import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'
import { generateRecipeCardImage, generateCoffeeMenuCardImage, generateCoffeeStickerImage } from './utils/cardGenerator'

if (typeof window !== 'undefined') {
  window.__generateRecipeCardImage = generateRecipeCardImage;
  window.__generateCoffeeMenuCardImage = generateCoffeeMenuCardImage;
  window.__generateCoffeeStickerImage = generateCoffeeStickerImage;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
