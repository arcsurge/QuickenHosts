import { Modules } from "@/assets/script/module";

export {};

declare global {
    interface Window {
        tools: Modules;
    }
}
