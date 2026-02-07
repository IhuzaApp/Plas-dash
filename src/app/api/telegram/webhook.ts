import { NextApiRequest, NextApiResponse } from "next";
import TelegramBot from "node-telegram-bot-api";

const TELEGRAM_BOT_TOKEN = "8108990584:AAEYZ6mqRIAxYCPdT8Ax74k7Fuglzy4kKsU";

// Initialize bot without polling (webhook mode)
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

// Store connections in memory (in production, use database)
const telegramConnections = new Map<string, string>();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "No message in request body" });
    }

    const chatId = message.chat.id;
    const username = message.from?.username || "NoUsername";
    const name = `${message.from?.first_name || ""} ${
      message.from?.last_name || ""
    }`.trim();
    const userId = message.from?.id;
    const text = message.text;

    console.log("📨 Received message:", { chatId, username, name, text });

    // Handle /start command
    if (text === "/start") {
      console.log("✅ /start received!");
      console.log("👤 User Info:", { name, username, userId, chatId });

      await bot.sendMessage(
        chatId,
        `Hi ${name}! 🎉\n\nYou're now connected to PlaseraBot!\n\nYour Chat ID: ${chatId}\n\nThis ID will be used to send you notifications about your orders.`
      );

      return res.status(200).json({ success: true });
    }

    // Handle /start with shopper ID
    if (text?.startsWith("/start ")) {
      const shopperId = text.split(" ")[1];

      console.log("✅ /start with shopper ID received!");
      console.log("👤 User Info:", {
        name,
        username,
        userId,
        chatId,
        shopperId,
      });

      // Store the connection
      telegramConnections.set(shopperId, chatId.toString());

      await bot.sendMessage(
        chatId,
        `Hi ${name}! 🎉\n\nYou're now connected to PlaseraBot!\n\nYour Chat ID: ${chatId}\nShopper ID: ${shopperId}\n\nThis connection will be used to send you order notifications.`
      );

      return res.status(200).json({ success: true });
    }

    // Handle other commands
    if (text === "/help") {
      await bot.sendMessage(
        chatId,
        `🤖 PlaseraBot Commands:\n\n/start - Connect your account\n/start [shopperId] - Connect with shopper ID\n/help - Show this help message\n/status - Check connection status`
      );
      return res.status(200).json({ success: true });
    }

    if (text === "/status") {
      const isConnected = Array.from(telegramConnections.values()).includes(
        chatId.toString()
      );
      await bot.sendMessage(
        chatId,
        isConnected
          ? `✅ You are connected to PlaseraBot!\nChat ID: ${chatId}`
          : `❌ You are not connected. Use /start to connect.`
      );
      return res.status(200).json({ success: true });
    }

    // Default response for unknown messages
    await bot.sendMessage(
      chatId,
      `Hi! I'm PlaseraBot. Use /start to connect your account or /help for more information.`
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Export the connections map and bot for use in other parts of the app
export { telegramConnections, bot };
