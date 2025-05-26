const http = require("http");
const sh = require("serve-handler");
const ws = require("ws");

let count = 0;
const server = http.createServer((req, res) => {
  return sh(req, res, { public: "public" });
});

const wss = new ws.WebSocketServer({ server });
wss.on("connection", (client) => {
  console.log("Client connected!");
  client.on("message", (json) => {
    try {
      console.log("Message: " + json);
      let msg = JSON.parse(json);

      if (msg.hasOwnProperty("username")) {
        client.color = getDarkColor();
        if (msg.username.trim().length === 0) {
          client.username = "user_" + ++count; 
        } else {
          client.username = msg.username;
        }
        broadcast(
          `{"user": "Server", "message":"${client.username} has entered the chat!"}`
        );
      } else if (msg.hasOwnProperty("message") && msg.message.trim().length > 0) {
        client.message = msg.message;
        client.encrypted = msg.encrypted;
        broadcast(
          `{"user": "${client.username || "User"}", "message":"${client.message}" , "color":"${client.color}" , "encrypted":"${client.encrypted}"}`
        );
      } else if (msg.hasOwnProperty("encrypt")) {
        client.encrypt = msg.encrypt;
        broadcast(
          `{"user": "${client.username || "User"}", "message":"${client.encrypt}" , "color":"${client.color}"}`
        );
      } else {
        console.log("Empty message received, ignoring.");
      }
    } catch (error) {
      console.error("Error processing message:", error.message);
    }
  });

client.on("close", () => {
    console.log(`${client.username} disconnected.`);
    
    broadcast(`{"user": "${client.username || "User"}", "message": "${client.username} has left the chat."}`);
  });
});

function broadcast(msg) {

  for (const client of wss.clients) {

    if (client.readyState === ws.OPEN) {

      client.send(msg);

    }

  }

}

function getDarkColor() {

  var color = "#";

  for (var i = 0; i < 6; i++) {

    color += Math.floor(Math.random() * 10);

  }

  return color;

}


server.listen(process.argv[2] || 8080, () => {

  console.log(

    `Server listening on port ${server._connectionKey.split("::::")[1]}...`

  );

});