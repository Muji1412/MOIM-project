import React from 'react';
import VideoCall from "../components/VideoCall";
import Header from "../components/Header/Header";
import ChattingView from "../chatting/ChattingView";
import Section from "../components/Section/Section";

function App() {
  return (
      <div style={{ display: "flex", width: "100vw", height: "100vh" }}>
          {/* 왼쪽: 서버/채널/사이드바 */}
          <Header />
          {/* 중앙: 채팅 */}
          <div style={{ flex: 1, minWidth: 0, background: "#f5f5f7" }}>
              <ChattingView />
          </div>
          {/* 오른쪽: 친구/검색/기타 */}
          <Section />
      </div>
  );
}

export default App;
