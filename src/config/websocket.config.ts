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

// start listening for socket connections
io.on("connection", (socket) => {
    // join the user to a room based on conversation id
    socket.on("joinRoom", (roomId: string) => {
        socket.join(roomId);
    })

    // listen for new events in the room 
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