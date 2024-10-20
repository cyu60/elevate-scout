import { useEffect, useRef, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa"; 

export default function CommentarySidebar({
  commentary,
  onSendMessage,
  showAIMessages,
  onToggleAIMessages,
  onGenerateCommentary,
  isAIWatching,
}) {
  const chatBoxRef = useRef(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [commentary]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      if (onSendMessage) {
        onSendMessage(message);
      }
      setMessage("");
    }
  };

  return (
    <div
      className="commentary bg-white rounded-lg flex flex-col h-full text-[#9687EC]"
      style={{ maxHeight: "80vh" }}
    >
      <div className="p-4 bg-white border-b border-gray-600 flex-shrink-0 flex items-center justify-between">
        <h2 className="text-2xl font-bold mb-2">Live Chat</h2>
        <button
          onClick={onToggleAIMessages}
          className="text-2xl focus:outline-none"
          aria-label={showAIMessages ? "Hide AI Messages" : "Show AI Messages"}
        >
          {showAIMessages ? <FaEye /> : <FaEyeSlash />}
        </button>
      </div>
      {/* Adjusted the messages container */}
      <div
        className="flex-grow overflow-y-auto p-4 bg-white"
        style={{ maxHeight: "350px" }} // Set a specific height or max-height
        ref={chatBoxRef}
      >
        <div className="space-y-4">
          {commentary.map((comment, index) => {
            if (showAIMessages || comment.type !== "ai") {
              return (
                <div
                  key={index}
                  className={`p-3 rounded shadow ${
                    comment.homelessnessProbability !== undefined &&
                    comment.homelessnessProbability >= 75
                      ? "bg-white text-black text-right"
                      : "bg-gray-700 text-white"
                  }`}
                >
                  <p className="text-xs text-gray-400">
                    {new Date(comment.timestamp).toLocaleTimeString()}
                  </p>
                  <p className="mt-1">{comment.text}</p>
                  {comment.homelessnessProbability !== undefined && (
                    <p className="text-xs text-yellow-400 mt-1">
                      Homelessness Probability:{" "}
                      {comment.homelessnessProbability !== null
                        ? `${comment.homelessnessProbability.toFixed(2)}%`
                        : "N/A"}
                    </p>
                  )}
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
      {/* Uncomment and modify the form below if you want to enable user messaging */}
      {/* 
      <form
        onSubmit={handleSubmit}
        className="p-4 bg-black border-t border-gray-600 flex gap-2 flex-shrink-0"
      >
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-grow px-3 py-2 bg-gray-600 text-white rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button type="submit" className="send">
          Send
        </button>
        <button
          type="button"
          onClick={onGenerateCommentary}
          className="generate-commentary"
          disabled={isAIWatching}
        >
          {isAIWatching ? "Speaking..." : "Speak"}
        </button>
      </form>
      */}
    </div>
  );
}
