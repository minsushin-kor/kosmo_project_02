import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import { PetProvider } from './features/pets/context/PetProvider'
import './styles/tokens.css'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PetProvider>
      <RouterProvider router={router} />
    </PetProvider>
  </StrictMode>,
)
