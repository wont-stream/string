import { defaultTransformers } from "@lilybird/transformers";
import { createClient, Intents } from "lilybird";

const clients = [];
let userData = {
  user: {},
  status: "offline",
  client_status: {},
  broadcast: null,
  activities: [],
};

await createClient({
  token: process.env.TOKEN,
  intents: [Intents.GUILD_MEMBERS, Intents.GUILD_PRESENCES],
  transformers: defaultTransformers,
  listeners: {
    ready: async (client) => {
      console.log(`Logged in as ${client.user.username}`);

      userData.user = await client.rest.getUser(process.env.USERID);
    },
    presenceUpdate: async (_, data) => {
      if (data.user.id !== process.env.USERID) return;

      delete data.guild_id;
      delete data.user;

      Object.assign(userData, data);

      return await sendWebSocketMessage();
    },
    guildMemberUpdate: async (client) => {
      userData.user = await client.rest.getUser(process.env.USERID);

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
