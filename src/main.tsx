import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/globals.css'
import App from './App'
import { initTheme } from '@/lib/theme'
import { initPrefs } from '@/lib/prefs'
import { useSession } from '@/store/session'

initTheme()
initPrefs()

// Le o log do disco, restaura a sessao e liga a rede. A interface ja aparece
// enquanto isso acontece; os guards seguram as rotas ate terminar.
void useSession.getState().iniciar()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
