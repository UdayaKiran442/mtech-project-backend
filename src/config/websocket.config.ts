import { Server as BunEngine } from "@socket.io/bun-engine";
import { Server } from "socket.io";
import { addMessageToDB } from "../repository/messages.repository";

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

    socket.on("joinRoom", (roomId: string) => {
        socket.join(roomId);
    })

    socket.on("newMessage", async (messageData: { conversationId: string; text: string; senderId: string }) => {
        const newMessage = await addMessageToDB({
            conversationId: messageData.conversationId,
            text: messageData.text,
            senderId: messageData.senderId
        });
        io.to(messageData.conversationId).emit("messageAdded", newMessage);
    })
});

export default engine;