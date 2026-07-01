// Fail-safe entrypoint: older Cloudflare deploy configurations may still point at this file.
// Delegate to the full route-exposure sanitizer wrapper so every HTML route is protected,
// not just the homepage.
export { default } from "./clientsurge-security-edge-wrapper.mjs";
