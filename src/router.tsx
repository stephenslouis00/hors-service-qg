import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthGuard } from './components/layout/AuthGuard'
import { AppShell } from './components/layout/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { CalendarPage } from './pages/CalendarPage'
import { ProductionPage } from './pages/ProductionPage'
import { SongDetailPage } from './pages/SongDetailPage'
import { PromotionLayout } from './pages/PromotionLayout'
import { ProjectsPage } from './pages/ProjectsPage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { PromoContactsPage } from './pages/PromoContactsPage'
import { VenuesPage } from './pages/VenuesPage'
import { AdministrativePage } from './pages/AdministrativePage'

export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AuthGuard />}>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="calendar" element={<CalendarPage />} />

            <Route path="production" element={<ProductionPage />} />
            <Route path="production/:songId" element={<SongDetailPage />} />

            <Route path="promotion" element={<PromotionLayout />}>
              <Route index element={<Navigate to="projects" replace />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/:releaseId" element={<ProjectDetailPage />} />
              <Route path="contacts" element={<PromoContactsPage />} />
            </Route>

            <Route path="booking" element={<VenuesPage />} />

            <Route path="administrative" element={<AdministrativePage />} />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
    </HashRouter>
  )
}
