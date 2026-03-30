import "./message.css";

const Message = ({ text, type, visible }) => {
    if (!visible) return null;

    return (
        <div className={`message ${type} show`}>
            <p>{text}</p>
        </div>
    );
};

export default Message;