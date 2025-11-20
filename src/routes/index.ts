import { Hono } from "hono";

import userRoute from "./v1/user.route";

const v1Router = new Hono();

v1Router.route("/user", userRoute);

export default v1Router;
