// Expose native web API globals in the Jest environment (required for Next.js 15 route testing in JSDOM)
global.Request = globalThis.Request;
global.Response = globalThis.Response;
global.Headers = globalThis.Headers;

require("@testing-library/jest-dom");
