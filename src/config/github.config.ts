import { GitHub } from "arctic";

const github = new GitHub(process.env.GITHUB_CLIENT_ID || "", process.env.GITHUB_CLIENT_SECRET || "", "http://localhost:3000/v1/github/callback");

export default github;
