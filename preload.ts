import fs from "fs";
import path from "node:path";
import { exec } from "./public/sudo-prompt";
import { pingAsync } from "./public/ping";

window.tools = {
    process, exec, path, pingAsync, fs
};

console.log("preload loaded");
