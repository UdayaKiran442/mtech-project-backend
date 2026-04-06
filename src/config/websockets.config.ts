import { Server } from "socket.io";
import { Server as Engine } from "@socket.io/bun-engine";


const io = new Server();

const engine = new Engine({
  path: "/socket.io/",
});

io.bind(engine);


io.listen(8000);


export { io, engine };