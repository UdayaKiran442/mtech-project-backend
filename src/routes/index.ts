import { Hono } from "hono";

import userRoute from "./v1/user.route";
import organisationRoute from "./v1/organisation.route";
import workspaceRoute from "./v1/workspace.route";

const v1Router = new Hono();

v1Router.route("/user", userRoute);
v1Router.route("/organisation", organisationRoute);
v1Router.route("/workspace", workspaceRoute);

export default v1Router;
