import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/pages/DashboardPage.vue'),
    },
    {
      path: '/add-intake',
      name: 'add-intake',
      component: () => import('@/pages/AddIntakePage.vue'),
    },
    {
      path: '/foods',
      name: 'foods',
      component: () => import('@/pages/FoodsPage.vue'),
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('@/pages/HistoryPage.vue'),
    },
    {
      path: '/plan',
      name: 'plan',
      component: () => import('@/pages/PlanPage.vue'),
    },
  ],
})

export default router
