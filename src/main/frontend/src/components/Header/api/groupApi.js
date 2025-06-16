import axios from "axios";

// 서버 목록 조회
export const fetchGroups = async () =>
    (await axios.get("/api/groups")).data;

// 서버 생성
export const createGroup = async (group) =>
    (await axios.post("/api/groups", group)).data;

// 서버 삭제
export const deleteGroup = async (id) =>
    await axios.delete(`/api/groups/${id}`);

// 서버 수정
export const updateGroup = async (id, group) =>
    (await axios.put(`/api/groups/${id}`, group)).data;
