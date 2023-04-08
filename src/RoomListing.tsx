import React, { useEffect, useState } from "react";
import { useClientOpts } from "./App";
import { Room, createClient } from "matrix-js-sdk";
import { Link } from "react-router-dom";

export const RoomListing: React.FC<{}> = () => {
  const clientOpts = useClientOpts();
  const [rooms, setRooms] = useState<Room[]>();

  useEffect(() => {
    const client = createClient(clientOpts);
    (async () => {
      const filter = await client.createFilter({
        room: {
          state: {
            lazy_load_members: true,
          },
          timeline: {
            types: [], // to timeline events
          },
        },
      });
      await client.startClient({ filter });
      const rooms = client.getVisibleRooms();
      setRooms(rooms);
    })();

    return () => {
      client.stopClient();
    };
  }, [clientOpts]);

  return (
    <ul>
      {rooms?.map((room) => (
        <li key={room.roomId}>
          <Link to={`/${room.roomId}`}>{room.name}</Link>
        </li>
      ))}
    </ul>
  );
};
