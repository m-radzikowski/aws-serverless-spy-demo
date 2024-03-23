import type {Config} from "jest";

export default {
	testEnvironment: "node",
	testMatch: ["<rootDir>/integrationTests/**/*.test.ts"],
	transform: {
		"^.+\\.(t|j)sx?$": "@swc/jest",
	},
	testTimeout: 30_000,
} satisfies Config;
