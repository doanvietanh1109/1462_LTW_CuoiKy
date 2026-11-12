import React, { useState, useEffect, useRef } from "react";
import { apiRequest } from "../../api/apiClient";

const INITIAL_BOT_MESSAGE = {
  id: "welcome",
  sender: "bot",
  isWelcome: true,
};

const formatBotSegments = (text = "") => {
  return String(text)
    .split(/(\*\*.+?\*\*)/g)
    .map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={idx}>{part.slice(2, -2)}</strong>;
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
};

export const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([INITIAL_BOT_MESSAGE]);
  const [sending, setSending] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    const handleToggleEvent = () => {
      setIsOpen((prev) => !prev);
    };
    window.addEventListener("toggle-ai-chat", handleToggleEvent);
    return () => window.removeEventListener("toggle-ai-chat", handleToggleEvent);
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [messages, isOpen, sending]);

  const toggleAIChat = () => {
    setIsOpen((prev) => !prev);
  };

  const clearChat = () => {
    setMessages([INITIAL_BOT_MESSAGE]);
  };

  const handleSendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const response = await apiRequest("/chat/gemini", {
        method: "POST",
        body: JSON.stringify({ message: trimmed }),
      });
      const reply =
        response?.data?.reply ||
        "Mình chưa tạo được phản hồi phù hợp. Bạn thử hỏi lại giúp mình nhé.";
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: reply,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: "bot",
          text: `Xin lỗi, mình chưa thể kết nối AI lúc này. ${error.message || ""}`,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <>
      <button
        type="button"
        id="chat-float-btn"
        className="chat-float-btn"
        onClick={toggleAIChat}
        title="Chat với AI"
        style={{ display: isOpen ? "none" : "flex" }}
      >
        <i className="bi bi-chat-dots-fill"></i>
        <span className="chat-badge">AI</span>
      </button>

      <div id="ai-chat-box" className={`chat-box ${isOpen ? "show" : ""}`}>
        <div className="chat-header">
          <div className="chat-header-left">
            <div className="chat-bot-avatar">
              <i className="bi bi-robot"></i>
            </div>
            <div className="chat-header-info">
              <span className="chat-title">Ript Rental ChatBot</span>
              <span className="chat-status">
                <i className="bi bi-circle-fill"></i> Online
              </span>
            </div>
          </div>
          <div className="chat-header-actions">
            <button
              type="button"
              onClick={clearChat}
              className="chat-action-btn"
              title="Xóa lịch sử"
            >
              <i className="bi bi-trash3"></i>
            </button>
            <button
              type="button"
              onClick={toggleAIChat}
              className="chat-action-btn"
              title="Đóng"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        <div id="chat-content" className="chat-content" ref={contentRef}>
          {messages.map((msg) =>
            msg.isWelcome ? (
              <div key={msg.id} className="chat-message bot-message">
                <div className="message-avatar">
                  <i className="bi bi-robot"></i>
                </div>
                <div className="message-text">
                  <p>
                    <strong>
                      Xin chào! Tôi là Ript Rental ChatBot - trợ lý AI của RIPT
                      Rental 🏠✨
                    </strong>
                  </p>
                  <p>Tôi có thể giúp bạn:</p>
                  <ul>
                    <li>🔍 Tìm kiếm nhà trọ theo địa điểm</li>
                    <li>💰 Tư vấn về giá cả và tiện nghi</li>
                    <li>📍 Gợi ý khu vực phù hợp</li>
                    <li>❓ Giải đáp thắc mắc về dịch vụ</li>
                  </ul>
                  <p>Bạn đang tìm kiếm gì hôm nay?</p>
                </div>
              </div>
            ) : msg.sender === "user" ? (
              <div key={msg.id} className="chat-message user-message">
                <div className="message-avatar">
                  <i className="bi bi-person-fill"></i>
                </div>
                <div className="message-text">{msg.text}</div>
              </div>
            ) : (
              <div key={msg.id} className="chat-message bot-message">
                <div className="message-avatar">
                  <i className="bi bi-robot"></i>
                </div>
                <div
                  className="message-text"
                  style={{ whiteSpace: "pre-line" }}
                >
                  {formatBotSegments(msg.text)}
                </div>
              </div>
            )
          )}

          {sending && (
            <div className="chat-message bot-message">
              <div className="message-avatar">
                <i className="bi bi-robot"></i>
              </div>
              <div className="message-text">AI đang trả lời...</div>
            </div>
          )}
        </div>

        <div className="chat-input-area">
          <input
            type="text"
            id="chat-input"
            className="chat-input"
            placeholder="Nhập tin nhắn..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            type="button"
            onClick={handleSendMessage}
            className="chat-send-btn"
          >
            <i className="bi bi-send-fill"></i>
          </button>
        </div>
      </div>
    </>
  );
};
