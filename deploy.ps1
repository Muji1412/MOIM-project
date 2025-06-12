# 1. Gradle 클린 빌드 (캐시 완전 삭제)
./gradlew clean build

# 빌드 성공 여부 확인
if ($?) {
    Write-Host "✅ Gradle 클린 빌드 완료"

    # 2. Docker 이미지 빌드 (노캐시)
    docker build --no-cache -t urditto2/moim-app:latest .

    # 이미지 생성 성공 여부 확인
    if ($?) {
        Write-Host "✅ Docker 노캐시 이미지 생성 완료"

        # 3. Docker Hub에 푸시
        docker push urditto2/moim-app:latest

        # 푸시 성공 여부 확인
        if ($?) {
            Write-Host "🚀 Docker Hub 업로드 완료!"
        }
    }
}
