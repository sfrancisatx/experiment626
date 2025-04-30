import { Room, Client } from "@colyseus/core";
import { Player } from "./schema/Player"; // need to create this file 
import { MyRoomState } from "./schema/MyRoomState";

export class MyRoom extends Room<MyRoomState> {
  maxClients = 4;
  state = new MyRoomState();

  onCreate (options: any) {
    // just let us know that it was actually created
    console.log("MyRoom created!", options);

    this.onMessage("type", (client, message) => {
      //
      // handle "type" message
      console.log(message + "received from " + client.sessionId);
      //
    });
  }

  onJoin (client: Client, options: any) {
    // create a new player, then use that player's sessionID to add it to the hashmap of players
    // if the session id already exists (player rejoining), then it would be overriding the sessionID instance. 
    this.state.players.set(client.sessionId, new Player())
    console.log(client.sessionId, "joined!");
  }

  onLeave (client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

}
