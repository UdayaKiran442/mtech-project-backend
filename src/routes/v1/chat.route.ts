import { Hono } from "hono";
import z from "zod";
import { authMiddleware } from "../../middleware/authentication.middleware";
import { fetchChatMessages, sendMessage } from "../../controller/chat.controller";

const chatRoute = new Hono();

const FetchChatMessagesSchema = z.object({
    receiverId: z.string(),
})

export type IFetchChatMessagesSchema = z.infer<typeof FetchChatMessagesSchema> & { userId: string};

chatRoute.post("/fetch-messages", authMiddleware, async (c) => {
    try {
        const validation = FetchChatMessagesSchema.safeParse(await c.req.json());
        if (!validation.success) {
            throw validation.error;
        }
        const payload = {
            ...validation.data,
            userId: c.get("user").userId,
        }
        const messages = await fetchChatMessages(payload);
        return c.json({ success: true, messages });
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errMessage = JSON.parse(error.message);
            return c.json({ success: false, error: errMessage[0], message: errMessage[0].message }, 401);
        }
    }
})

const SendMessageSchema = z.object({
    conversationId: z.string(),
    message: z.string(),
})

export type ISendMessageSchema = z.infer<typeof SendMessageSchema> & { userId: string};

chatRoute.post("/send-message", authMiddleware, async (c) => {
    try {
        const validation = SendMessageSchema.safeParse(await c.req.json());
        if (!validation.success) {
            throw validation.error;
        }
        const payload = {
            ...validation.data,
            userId: c.get("user").userId,
        }
        // Call the service to send the message
        const newMessage = await sendMessage(payload);
        return c.json({ success: true, message: newMessage });
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errMessage = JSON.parse(error.message);
            return c.json({ success: false, error: errMessage[0], message: errMessage[0].message }, 401);
        }
    }
})

export default chatRoute;