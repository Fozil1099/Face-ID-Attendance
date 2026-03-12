<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue'
</script>

<style>
/* Глобальные стили */
* {
  box-sizing: border-box;
}

ion-content {
  --padding-bottom: 16px;
}

/* Плавные переходы между страницами */
.ion-page-entering {
  animation: fadeSlide 0.25s ease-out;
}

@keyframes fadeSlide {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
