import { createApp } from "vue";
import { createPinia } from "pinia";
import { IonicVue } from "@ionic/vue";

/* Ionic стили */
import "@ionic/vue/css/core.css";
import "@ionic/vue/css/normalize.css";
import "@ionic/vue/css/structure.css";
import "@ionic/vue/css/typography.css";
import "@ionic/vue/css/padding.css";
import "@ionic/vue/css/float-elements.css";
import "@ionic/vue/css/text-alignment.css";
import "@ionic/vue/css/text-transformation.css";
import "@ionic/vue/css/flex-utils.css";
import "@ionic/vue/css/display.css";

/* Тема */
import "@/theme/variables.css";

import router from "@/router";
import App from "./App.vue";

const app = createApp(App);

app.use(IonicVue, {
  mode: "md", // Material Design стиль
});
app.use(createPinia());
app.use(router);

router.isReady().then(() => {
  app.mount("#app");
});
