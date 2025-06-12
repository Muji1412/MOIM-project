# 1. Gradle 빌드
./gradlew build

# 빌드 성공 여부 확인
if ($?) {
    Write-Host "✅ Gradle 빌드 완료"

    # 2. Docker 이미지 빌드
    docker build -t urditto2/moim-app:latest .

    # 이미지 생성 성공 여부 확인
    if ($?) {
        Write-Host "✅ Docker 이미지 생성 완료"

        # 3. Docker Hub에 푸시
        docker push urditto2/moim-app:latest

        # 푸시 성공 여부 확인
        if ($?) {
            Write-Host "🚀 Docker Hub 업로드 완료!"
        }
    }
}