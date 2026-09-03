import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthGuard } from './components/layout/AuthGuard'
import { AppShell } from './components/layout/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { CalendarPage } from './pages/CalendarPage'
import { SongDetailPage } from './pages/SongDetailPage'
import { ReleasesLayout } from './pages/ReleasesLayout'
import { ProjectsPage } from './pages/ProjectsPage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { PromoContactsPage } from './pages/PromoContactsPage'
import { BookingPage } from './pages/BookingPage'
import { AdministrativePage } from './pages/AdministrativePage'
import { LegacySongRedirect, LegacyReleaseRedirect } from './pages/LegacyRedirects'

export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AuthGuard />}>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="calendar" element={<CalendarPage />} />

            <Route path="releases" element={<ReleasesLayout />}>
              <Route index element={<Navigate to="projects" replace />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/:releaseId" element={<ProjectDetailPage />} />
              <Route path="contacts" element={<PromoContactsPage />} />
            </Route>
            <Route path="releases/songs/:songId" element={<SongDetailPage />} />

            <Route path="booking" element={<BookingPage />} />

            <Route path="administrative" element={<AdministrativePage />} />

            {/* Legacy Production/Promotion routes — merged into "Sorties". */}
            <Route path="production" element={<Navigate to="/releases/projects" replace />} />
            <Route path="production/:songId" element={<LegacySongRedirect />} />
            <Route path="promotion" element={<Navigate to="/releases/projects" replace />} />
            <Route path="promotion/projects" element={<Navigate to="/releases/projects" replace />} />
            <Route path="promotion/projects/:releaseId" element={<LegacyReleaseRedirect />} />
            <Route path="promotion/contacts" element={<Navigate to="/releases/contacts" replace />} />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
    </HashRouter>
  )
}
