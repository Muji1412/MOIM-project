    package com.example.moim.service.channel;

    import com.example.moim.entity.Channels;
    import com.example.moim.repository.ChannelRepository;
    import com.example.moim.repository.GroupsRepository;
    import lombok.RequiredArgsConstructor;
    import org.springframework.stereotype.Service;
    import org.springframework.transaction.annotation.Transactional;

    import java.sql.Timestamp;
    import java.util.List;

    @Service
    @RequiredArgsConstructor
    @Transactional
    public class ChannelService {

        private final ChannelRepository channelRepository;
        private final GroupsRepository groupRepository;

        /**
         * 새로운 채널 생성
         * @param groupNo 서버 번호
         * @param channelName 채널 이름
         * @return 생성된 채널 정보
         */
        @Transactional  // 메서드 레벨에도 추가
        public Channels createChannel(Long groupNo, String channelName) {
            System.out.println("=== 채널 생성 시작 ===");
            System.out.println("groupNo: " + groupNo);
            System.out.println("channelName: " + channelName);

            // 그룹 존재 여부 확인 (중요!)
            if (!groupRepository.existsById(groupNo)) {
                throw new RuntimeException("그룹이 존재하지 않습니다: " + groupNo);
            }

            Channels channel = new Channels();
            channel.setGroupNo(groupNo);
            channel.setChanName(channelName);
            channel.setChanIsMulti("Y");
            channel.setChanCreatedAt(new Timestamp(System.currentTimeMillis()));
            channel.setChanLastModified(new Timestamp(System.currentTimeMillis()));

            Channels savedChannel = channelRepository.save(channel);
            System.out.println("저장된 채널: " + savedChannel.getChanNo());

            return savedChannel;
        }

        /**
         * 특정 서버의 모든 채널 조회
         * @param groupNo 서버 번호
         * @return 해당 서버의 채널 목록 (생성 시간 순)
         */
        public List<Channels> getChannelsByGroupNo(Long groupNo) {
            return channelRepository.findByGroupNoOrderByChanCreatedAt(groupNo);
        }

        /**
         * 채널 이름 수정
         */
        public Channels updateChannel(Long chanNo, String newName) {
            Channels channel = channelRepository.findById(chanNo)
                    .orElseThrow(() -> new RuntimeException("채널을 찾을 수 없습니다."));

            channel.setChanName(newName);
            channel.setChanLastModified(new Timestamp(System.currentTimeMillis()));

            return channelRepository.save(channel);
        }

        /**
         * 채널 삭제 (기본 채널 "일반채팅" 보호)
         */
        public void deleteChannel(Long chanNo) {
            Channels channel = channelRepository.findById(chanNo)
                    .orElseThrow(() -> new RuntimeException("채널을 찾을 수 없습니다."));

            // 중요: 기본 채널 "일반채팅"은 삭제 방지
            if ("일반채팅".equals(channel.getChanName())) {
                throw new RuntimeException("기본 채널은 삭제할 수 없습니다.");
            }

            channelRepository.deleteById(chanNo);
        }
    }
