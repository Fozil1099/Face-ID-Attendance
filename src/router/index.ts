import { createRouter, createWebHistory } from "@ionic/vue-router";
import type { RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    redirect: "/tabs/home",
  },
  {
    // Вложенные маршруты для вкладок (IonTabs обязателен)
    path: "/tabs",
    component: () => import("@/views/TabsLayout.vue"),
    children: [
      { path: "", redirect: "/tabs/home" },
      {
        path: "home",
        name: "Home",
        component: () => import("@/views/HomePage.vue"),
      },
      {
        path: "people",
        name: "People",
        component: () => import("@/views/PeoplePage.vue"),
      },
      {
        path: "attendance",
        name: "Attendance",
        component: () => import("@/views/AttendancePage.vue"),
      },
      {
        path: "settings",
        name: "Settings",
        component: () => import("@/views/SettingsPage.vue"),
      },
    ],
  },
  {
    path: "/register",
    name: "Register",
    component: () => import("@/views/RegisterPage.vue"),
  },
  {
    path: "/people/:id/edit",
    name: "EditPerson",
    component: () => import("@/views/EditPersonPage.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
