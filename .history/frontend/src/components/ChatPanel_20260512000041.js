import React, {
  useEffect,
  useRef
} from "react";

import ResultPanel from "./ResultPanel";



function ChatPanel({ chatHistory }) {

  const bottomRef = useRef(null);

  useEffect(() => {

    bottomRef.current?.scrollIntoView({
      behavior: "smooth"
    });

  }, [chatHistory]);

  if (chatHistory.length === 0) {
    return null;
  }

  return (  
    <div className="chat-panel">
      {chatHistory.map((msg, i) => (
        <div key={i} className={`chat-msg ${msg.role}`}>
          <div className="chat-bubble">
            <div>{msg.text}</div>

              {/* {msg.type && msg.type !== "text" && (
                <div style={{ marginTop: 12 }}>
                  <ResultPanel result={msg} />
                </div>
              )} */}
            
            {msg.context?.lastColumns?.length > 0 && (
              <small style={{ opacity: 0.6 }}>
                Context: {msg.context.lastColumns.join(", ")}
              </small>
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

export default ChatPanel;