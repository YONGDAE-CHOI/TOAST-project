# TOAST-project

1. dev디렉토리 내에 TOAST-project폴더 생성
2. TOAST-project 내부에 network폴더 생성

체인코드 'artwork'
  -> go언어를 사용해 toast.go 작성
  이후 go build 컴파일을 통해 디버깅

네트워크 시작&채널 생성 - TOAST내 네트워크폴더에서 시작
  1. ./network.sh up createChannel -ca => 네트워크 업/채널 생성
  2. ./network.sh deployCC -ccn artwork -ccp /TOAST-project/contract/toast -ccv 1.0 -ccl go => 체인코드 배포
  
config에 있는 connection.org1.json을 지우고 새로운것 복사해서 가져오기
javascript내에서 AppUtils, CAUtils 수정
 
main.js작성
  1. app.get과 app.post 수정
  2. 외부라이브러리 app.use 등록
  
HTML작성 (application내 public폴더 안에 생성)
  1. Index.html 
  2. marble-create2 = 작품 등록하기
  3. marble-read = 작품 조회하기
  4. marble-transfer = 작품 구매하기(경매참여)
  5. marble-history = 경매 이력 조회하기
  6. user-create = 사용자 등록하기(인증서 생성)
  
라우팅 작성
  
블록체인 지갑연동
  
node main.js
  express서버 3000번에서 시작



