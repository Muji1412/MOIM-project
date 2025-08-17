# 클론떠서 로컬이나 서버에서 돌릴때 따로 필요한 요소들
# 1. 6379번 포트로 레디스, 도커 데스크탑 설치 
```
docker run --name myredis -d -p 6379:6379 redis
```

입력시 설치부터 run까지 자동으로 돌아감. 

# 2. GCP 버킷, vertex AI 활성화된 계정의 credential 파일 => 환경변수로 입력할것
# 3. 리소스 폴더 안에 application.properties 따로 생성해서 아래 값들 입력해서 따로 사용 - PostgreSQL 서버, 오픈비두, SMTP 메일, GCP 프로젝트 아이디 등

resource 파일 
application.properties
```
spring.application.name=MOIM

#server.port=8081
server.port=8089

spring.datasource.url=
spring.datasource.username=
spring.datasource.password=
spring.datasource.driver-class-name=

OPENVIDU_URL=
OPENVIDU_SECRET=



spring.jpa.hibernate.ddl-auto=update
#spring.jpa.show-sql=true
#spring.jpa.properties.hibernate.format_sql=true

#redis
# SSH ??? ?? ????? ?? ?? ??
spring.redis.host=localhost
spring.redis.port=6379
spring.redis.password=1234


#jwt
jwt.expiration_time=86400000
jwt.secret=

#VAPID
vapid.public-key=
vapid.private-key=
vapid.subject=

#SMTP
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=
spring.mail.password=
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true

#GCP
spring.cloud.gcp.storage.bucket=
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB

#Spring AI Vertex AI Gemini Settings
spring.ai.vertex.ai.gemini.project-id=
spring.ai.vertex.ai.gemini.location=us-central1
spring.ai.vertex.ai.gemini.chat.options.model=gemini-2.5-flash
spring.ai.vertex.ai.gemini.chat.options.temperature=0.8

# 비동기 처리 설정
spring.task.execution.pool.core-size=2
spring.task.execution.pool.max-size=5
```
