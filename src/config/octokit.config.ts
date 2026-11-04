import fs from "node:fs";
import { App } from "octokit";

export default function octokitInstance(installationId: number) {
	const private_key = fs.readFileSync("/Users/uday/Downloads/mammalio.pem", "utf-8");

	const app = new App({
		appId: "3665302",
		privateKey: private_key,
	});
	const octokit = app.getInstallationOctokit(installationId);
	return octokit;
}
