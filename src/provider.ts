import {
  ClientEvent,
  EventType,
  MatrixClient,
  MatrixEvent,
} from "matrix-js-sdk";
import { Doc as YDoc, applyUpdate, mergeUpdates } from "yjs";

const EVENT_TYPE_UPDATE = "kalkspace.marktrix.update";
const DEBOUNCE_TIME = 300;
const SEND_TIME = 1000;

const toBase64 = async (data: Uint8Array) => {
  const base64url = await new Promise<string>((r) => {
    const reader = new FileReader();
    reader.onload = () => r(reader.result as string);
    reader.readAsDataURL(new Blob([data]));
  });

  /*
  The result looks like
  "data:application/octet-stream;base64,<your base64 data>",
  so we split off the beginning:
  */
  return base64url.split(",", 2)[1];
};

async function fromBase64(base64: string): Promise<Uint8Array> {
  const dataUrl = `data:application/octet-binary;base64,${base64}`;

  const res = await fetch(dataUrl);
  return new Uint8Array(await res.arrayBuffer());
}

interface EventPayload {
  update: string;
}

export class MatrixProvider {
  private sentUpdates = new Set<string>();
  private debounceTimeout: number | null = null;
  private sendTimeout: number | null = null;
  private currentBatch: Uint8Array[] = [];
  private initPromise: Promise<void>;

  constructor(
    private doc: YDoc,
    private client: MatrixClient,
    private roomId: string
  ) {
    doc.on("update", this.handleDocUpdate);
    client.on(ClientEvent.Event, this.handleMatrixEvent);

    this.initPromise = (async () => {
      const filter = await client.createFilter({
        room: {
          rooms: [roomId],
          timeline: {
            types: [EVENT_TYPE_UPDATE],
          },
        },
      });

      await client.startClient({ filter, lazyLoadMembers: true });
      await new Promise<void>((resolve) => {
        client.once(ClientEvent.Sync, (state) => {
          console.debug("Matrix client state changed:", state);
          if (state === "PREPARED") {
            resolve();
          }
        });
      });
    })();
  }

  initialize(): Promise<void> {
    return this.initPromise;
  }

  private handleMatrixEvent = async (e: MatrixEvent) => {
    if (e.getType() !== EVENT_TYPE_UPDATE) {
      return;
    }
    if (e.getRoomId() !== this.roomId) {
      return;
    }

    if (e.event.event_id && this.sentUpdates.has(e.event.event_id)) {
      return;
    }

    const content: EventPayload = e.getContent();
    const sender = e.getSender();

    const update = await fromBase64(content.update);

    applyUpdate(this.doc, update, this);
  };

  private handleDocUpdate = async (update: Uint8Array, origin: unknown) => {
    if (origin === this) {
      return;
    }
    console.debug("got doc update");

    if (this.currentBatch.length === 0) {
      if (this.sendTimeout) {
        clearTimeout(this.sendTimeout);
      }
      this.sendTimeout = setTimeout(this.sendBatch, SEND_TIME);
    }
    this.currentBatch.push(update);
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    this.debounceTimeout = setTimeout(this.sendBatch, DEBOUNCE_TIME);
  };

  private sendBatch = async () => {
    console.debug("sending batched update");
    const updates = mergeUpdates(this.currentBatch);
    this.currentBatch = [];
    const updateEncoded: string = await toBase64(updates);
    const { event_id } = await this.client.sendEvent(
      this.roomId,
      EVENT_TYPE_UPDATE,
      <EventPayload>{
        update: updateEncoded,
      }
    );
    this.sentUpdates.add(event_id);
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    if (this.sendTimeout) {
      clearTimeout(this.sendTimeout);
    }
  };

  destroy() {
    this.client.off(ClientEvent.Event, this.handleMatrixEvent);
    this.doc.off("update", this.handleDocUpdate);
    this.client.stopClient();
  }
}
