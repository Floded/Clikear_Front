import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'

import { AppLayout } from '@/components/layout/app-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { InvoicesPage } from './pages/invoices/invoices-page'
import { InventoryPage } from './pages/inventory/inventory-page'
import { SuppliersPage } from './pages/inventory/suppliers-page'
import { TicketsPage } from './pages/tickets/tickets-page'
import { BudgetsPage } from './pages/budgets/budgets-page'
import { OrganizationPage } from './pages/organization/organization-page'
import { LoginPage } from './pages/login-page'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute="class">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Navigate to="/tickets" replace />} />
                <Route path="/tickets" element={<TicketsPage />} />
                <Route path="/organization" element={<OrganizationPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/inventory/suppliers" element={<SuppliersPage />} />
                <Route path="/invoices" element={<InvoicesPage />} />
                <Route path="/budgets" element={<BudgetsPage />} />
                <Route
                  path="*"
                  element={<Navigate to="/tickets" replace />}
                />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)