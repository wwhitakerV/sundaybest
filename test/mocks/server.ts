import { setupServer } from "msw/native";

import { handlers } from "./handlers";

/**
 * MSW server shared by the whole suite; lifecycle lives in `test/setup.ts`.
 *
 * `msw/native`, not `msw/node`, even though Jest runs in Node. MSW's docs point
 * Jest users at the Node integration, but that assumes a plain node or jsdom
 * environment. The `jest-expo` preset resolves modules with React Native's
 * condition, and msw's package exports set `"./node": { "react-native": null }`
 * — the Node entry is deliberately unreachable here, so importing it fails with
 * "Cannot find module 'msw/node'". The `./native` entry is the one published
 * under the `react-native` condition and exports the same `setupServer`.
 */
export const server = setupServer(...handlers);
