import { Hono } from "hono";
import chatRoute from "./v1/chat.route";
import githubRoute from "./v1/github.route";
import invitationsRoute from "./v1/invitations.route";
import organisationRoute from "./v1/organisation.route";
import codebotRoute from "./v1/codebot.route";
import searchRoute from "./v1/search.route";
import serviceRoute from "./v1/service.route";
import testRouter from "./v1/test.route";
import userRoute from "./v1/user.route";
import workspaceRoute from "./v1/workspace.route";

const v1Router = new Hono();

v1Router.route("/user", userRoute);
v1Router.route("/organisation", organisationRoute);
v1Router.route("/workspace", workspaceRoute);
v1Router.route("/service", serviceRoute);
v1Router.route("/invitations", invitationsRoute);
v1Router.route("/chat", chatRoute);
v1Router.route("/github", githubRoute);
v1Router.route("/test", testRouter);
v1Router.route("/search", searchRoute);
v1Router.route("/codebot", codebotRoute);

export default v1Router;
