import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'weather-landing',
      component: () => import('../views/weather/WeatherLandingView.vue'),
    },
    {
      path: '/weather',
      name: 'weather-home',
      component: () => import('../views/weather/WeatherHomeView.vue'),
    },
    {
      path: '/favorites',
      name: 'weather-favorites',
      component: () => import('../views/weather/WeatherFavoritesView.vue'),
    },
    {
      path: '/indices',
      name: 'weather-indices',
      component: () => import('../views/weather/WeatherIndicesView.vue'),
    },
    {
      path: '/battle',
      name: 'weather-battle',
      component: () => import('../views/weather/WeatherBattleView.vue'),
    },
    {
      path: '/about',
      name: 'weather-about',
      component: () => import('../views/weather/WeatherAboutView.vue'),
    },
    {
      path: '/weather/:cityId',
      name: 'weather-detail',
      component: () => import('../views/weather/WeatherDetailView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
    },
  ],
})

export default router
