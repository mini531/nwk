import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './components/app-layout'
import { HomePage } from './pages/home-page'
import { SearchPage } from './pages/search-page'
import { MapPage } from './pages/map-page'
import { ProfilePage } from './pages/profile-page'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppLayout,
    children: [
      { index: true, Component: HomePage },
      { path: 'search', Component: SearchPage },
      { path: 'map', Component: MapPage },
      { path: 'profile', Component: ProfilePage },
    ],
  },
])
