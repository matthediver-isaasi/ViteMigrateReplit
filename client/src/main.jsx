import { createRoot } from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TenantProvider } from '@/contexts/TenantContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000, // 5 seconds - data considered fresh for 5 seconds
      refetchOnMount: true, // Always check for fresh data when returning to a page
      refetchOnWindowFocus: false, // Don't refetch when window regains focus (too aggressive)
    },
  },
})

createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <TenantProvider>
      <App />
    </TenantProvider>
  </QueryClientProvider>
)
