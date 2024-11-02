import { createClient, Intents } from "lilybird";
import type { User, ActivityStructure, ClientStatus, Status } from "lilybird";
import type { ServerWebSocket } from "bun";

type StoredData = {
	[key: string]:
		| User.Structure
		| Array<ActivityStructure>
		| ClientStatus
		| Status;
};

const clients: ServerWebSocket<unknown>[] = [];
let userData: StoredData = {
	user: {
		username: "",
		public_flags: 0,
		id: "",
		global_name: "",
		discriminator: "0",
		avatar: "",
	},
	activities: [],
	client_status: {},
	status: "offline",
};

const updateData = async () => {
	Bun.write("./data.json", JSON.stringify(userData));
};

const fsData = Bun.file("./data.json");

if (await fsData.exists()) {
	userData = await fsData.json();
} else {
	await updateData();
}

await createClient({
	token: process.env.TOKEN || "",
	intents: [Intents.GUILD_MEMBERS, Intents.GUILD_PRESENCES],
	listeners: {
		ready(client) {
			console.log(`Logged in as ${client.user.username}`);
		},
		guildMemberUpdate(client, payload) {
			if (payload.user) {
				const { id } = payload.user;

				if (id !== process.env.MONITORED_ID) return;

				userData.user = payload.user;

				updateData();
			}
		},
		presenceUpdate(client, payload) {
			if (payload.user) {
				const { id } = payload.user;

				if (id !== process.env.MONITORED_ID) return;

				if (payload.activities) userData.activities = payload.activities;
				if (payload.client_status)
					userData.client_status = payload.client_status;
				if (payload.status) userData.status = payload.status;

				updateData();
			}
		},
	},
});

Bun.serve({
	fetch(req, server) {
		if (req.url.endsWith("/ws") && server.upgrade(req)) {
			return;
		}
		return Response.json(userData, {
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
		});
	},
	websocket: {
		open: async (ws) => {
			clients.push(ws);
			ws.send(JSON.stringify(userData));
		},
		close: async (ws) => {
			const index = clients.indexOf(ws);
			if (index !== -1) {
				clients.splice(index, 1);
			}
		},
		message: async () => {},
	},
});
