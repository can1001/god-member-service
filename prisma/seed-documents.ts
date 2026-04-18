import { config } from 'dotenv'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, DocumentType } from '@prisma/client'

// .env.local 로드
config({ path: '.env.local' })

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined. Make sure .env.local is loaded.')
}

const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ─────────────────────────────────────────────────────────────
// 문서 유형별 파일명 패턴
// ─────────────────────────────────────────────────────────────
const FILE_PATTERNS: Record<DocumentType, string[]> = {
  REGISTRATION_FORM: ['회원가입신청서', '입회신청서', '가입신청서', '정회원신청서', '준회원신청서'],
  GOOGLE_FORM_RESPONSE: ['Google_Form_응답', '온라인신청서_응답', '웹폼_제출', 'Form_Response'],
  WEBSITE_SUBMISSION: ['홈페이지_신청', '웹사이트_제출', '온라인_가입신청', '인터넷_신청서'],
  PAPER_FORM: ['서면신청서', '수기작성_신청서', '종이_신청서', '오프라인_신청서'],
  CONSENT_FORM: [
    '개인정보동의서',
    '정보제공동의서',
    'CMS동의서',
    '개인정보처리동의',
    '제3자제공동의서',
  ],
  ID_COPY: ['신분증_사본', '주민등록증_사본', '운전면허증_사본', '신분증'],
  OTHER: ['기타문서', '추가서류', '보충자료', '참고문서', '증빙서류'],
}

const DESCRIPTIONS: Record<DocumentType, string[]> = {
  REGISTRATION_FORM: [
    '회원 가입 시 제출한 신청서',
    '정회원 가입 신청서',
    '준회원 가입 신청서',
    '신규 회원 등록 서류',
  ],
  GOOGLE_FORM_RESPONSE: ['Google Forms를 통한 온라인 신청', '웹폼 응답 기록', '온라인 설문 응답'],
  WEBSITE_SUBMISSION: ['홈페이지 가입 신청', '웹사이트 통한 가입', '온라인 회원가입 신청서'],
  PAPER_FORM: ['오프라인으로 작성한 신청서', '수기 작성 서류', '종이 신청서 스캔본'],
  CONSENT_FORM: [
    '개인정보 수집 및 이용 동의',
    'CMS 자동이체 동의서',
    '제3자 정보제공 동의',
    '마케팅 수신 동의',
  ],
  ID_COPY: ['본인 확인용 신분증 사본', '신원 확인 서류'],
  OTHER: ['추가 제출 서류', '보충 자료', '기타 증빙 서류'],
}

// MIME 타입 및 확장자
const FILE_TYPES = [
  { mimeType: 'application/pdf', ext: 'pdf', weight: 60 },
  { mimeType: 'image/jpeg', ext: 'jpg', weight: 25 },
  { mimeType: 'image/png', ext: 'png', weight: 10 },
  {
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ext: 'docx',
    weight: 5,
  },
]

// 문서 유형 분포 (가중치)
const DOC_TYPE_WEIGHTS: { type: DocumentType; weight: number }[] = [
  { type: 'REGISTRATION_FORM', weight: 30 },
  { type: 'CONSENT_FORM', weight: 25 },
  { type: 'PAPER_FORM', weight: 15 },
  { type: 'GOOGLE_FORM_RESPONSE', weight: 10 },
  { type: 'WEBSITE_SUBMISSION', weight: 10 },
  { type: 'ID_COPY', weight: 5 },
  { type: 'OTHER', weight: 5 },
]

// 접근 로그 액션 분포
const LOG_ACTIONS = [
  { action: 'DOCUMENT_DOWNLOAD', weight: 40 },
  { action: 'CERTIFICATE_ISSUE', weight: 30 },
  { action: 'MEMBER_VIEW', weight: 20 },
  { action: 'MEMBER_UPDATE', weight: 10 },
]

// User Agent 샘플
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
]

// IP 주소 샘플
const IP_ADDRESSES = [
  '192.168.1.100',
  '192.168.1.101',
  '10.0.0.50',
  '10.0.0.51',
  '172.16.0.10',
  '211.234.56.78',
  '125.178.90.12',
  '58.123.45.67',
  '118.220.15.89',
  '61.74.123.45',
]

// ─────────────────────────────────────────────────────────────
// 유틸리티 함수
// ─────────────────────────────────────────────────────────────
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function weightedRandom<T>(items: { weight: number }[] & T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
  let random = Math.random() * totalWeight
  for (const item of items) {
    random -= item.weight
    if (random <= 0) return item
  }
  return items[items.length - 1]
}

function randomDate(startDate: Date, endDate: Date): Date {
  const start = startDate.getTime()
  const end = endDate.getTime()
  return new Date(start + Math.random() * (end - start))
}

function generateFileName(
  memberId: number,
  docType: DocumentType,
  ext: string,
  timestamp: Date
): string {
  const hash = Math.random().toString(36).substring(2, 10)
  const ts = timestamp.getTime()
  return `${memberId}_${docType}_${ts}_${hash}.${ext}`
}

// ─────────────────────────────────────────────────────────────
// 메인 함수
// ─────────────────────────────────────────────────────────────
async function main() {
  console.log('문서 & 접근 로그 Mock Data 생성 시작...')

  // 기존 데이터 삭제
  await prisma.memberDocument.deleteMany()
  await prisma.accessLog.deleteMany()
  console.log('기존 문서/로그 데이터 삭제 완료')

  // 기존 회원 조회
  const members = await prisma.member.findMany({
    select: { id: true, name: true },
  })

  if (members.length === 0) {
    console.error('회원 데이터가 없습니다. 먼저 seed.ts를 실행해주세요.')
    return
  }
  console.log(`기존 회원 ${members.length}명 조회 완료`)

  // ─────────────────────────────────────────────────────────
  // MemberDocument 100건 생성
  // ─────────────────────────────────────────────────────────
  const documents: {
    memberId: number
    documentType: DocumentType
    originalName: string
    fileName: string
    filePath: string
    fileSize: number
    mimeType: string
    description: string | null
    uploadedAt: Date
  }[] = []

  const startDate = new Date('2024-01-01')
  const endDate = new Date('2025-03-15')

  for (let i = 0; i < 100; i++) {
    const member = randomElement(members)
    const docTypeItem = weightedRandom(DOC_TYPE_WEIGHTS)
    const docType = docTypeItem.type
    const fileTypeItem = weightedRandom(FILE_TYPES)

    const uploadedAt = randomDate(startDate, endDate)
    const baseName = randomElement(FILE_PATTERNS[docType])
    const originalName = `${baseName}_${member.name}.${fileTypeItem.ext}`
    const fileName = generateFileName(member.id, docType, fileTypeItem.ext, uploadedAt)
    const filePath = `uploads/documents/${fileName}`
    const fileSize = randomInt(50000, 5000000) // 50KB ~ 5MB
    const description = Math.random() < 0.7 ? randomElement(DESCRIPTIONS[docType]) : null

    documents.push({
      memberId: member.id,
      documentType: docType,
      originalName,
      fileName,
      filePath,
      fileSize,
      mimeType: fileTypeItem.mimeType,
      description,
      uploadedAt,
    })
  }

  // 날짜순 정렬
  documents.sort((a, b) => a.uploadedAt.getTime() - b.uploadedAt.getTime())

  // DB에 저장
  for (const doc of documents) {
    await prisma.memberDocument.create({ data: doc })
  }

  // 문서 통계
  const docStats = {
    total: documents.length,
    byType: DOC_TYPE_WEIGHTS.map((t) => ({
      type: t.type,
      count: documents.filter((d) => d.documentType === t.type).length,
    })),
  }

  console.log('\n문서 Mock Data 생성 완료!')
  console.log('─────────────────────────────────────────')
  console.log(`총 ${docStats.total}건 생성`)
  console.log('\n문서 유형별:')
  for (const stat of docStats.byType) {
    console.log(`  - ${stat.type}: ${stat.count}건`)
  }

  // ─────────────────────────────────────────────────────────
  // AccessLog 100건 생성
  // ─────────────────────────────────────────────────────────
  const accessLogs: {
    action: string
    resource: string | null
    userId: string | null
    userAgent: string | null
    ipAddress: string
    timestamp: Date
    successful: boolean
    details: object | null
  }[] = []

  for (let i = 0; i < 100; i++) {
    const actionItem = weightedRandom(LOG_ACTIONS)
    const action = actionItem.action
    const timestamp = randomDate(startDate, endDate)
    const ipAddress = randomElement(IP_ADDRESSES)
    const userAgent = randomElement(USER_AGENTS)
    const successful = Math.random() < 0.95 // 95% 성공

    let resource: string | null = null
    let details: object | null = null

    if (action === 'DOCUMENT_DOWNLOAD') {
      const doc = randomElement(documents)
      resource = `document:${doc.memberId}`
      details = {
        documentType: doc.documentType,
        fileName: doc.originalName,
        fileSize: doc.fileSize,
      }
    } else if (action === 'CERTIFICATE_ISSUE') {
      const member = randomElement(members)
      const certType = Math.random() < 0.5 ? 'fee-receipt' : 'donation-receipt'
      resource = `certificate:${certType}:${member.id}`
      details = {
        certificateType: certType,
        memberName: member.name,
      }
    } else if (action === 'MEMBER_VIEW' || action === 'MEMBER_UPDATE') {
      const member = randomElement(members)
      resource = `member:${member.id}`
      details = {
        memberName: member.name,
        action: action === 'MEMBER_VIEW' ? '조회' : '수정',
      }
    }

    accessLogs.push({
      action,
      resource,
      userId: ipAddress, // MVP에서는 IP를 userId로 사용
      userAgent,
      ipAddress,
      timestamp,
      successful,
      details,
    })
  }

  // 날짜순 정렬
  accessLogs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

  // DB에 저장
  for (const log of accessLogs) {
    await prisma.accessLog.create({ data: log })
  }

  // 로그 통계
  const logStats = {
    total: accessLogs.length,
    byAction: LOG_ACTIONS.map((a) => ({
      action: a.action,
      count: accessLogs.filter((l) => l.action === a.action).length,
    })),
    successRate: (accessLogs.filter((l) => l.successful).length / accessLogs.length) * 100,
  }

  console.log('\n접근 로그 Mock Data 생성 완료!')
  console.log('─────────────────────────────────────────')
  console.log(`총 ${logStats.total}건 생성`)
  console.log(`성공률: ${logStats.successRate.toFixed(1)}%`)
  console.log('\n액션별:')
  for (const stat of logStats.byAction) {
    console.log(`  - ${stat.action}: ${stat.count}건`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
