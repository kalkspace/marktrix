import React, { useCallback, useEffect, useState } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { useParams } from "react-router-dom";
import { Doc as YDoc, Text as YText } from "yjs";
import { MonacoBinding } from "y-monaco";
import { MatrixProvider } from "matrix-crdt";
import { useClientContext } from "./App";

export const Pad: React.FC<{ roomId: string }> = ({ roomId }) => {
  const changeHandler = useCallback(
    (value: string | undefined, ev: unknown) => {
      console.log("content changed:", { value, ev });
    },
    []
  );

  const [yText, setYText] = useState<YText | null>(null);

  const client = useClientContext();
  // todo: does it race when `roomId` changes?
  useEffect(() => {
    const doc = new YDoc();
    const provider = new MatrixProvider(doc, client, {
      type: "id",
      id: roomId,
    });

    provider.onDocumentAvailable((e: unknown) => {
      const text = doc.getText("monaco");
      setYText(text);
    });
    provider.initialize();

    return () => {
      // todo: clean up
    };
  }, [client, roomId]);

  const mountHandler = useCallback<OnMount>(
    (editor) => {
      const editorModel = editor.getModel();
      if (!editorModel || !yText) {
        return;
      }
      const monacoBinding = new MonacoBinding(
        yText,
        editorModel,
        new Set([editor])
      );
    },
    [yText]
  );

  if (!yText) {
    return <p>Loading...</p>;
  }

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        padding: "1rem",
        boxSizing: "border-box",
      }}
    >
      <Editor
        defaultLanguage="markdown"
        onMount={mountHandler}
        onChange={changeHandler}
        options={{
          minimap: {
            enabled: false,
          },
        }}
      />
    </div>
  );
};

export const PadRoute: React.FC<{}> = () => {
  const { roomId } = useParams();

  if (!roomId) {
    return <p>Missing room ID</p>;
  }

  return <Pad roomId={roomId} />;
};
