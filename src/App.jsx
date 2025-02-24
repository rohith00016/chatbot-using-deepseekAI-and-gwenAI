import { useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";

const App = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [model, setModel] = useState(
    "deepseek/deepseek-r1-distill-llama-70b:free"
  );
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);

  const API_KEY = import.meta.env.VITE_API_KEY;

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model,
          messages: newMessages,
          stream: false,
        },
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const botReply =
        response.data.choices[0]?.message?.content || "No response";
      setMessages([...newMessages, { role: "assistant", content: botReply }]);
    } catch (error) {
      console.error("Error fetching response:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(index);
      setTimeout(() => setCopied(null), 1000);
    });
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gray-900 text-white">
      {/* Chat Container */}
      <div className="w-full max-w-4xl h-[90vh] flex flex-col bg-gray-800 shadow-lg rounded-lg overflow-hidden">
        <header className="p-4 bg-gray-700 text-center text-lg font-bold">
          Chat with AI
        </header>
        {/* Model Selection */}
        <div className="p-4 bg-gray-700">
          <select
            className="w-full p-2 border rounded bg-gray-600 text-white"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            <option value="deepseek/deepseek-r1-distill-llama-70b:free">
              DeepSeek R1 Distill (70B)
            </option>
            <option value="qwen/qwen2.5-vl-72b-instruct:free">Qwen Chat</option>
          </select>
        </div>
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`relative p-3 rounded-lg max-w-[75%] break-words whitespace-pre-line ${
                msg.role === "user"
                  ? "bg-blue-500 text-white self-end"
                  : "bg-gray-700 text-white self-start"
              }`}
            >
              <ReactMarkdown
                components={{
                  code({ inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    const codeText = String(children).replace(/\n$/, "");

                    return !inline && match ? (
                      <div className="relative">
                        <button
                          onClick={() => handleCopy(codeText, index)}
                          className="absolute top-2 right-2 px-2 py-1 bg-gray-800 text-white text-xs rounded border border-gray-600 hover:bg-gray-700"
                        >
                          {copied === index ? "Copied!" : "Copy"}
                        </button>
                        <SyntaxHighlighter
                          style={dracula}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                          className="rounded-lg overflow-hidden"
                        >
                          {codeText}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <code
                        className="bg-gray-700 px-1 py-0.5 rounded"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
          ))}
          {/* Loading Indicator */}
          {loading && (
            <div className="p-3 rounded-lg max-w-[75%] bg-gray-700 text-white self-start animate-pulse">
              ...
            </div>
          )}
        </div>
        {/* Input Box */}
        <div className="p-4 bg-gray-700 flex">
          <input
            className="flex-1 p-3 rounded bg-gray-600 text-white border border-gray-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={loading}
          />
          <button
            onClick={handleSend}
            className="ml-2 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
