<template>
    <ControlPanel />
</template>

<script setup lang="ts">

import ControlPanel from "@/view/ControlPanel.vue";
import { UtoolsAction, UtoolsData } from "@/types/global";
import { logger } from "@/utils/JConsole";

const data = reactive<UtoolsData>({});

logger.debug("app init");

provide("enterAction", data);

window.utools.onPluginEnter((action: UtoolsAction) => {
    logger.debug('on plugin enter', action);
    data.action = action;
})

</script>
