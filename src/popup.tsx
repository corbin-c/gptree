export default function Popup() {
  return (
    <div
      style={{
        width: "200px",
        padding: "16px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "13px",
        color: "#ECECF1",
        background: "#212121",
      }}
    >
      <h3 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#10A37F" }}>
        🌳 GPTree
      </h3>
      <p style={{ margin: "0 0 12px 0", lineHeight: 1.4, color: "#8E8EA0" }}>
        View the conversation tree on any ChatGPT chat page.
      </p>
      <p style={{ margin: 0, fontSize: "11px", color: "#6B6B7B" }}>
        Open a conversation at{" "}
        <strong style={{ color: "#ECECF1" }}>chatgpt.com/c/...</strong>{" "}
        and click the <strong style={{ color: "#ECECF1" }}>Tree</strong>{" "}
        button on the right edge.
      </p>
    </div>
  );
}
