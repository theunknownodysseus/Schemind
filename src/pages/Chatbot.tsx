import React, { useState } from "react";

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchResponse = async (message: string) => {
    const apiKey = "UrAE5Hl6hFvaVseYaRMOZ7AJa2sxp62StdoTnwMc"; 
    const endpoint = "https://api.cohere.ai/v1/generate";

    const prompt = User: ${message}\nAI(dont mention that it is a large language model built by the company Cohere, and I am designed to provide helpful, harmless responses to your queries.):;

    try {
      setLoading(true);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: Bearer ${apiKey},
        },
        body: JSON.stringify({
          model: "command-r-plus",
          prompt,
          max_tokens: 150,
          temperature: 0.7,
          top_p: 1.0,
          stop_sequences: ["\n"],
        }),
      });

      if (!response.ok) {
        throw new Error(HTTP error! Status: ${response.status});
      }

      const data = await response.json();
      setLoading(false);

      const aiResponse = data?.generations?.[0]?.text.trim() || "Sorry, I couldn't understand.";
      setMessages((prev) => [...prev, User: ${message}, AI: ${aiResponse}]);
    } catch (error) {
      setLoading(false);
      console.error("Error fetching response:", error);
      setMessages((prev) => [...prev, "Error fetching response. Check API key."]);
    }
  };

  const handleSend = async () => {
    if (input.trim() === "") return;
    await fetchResponse(input);
    setInput("");
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2>Chatbot</h2>
      <div style={{ height: "300px", overflowY: "scroll", border: "1px solid black", padding: "10px" }}>
        {messages.map((msg, index) => (
          <p key={index}>{msg}</p>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{ width: "80%", padding: "10px", marginTop: "10px" }}
      />
      <button onClick={handleSend} style={{ padding: "10px", marginLeft: "10px" }}>
        {loading ? "Loading..." : "Send"}
      </button>
    </div>
  );
};

export default Chatbot;