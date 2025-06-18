import {useState} from "react";

export default function MyModal({ onClose, slotInfo, onSave }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [type, setType] = useState('');
    const [isDone, setIsDone] = useState('');
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            title,
            start: slotInfo.start,
            end: slotInfo.end,
        });
    };
    return (
        <div className="modal-background">
            <div className="modal-content">
                <h2 className="head-title">Create an event</h2>
                <form onSubmit={handleSubmit}>
                    <label className="label">Title <input value={title} onChange={e => setTitle(e.target.value)} /></label>
                    <label className="label">Content <input value={content} onChange={e => setContent(e.target.value)} /></label>
                    <label className="label">Event Type <input type='select'
                        value={type} onChange={e => setType(e.target.value)} /></label>
                    <label className="label">Progress <input type='radio'
                        value={isDone} onChange={e => setIsDone(e.target.value)} /></label>
                    <button type="submit" className="modal-btn">Save</button>
                    <button type="button" className="modal-btn-close" onClick={onClose}>Close</button>
                </form>
            </div>
        </div>
    );
}
