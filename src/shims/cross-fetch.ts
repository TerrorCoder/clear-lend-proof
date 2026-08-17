// ESM shim for the CJS `cross-fetch` ponyfill.
// The Midnight providers import `{ fetch }` from it; browsers have had native
// fetch forever, so we just re-export the platform implementation. Aliased in
// vite.config.ts to avoid CJS named-export interop failures in the browser.
const nativeFetch = globalThis.fetch.bind(globalThis);

export default nativeFetch;
export { nativeFetch as fetch };
export const Headers = globalThis.Headers;
export const Request = globalThis.Request;
export const Response = globalThis.Response;
