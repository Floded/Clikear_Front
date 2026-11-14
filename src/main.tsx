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
import { UsersPage } from './pages/users/users-page'
import { CompanySettingsPage } from './pages/settings/company-settings-page'
import { LoginPage } from './pages/login-page'
import { useSession } from '@/features/auth/use-session'
import { getFirstAllowedPath } from '@/lib/permissions'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

function IndexRedirect() {
  const { data: user } = useSession()
  return <Navigate to={getFirstAllowedPath(user) ?? '/login'} replace />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute="class">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<IndexRedirect />} />
                <Route element={<ProtectedRoute feature="tickets" />}>
                  <Route path="/tickets" element={<TicketsPage />} />
                </Route>
                <Route element={<ProtectedRoute feature="organization" />}>
                  <Route path="/organization" element={<OrganizationPage />} />
                </Route>
                <Route element={<ProtectedRoute feature="inventory" />}>
                  <Route path="/inventory" element={<InventoryPage />} />
                  <Route path="/inventory/suppliers" element={<SuppliersPage />} />
                </Route>
                <Route element={<ProtectedRoute feature="budgets" />}>
                  <Route path="/budgets" element={<BudgetsPage />} />
                </Route>
                <Route element={<ProtectedRoute feature="invoices" />}>
                  <Route path="/invoices" element={<InvoicesPage />} />
                </Route>
                <Route element={<ProtectedRoute adminOnly />}>
                  <Route path="/usuarios" element={<UsersPage />} />
                  <Route path="/settings/company" element={<CompanySettingsPage />} />
                </Route>
                <Route path="*" element={<IndexRedirect />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)