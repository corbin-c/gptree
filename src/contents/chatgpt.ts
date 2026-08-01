import type { PlasmoCSConfig } from "plasmo";
import { installInterceptor } from "../lib/interceptor";

export const config: PlasmoCSConfig = {
  matches: ["https://chatgpt.com/c/*"],
  world: "MAIN",
};

installInterceptor();
