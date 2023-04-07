import React, { useEffect, useState } from "react";
import { useClientContext } from "./App";
import { Room } from "matrix-js-sdk";
import { Link } from "react-router-dom";

export const RoomListing: React.FC<{}> = () => {
  const client = useClientContext();
  const [rooms, setRooms] = useState<Room[]>();

  useEffect(() => {
    const rooms = client.getVisibleRooms();
    setRooms(rooms);
  }, [client]);

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
