import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './components/app-layout'
import { HomePage } from './pages/home-page'
import { SearchPage } from './pages/search-page'
import { MapPage } from './pages/map-page'
import { ProfilePage } from './pages/profile-page'
import { AboutPage } from './pages/about-page'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppLayout,
    children: [
      { index: true, Component: HomePage },
      { path: 'search', Component: SearchPage },
      { path: 'map', Component: MapPage },
      { path: 'profile', Component: ProfilePage },
      { path: 'about', Component: AboutPage },
    ],
  },
])
