import { useRef, useState } from "react";
import styles from "./Header.module.css";
import modalStyles from "./Modal.module.css";

export default function Header() {
  // 서버 및 선택 상태
  const [servers, setServers] = useState([]);
  const [selectedServerId, setSelectedServerId] = useState("default");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newServer, setNewServer] = useState({ name: "", image: "" });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const inputRef = useRef();
  const serverNameInputRef = useRef();

  //아코디언 area
  const [openChat, setOpenChat] = useState(true);
  const [openVoice, setOpenVoice] = useState(true);

  // menuType과 선택 서버 객체 구하기
  const isFriendMenu = selectedServerId === "default";
  const selectedServer = servers.find((s) => s.id === selectedServerId);
  const selectedServerName = selectedServer ? selectedServer.name : "";

  // 파일 선택 핸들러
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setNewServer((prev) => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // 업로드 영역 클릭
  const handleUploadAreaClick = () => {
    inputRef.current.click();
  };

  // 서버 클릭
  const handleServerClick = (serverId) => {
    setSelectedServerId(serverId);
  };

  // 모달 오픈/닫기
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setNewServer({ name: "", image: "" });
    setImageFile(null);
    setImagePreview("");
  };

  // 서버 추가
  const handleAddServer = (e) => {
    e.preventDefault();
    if (!newServer.name.trim()) return;
    setServers((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: newServer.name,
        // image: newServer.image || "/img/default_server.png",
        image: newServer.image || "",
      },
    ]);
    closeModal();
  };

  return (
    <div className={styles.wrap}>
      {/* 상단 헤더 */}
      <header className={styles.header}>
        <div className={styles.hr_box}>
          <img src="/img/friend_ic_white.png" alt="friend_tab" />
          <p>Friend</p>
        </div>
      </header>
      {/* 서버/사이드 메뉴 영역 */}
      <aside className={styles.aside}>
        <div className={styles.aside_container}>
          <div className={styles.aside_box}>
            {/* server_list */}
            <div className={styles.server_list}>
              <div className={styles.server_box}>
                {/* 기본 서버(홈) */}
                <div
                  className={`${styles.list_item} ${styles.default_server} 
                  ${styles.add_server}   ${
                    selectedServerId === "default" ? styles.selected : ""
                  }`}
                  onClick={() => handleServerClick("default")}
                  title="Home"
                >
                  <div
                    className={`${styles.fill} ${
                      selectedServerId === "default" ? styles.active_fill : ""
                    }`}
                  ></div>
                  <div
                    className={`${styles.server_ic} ${styles.home_ic} ${
                      selectedServerId === "default" ? styles.active_ic : ""
                    }`}
                  >
                    <img
                      src="/img/home_ic.png"
                      alt="Home"
                      className={
                        selectedServerId === "default" ? styles.active_ic : ""
                      }
                    />
                  </div>
                </div>
                <div className={styles.line}></div>
                {/* 사용자 서버 리스트 */}
                {servers.map((server) => (
                  <div
                    key={server.id}
                    className={`${styles.list_item} ${
                      selectedServerId === server.id ? styles.selected : ""
                    }`}
                    onClick={() => handleServerClick(server.id)}
                    title={server.name}
                  >
                    <div
                      className={`${styles.fill} ${
                        selectedServerId === server.id ? styles.active_fill : ""
                      }`}
                    ></div>
                    <div
                      className={`${styles.server_ic} ${
                        selectedServerId === server.id ? styles.active_ic : ""
                      }`}
                      style={{
                        background: !server.image
                          ? selectedServerId === server.id
                            ? "#c3ee41"
                            : "#d9d9d9"
                          : "transparent",
                        overflow: "hidden",
                      }}
                    >
                      {server.image && (
                        <img
                          src={server.image}
                          alt={server.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      )}
                    </div>
                  </div>
                ))}
                {/* 서버 추가 버튼 */}
                <div
                  className={`${styles.list_item} ${styles.add_server}`}
                  onClick={openModal}
                  title="서버 추가"
                >
                  <div className={styles.server_ic}>
                    <img src="/img/add_server_ic.png" alt="add_server" />
                  </div>
                </div>
              </div>
            </div>
            {/* server_menu */}
            <div className={styles.server_menu}>
              <div className={styles.server_menu_top}>
                {isFriendMenu ? (
                  <button className={styles.default_menu_btn}>
                    Search or Start Talk
                  </button>
                ) : (
                  <div className={styles.change_shild}>
                    <p className={styles.server_name}>{selectedServerName}</p>
                  </div>
                )}
              </div>

              <div className={styles.server_menu_list}>
                {isFriendMenu ? (
                  <div className={styles.menu_box}>
                    <div className={styles.menu_item}>
                      <img src="/img/friend_ic.png" alt="friend_ic" />
                      <p>Friend</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.menu_box}>
                      <div className={styles.menu_item}>
                        <img src="/img/cal_ic.png" alt="cal_ic" />
                        <p>Calendar</p>
                      </div>
                    </div>
                    <div className={styles.menu_box}>
                      <div className={styles.menu_item}>
                        <img src="/img/todo_ic.png" alt="cal_ic" />
                        <p>Todo List</p>
                      </div>
                    </div>
                    <div className={styles.menu_box}>
                      <div className={styles.menu_item}>
                        <img src="/img/board_ic.png" alt="cal_ic" />
                        <p>White Board</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className={styles.server_menu_con}>
                <div className={styles.menu_con_container}>
                  {isFriendMenu ? (
                    // 친구 컨텐츠
                    <>
                      <div className={styles.menu_con_title}>
                        <p>Direct Message</p>
                        <img src="/img/add_plus_ic.png" alt="add_something" />
                      </div>
                      <div className={styles.server_menu_user_area}>
                        <div className={styles.menu_user_box}>
                          <div className={styles.menu_user_list}>
                            <img src="#" alt="#" />
                            <p>User</p>
                          </div>
                        </div>
                        <div className={styles.menu_user_box}>
                          <div className={styles.menu_user_list}>
                            <img src="#" alt="#" />
                            <p>User</p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    // 서버별 컨텐츠
                    <>
                      <div className="acodion_box">
                        <div
                          className={styles.aco_con_title}
                          style={{
                            background: openChat ? "" : "transparent",
                            transition: "background 0.2s",
                          }}
                        >
                          <div
                            className={styles.chat_box}
                            onClick={() => setOpenChat((prev) => !prev)}
                            style={{
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <p
                              
                            >
                              chat
                            </p>
                            <img
                              src="/img/arrow_ic.png"
                              alt="arrow_ic"
                              style={{
                                marginRight: 8,
                                transform: openChat
                                  ? "rotate(0deg)"
                                  : "rotate(-90deg)",
                                transition: "transform 0.2s",
                              }}
                            />
                          </div>
                          <img
                            src="/img/add_plus_ic.png"
                            alt="add_ic"
                            style={{ cursor: "pointer" }}
                          />
                        </div>

                        {/* 아코디언 내용 */}
                        <div
                          className={styles.channel_list}
                          style={{
                            maxHeight: openChat ? "500px" : "0",
                          }}
                        >
                          {openChat && (
                            <ul
                              style={{
                                listStyle: "none",
                                margin: 0,
                                padding: 0,
                              }}
                            >
                              <li className={styles.channel_item}>
                                <div className={styles.channel_item_box}>
                                  <img src="/img/chat_hash_ic.png" alt="chat" />
                                  <span>
                                    일반채팅
                                  </span>
                                </div>
                              </li>
                            </ul>
                          )}
                        </div>
                      </div>

                      <div className="acodion_box">
                        <div
                          className={styles.aco_con_title}
                          style={{
                            background: openVoice ? "" : "transparent",
                            transition: "background 0.2s",
                          }}
                        >
                          <div
                            className={styles.chat_box}
                            onClick={() => setOpenVoice((prev) => !prev)}
                          >
                            <p>chat</p>
                            <img
                              src="/img/arrow_ic.png"
                              alt="arrow_ic"
                              style={{
                                marginRight: 8,
                                transform: openVoice
                                  ? "rotate(0deg)"
                                  : "rotate(-90deg)",
                                transition: "transform 0.2s",
                              }}
                            />
                          </div>
                        </div>

                        {/* 아코디언 내용 */}
                        <div
                          className={styles.channel_list}
                          style={{
                            maxHeight: openVoice ? "500px" : "0",
                          }}
                        >
                          {openVoice && (
                            <ul
                              style={{
                                listStyle: "none",
                                margin: 0,
                                padding: 0,
                              }}
                            >
                              <li className={styles.channel_item}>
                                <div className={styles.channel_item_box}>
                                  <img src="/img/voice_ic.png" alt="voice" />
                                  <span>
                                    음성채팅
                                  </span>
                                </div>
                              </li>
                            </ul>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* aside_user_box (유저 미니 프로필) */}
          <div className={styles.aside_user_box}>
            <div className={styles.user_box_area}>
              <div className={styles.user_lbox}>
                <img src="#" alt="#" />
                <div className={styles.mini_l_box}>
                  <strong>User</strong>
                  <span>UserId</span>
                </div>
              </div>
              <div className={styles.user_rbox}>
                <img src="/img/close_mic.png" alt="mic" />
                <img src="/img/open_head.png" alt="head" />
                <img src="/img/setting_ic.png" alt="set" />
              </div>
            </div>
          </div>
        </div>
      </aside>
      {/* 서버 추가 모달 */}
      {isModalOpen && (
        <div
          className={modalStyles.modalOverlay}
          onClick={closeModal}
          tabIndex={-1}
          aria-modal="true"
          role="dialog"
        >
          <div
            className={modalStyles.modal_box}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={modalStyles.modal_title_area}>
              <span className={modalStyles.modal_title}>Create New Team</span>
              <p>Let's pioneer Teams with new people!</p>
              <button
                className={modalStyles.close_btn}
                onClick={closeModal}
                aria-label="Close"
                type="button"
              >
                <img src="/img/close_ic.png" alt="close_ic" />
              </button>
            </div>
            <form onSubmit={handleAddServer} className={modalStyles.modal_form}>
              {/* upload_area */}
              <div className={modalStyles.modal_upload_area}>
                <label className={modalStyles.upload_label}>
                  <img
                    src={imagePreview ? imagePreview : "/img/upload_ic.png"}
                    alt="upload_icon"
                    className={modalStyles.upload_img}
                    // onClick={handleUploadAreaClick}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    ref={inputRef}
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              {/* input_area */}
              <div className={modalStyles.modal_input_area}>
                <label
                  className={modalStyles.modal_title_label}
                  htmlFor="serverName"
                >
                  Server Name
                </label>
                <div className={modalStyles.modal_input_box}>
                  <input
                    id="serverName"
                    type="text"
                    className={modalStyles.modal_input}
                    placeholder="Server Name"
                    value={newServer.name}
                    onChange={(e) =>
                      setNewServer({ ...newServer, name: e.target.value })
                    }
                    required
                    ref={serverNameInputRef}
                  />
                </div>
                <span className={modalStyles.guide}>
                  You can modify the server name later!
                </span>
              </div>
              <div className={modalStyles.modal_btn_area}>
                <div className={modalStyles.buttonRow}>
                  <button
                    type="button"
                    className={modalStyles.backBtn}
                    onClick={closeModal}
                  >
                    Back
                  </button>
                  <button type="submit" className={modalStyles.createBtn}>
                    Create
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
