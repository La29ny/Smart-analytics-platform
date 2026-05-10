import React from "react";

function ChatPanel({ chatHistory }) {
  if (chatHistory.length === 0) {
    return null;
  }

  return (  
    <div className="chat-panel">
      {chatHistory.map((msg, i) => (
        <div key={i} className={`chat-msg ${msg.role}`}>
          <div className="chat-bubble">
            <div>{msg.text}</div>
            
            {msg.context?.lastColumns?.length > 0 && (
              <small style={{ opacity: 0.6 }}>
                Context: {msg.context.lastColumns.join(", ")}
              </small>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ChatPanel;