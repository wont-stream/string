import { defaultTransformers } from "@lilybird/transformers";
import { createClient, Intents } from "lilybird";
import DB from "./db";

const db = await DB("./config.json");
const clients = [];
let userData = {
  user: {},
  status: "offline",
  client_status: {},
  broadcast: null,
  activities: [],
};

if (!(await db.has("TOKEN"))) {
  await db.set("TOKEN", "myBotToken");
  userData.updated = true;
}
if (!(await db.has("USERID"))) {
  await db.set("pass", "1125315673829154837");
  userData.updated = true;
}

if (userData.updated) {
  throw new Error("Please update your config.");
}

let token, userid;
token = await db.get("TOKEN");
userid = await db.get("USERID");

await createClient({
  token,
  intents: [Intents.GUILD_MEMBERS, Intents.GUILD_PRESENCES],
  transformers: defaultTransformers,
  listeners: {
    ready: async (client) => {
      console.log(`Logged in as ${client.user.username}`);

      userData.user = await client.rest.getUser(userid);
    },
    presenceUpdate: async (_, data) => {
      if (data.user.id !== userid) return;

      delete data.guild_id;
      delete data.user;

      Object.assign(userData, data);

      return await sendWebSocketMessage();
    },
    guildMemberUpdate: async (client) => {
      userData.user = await client.rest.getUser(userid);

      return await sendWebSocketMessage();
    },
  },
});

const sendWebSocketMessage = async () => {
  const sendPromises = clients.map((ws) => {
    return ws.send(JSON.stringify(userData));
  });

  return await Promise.all(sendPromises);
};

Bun.serve({
  fetch(req, server) {
    if (server.upgrade(req)) {
      return;
    }
    return new Response("Upgrade failed", { status: 500 });
  },
  websocket: {
    open: async (ws) => {
      clients.push(ws);
      ws.send(JSON.stringify(userData));
    },
    close: async (ws) => clients.pop(ws),
  },
});
