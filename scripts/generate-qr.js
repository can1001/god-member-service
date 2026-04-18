const QRCode = require('qrcode')
const path = require('path')
const fs = require('fs')

// QR 코드 생성 설정
const config = {
  // 프로덕션 URL (배포 후 실제 도메인으로 변경)
  url: process.argv[2] || 'https://su-member.example.com/join',

  // 출력 파일명 (옵션)
  outputFileName: process.argv[3] || 'join-qr.png',

  // 출력 경로
  get outputPath() {
    return path.join(__dirname, '../public/images', this.outputFileName)
  },

  // QR 코드 옵션
  options: {
    errorCorrectionLevel: 'H', // 높은 오류 복구율
    type: 'png',
    width: 300,
    margin: 2,
    color: {
      dark: '#1f2937', // 어두운 색 (gray-800)
      light: '#ffffff', // 밝은 색 (흰색)
    },
  },
}

async function generateQRCode() {
  try {
    // 디렉토리 확인
    const dir = path.dirname(config.outputPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // QR 코드 생성
    await QRCode.toFile(config.outputPath, config.url, config.options)

    console.log('✅ QR 코드가 생성되었습니다!')
    console.log(`   URL: ${config.url}`)
    console.log(`   파일: ${config.outputPath}`)

    // 터미널에도 QR 코드 표시
    const terminalQR = await QRCode.toString(config.url, { type: 'terminal', small: true })
    console.log('\n📱 터미널 미리보기:\n')
    console.log(terminalQR)
  } catch (error) {
    console.error('❌ QR 코드 생성 실패:', error.message)
    process.exit(1)
  }
}

generateQRCode()
