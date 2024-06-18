import { AnyObject } from "@/types/global";

export {};

declare global {
    interface Window {
        tools: AnyObject;
    }
}
