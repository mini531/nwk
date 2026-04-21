/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense, type ComponentType } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './components/app-layout'
import { HomePage } from './pages/home-page'
import { SuspenseFallback } from './components/suspense-fallback'

// Route-level code splitting: home loads eagerly (first paint), every
// other route is fetched on demand so the main bundle doesn't ship
// maplibre + check-wizard + firebase-auth up front.
const SearchPage = lazy(() =>
  import('./pages/search-page').then((m) => ({ default: m.SearchPage })),
)
const MapPage = lazy(() => import('./pages/map-page').then((m) => ({ default: m.MapPage })))
const CheckPage = lazy(() => import('./pages/check-page').then((m) => ({ default: m.CheckPage })))
const KitPage = lazy(() => import('./pages/kit-page').then((m) => ({ default: m.KitPage })))
const CoursesPage = lazy(() =>
  import('./pages/courses-page').then((m) => ({ default: m.CoursesPage })),
)
const CourseDetailPage = lazy(() =>
  import('./pages/course-detail-page').then((m) => ({ default: m.CourseDetailPage })),
)
const ProfilePage = lazy(() =>
  import('./pages/profile-page').then((m) => ({ default: m.ProfilePage })),
)
const AboutPage = lazy(() => import('./pages/about-page').then((m) => ({ default: m.AboutPage })))
const FaqPage = lazy(() => import('./pages/faq-page').then((m) => ({ default: m.FaqPage })))
const PlacePage = lazy(() => import('./pages/place-page').then((m) => ({ default: m.PlacePage })))
const AdminHomePage = lazy(() =>
  import('./pages/admin-home').then((m) => ({ default: m.AdminHomePage })),
)
const AdminCoursesPage = lazy(() =>
  import('./pages/admin-courses').then((m) => ({ default: m.AdminCoursesPage })),
)
const AdminNotesPage = lazy(() =>
  import('./pages/admin-notes').then((m) => ({ default: m.AdminNotesPage })),
)
const NotFoundPage = lazy(() =>
  import('./pages/not-found-page').then((m) => ({ default: m.NotFoundPage })),
)

const wrap = (Component: ComponentType) => (
  <Suspense fallback={<SuspenseFallback />}>
    <Component />
  </Suspense>
)

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppLayout,
    children: [
      { index: true, Component: HomePage },
      { path: 'search', element: wrap(SearchPage) },
      { path: 'map', element: wrap(MapPage) },
      { path: 'check', element: wrap(CheckPage) },
      { path: 'courses', element: wrap(CoursesPage) },
      { path: 'courses/:id', element: wrap(CourseDetailPage) },
      { path: 'kit', element: wrap(KitPage) },
      { path: 'profile', element: wrap(ProfilePage) },
      { path: 'about', element: wrap(AboutPage) },
      { path: 'faq', element: wrap(FaqPage) },
      { path: 'place', element: wrap(PlacePage) },
      { path: 'admin', element: wrap(AdminHomePage) },
      { path: 'admin/courses', element: wrap(AdminCoursesPage) },
      { path: 'admin/notes', element: wrap(AdminNotesPage) },
      { path: '*', element: wrap(NotFoundPage) },
    ],
  },
])
