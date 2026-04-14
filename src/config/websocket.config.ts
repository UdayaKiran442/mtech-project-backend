import { Server as BunEngine } from "@socket.io/bun-engine";
import { Server } from "socket.io";

const io = new Server({
    path: "/socket.io/",
    cors: {
        origin: "http://localhost:3001",
        credentials: true,
        methods: ["GET", "POST"],
    },
});

const engine = new BunEngine({
    path: "/socket.io/",
});

io.bind(engine);

io.on("connection", (socket) => {
    console.log("a user connected", socket.id);
});

export default engine;