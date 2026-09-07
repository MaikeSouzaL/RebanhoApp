import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/globals.css'
import App from './App'
import { registerSW } from 'virtual:pwa-register'
import { initTheme } from '@/lib/theme'
import { initPrefs } from '@/lib/prefs'
import { useSession } from '@/store/session'

initTheme()
initPrefs()

// Mantém o app sempre na versão publicada. Sem isso, uma versão antiga pode
// ficar presa no cache do service worker e a pessoa vê telas velhas — foi o
// que fez cadastros parecerem "sumidos". Verifica ao abrir e de minuto em
// minuto, e aplica a atualização sozinho.
const atualizarApp = registerSW({
  immediate: true,
  onNeedRefresh() {
    void atualizarApp(true)
  },
  onRegisteredSW(_url, registro) {
    if (registro) setInterval(() => void registro.update(), 60_000)
  },
})

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
