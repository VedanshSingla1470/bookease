
import "dotenv/config";

import app from "./app.js";
import connectDatabase from "./config/database.js";
import { startReminderScheduler } from "./modules/notifications/services/reminder.scheduler.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDatabase();
    startReminderScheduler();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`BookEase API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
