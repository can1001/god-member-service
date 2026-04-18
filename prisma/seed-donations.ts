import { config } from 'dotenv'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, DonorType, DonationPurpose } from '@prisma/client'

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
// 이름 데이터
// ─────────────────────────────────────────────────────────────
const SURNAMES = [
  '김',
  '이',
  '박',
  '최',
  '정',
  '강',
  '조',
  '윤',
  '장',
  '임',
  '한',
  '오',
  '서',
  '신',
  '권',
  '황',
  '안',
  '송',
  '류',
  '홍',
]

const FIRST_NAMES = [
  '성서',
  '유니',
  '온누리',
  '말씀',
  '복음',
  '은혜',
  '빛나',
  '새롬',
  '다윗',
  '요셉',
  '사무엘',
  '모세',
  '기쁨',
  '소망',
  '사랑',
  '믿음',
  '평화',
  '하늘',
  '별',
  '해',
  '달',
  '샘',
  '강',
  '산',
  '들',
  '꽃',
  '나무',
  '바다',
  '하람',
  '시온',
  '예람',
  '아람',
  '지혜',
  '슬기',
  '현우',
  '준혁',
  '민서',
  '서연',
  '지민',
  '하준',
]

const COMPANY_NAMES = [
  '(주)은혜기업',
  '(주)사랑나눔',
  '복음상사',
  '빛과소금(주)',
  '새생명교육',
  '하늘문화재단',
  '(주)믿음건설',
  '소망복지재단',
  '(주)평화무역',
  '기쁨농장',
  '(주)성서출판',
  '다윗테크',
  '요셉물류(주)',
  '(주)모세엔지니어링',
  '사무엘미디어',
]

const NOTES = [
  '익명 후원',
  '감사헌금',
  '특별 후원',
  '청소년 사역 지원',
  '선교 후원',
  '장학금 후원',
  '캠프 후원',
  '출판 사역 지원',
  '해외 선교 지원',
  '국내 선교 지원',
  '운영비 지원',
  '시설 개선 후원',
  '교육 사업 후원',
  '복지 사업 지원',
  null, // 메모 없음
  null,
  null,
  null,
  null,
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

function randomAmount(min: number, max: number): number {
  // 10,000원 단위로 반올림
  const amount = randomInt(min, max)
  return Math.round(amount / 10000) * 10000
}

function randomDate(year: number, month: number): Date {
  const daysInMonth = new Date(year, month, 0).getDate()
  const day = randomInt(1, daysInMonth)
  return new Date(year, month - 1, day)
}

function randomName(): string {
  return randomElement(SURNAMES) + randomElement(FIRST_NAMES)
}

// ─────────────────────────────────────────────────────────────
// 메인 함수
// ─────────────────────────────────────────────────────────────
async function main() {
  console.log('후원금 Mock Data 생성 시작...')

  // 기존 후원금 삭제
  await prisma.donation.deleteMany()
  console.log('기존 후원금 데이터 삭제 완료')

  // 기존 회원 조회 (MEMBER 타입 연결용)
  const members = await prisma.member.findMany({
    select: { id: true, name: true },
  })
  console.log(`기존 회원 ${members.length}명 조회 완료`)

  // 월별 영수증 번호 카운터
  const receiptCounters: Record<string, number> = {}

  function generateReceiptNo(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const key = `${year}${month}`

    if (!receiptCounters[key]) {
      receiptCounters[key] = 0
    }
    receiptCounters[key]++

    const seq = String(receiptCounters[key]).padStart(4, '0')
    return `DON-${year}${month}-${seq}`
  }

  // 후원 데이터 생성
  const donations: {
    receiptNo: string
    donorName: string
    donorType: DonorType
    amount: number
    date: Date
    purpose: DonationPurpose
    note: string | null
    memberId: number | null
  }[] = []

  // 2024년 1월 ~ 2025년 3월 (15개월)
  const periods: { year: number; month: number }[] = []
  for (let month = 1; month <= 12; month++) {
    periods.push({ year: 2024, month })
  }
  for (let month = 1; month <= 3; month++) {
    periods.push({ year: 2025, month })
  }

  let donationCount = 0
  const targetCount = 100

  // 월별로 분배 (약 6~7건씩)
  for (const period of periods) {
    const periodIndex = periods.indexOf(period)
    const remainingPeriods = periods.length - periodIndex
    const remainingDonations = targetCount - donationCount
    const avgPerPeriod = Math.ceil(remainingDonations / remainingPeriods)

    // 마지막 달에는 남은 건수 모두 생성
    const countThisMonth =
      periodIndex === periods.length - 1
        ? remainingDonations
        : Math.min(randomInt(Math.max(1, avgPerPeriod - 1), avgPerPeriod + 2), remainingDonations)

    for (let i = 0; i < countThisMonth; i++) {
      const date = randomDate(period.year, period.month)

      // 후원자 유형 결정 (40% MEMBER, 45% INDIVIDUAL, 15% CORPORATE)
      const typeRoll = Math.random()
      let donorType: DonorType
      let donorName: string
      let memberId: number | null = null

      if (typeRoll < 0.4 && members.length > 0) {
        // MEMBER (40%)
        donorType = 'MEMBER'
        const member = randomElement(members)
        donorName = member.name
        memberId = member.id
      } else if (typeRoll < 0.85) {
        // INDIVIDUAL (45%)
        donorType = 'INDIVIDUAL'
        donorName = randomName()
      } else {
        // CORPORATE (15%)
        donorType = 'CORPORATE'
        donorName = randomElement(COMPANY_NAMES)
      }

      // 금액 결정
      let amount: number
      if (donorType === 'CORPORATE') {
        amount = randomAmount(100000, 5000000)
      } else if (donorType === 'INDIVIDUAL') {
        amount = randomAmount(10000, 1000000)
      } else {
        amount = randomAmount(10000, 500000)
      }

      // 후원 목적 결정 (35% GENERAL, 20% SCHOLARSHIP, 15% 나머지)
      const purposeRoll = Math.random()
      let purpose: DonationPurpose
      if (purposeRoll < 0.35) {
        purpose = 'GENERAL'
      } else if (purposeRoll < 0.55) {
        purpose = 'SCHOLARSHIP'
      } else if (purposeRoll < 0.7) {
        purpose = 'OPERATION'
      } else if (purposeRoll < 0.85) {
        purpose = 'WELFARE'
      } else {
        purpose = 'PROGRAM'
      }

      // 메모 (30% 확률로 추가)
      const note = Math.random() < 0.3 ? randomElement(NOTES.filter((n) => n !== null)) : null

      donations.push({
        receiptNo: generateReceiptNo(date),
        donorName,
        donorType,
        amount,
        date,
        purpose,
        note,
        memberId,
      })

      donationCount++
      if (donationCount >= targetCount) break
    }

    if (donationCount >= targetCount) break
  }

  // 날짜순 정렬
  donations.sort((a, b) => a.date.getTime() - b.date.getTime())

  // 영수증 번호 재생성 (날짜순으로)
  const sortedReceiptCounters: Record<string, number> = {}
  for (const donation of donations) {
    const year = donation.date.getFullYear()
    const month = String(donation.date.getMonth() + 1).padStart(2, '0')
    const key = `${year}${month}`

    if (!sortedReceiptCounters[key]) {
      sortedReceiptCounters[key] = 0
    }
    sortedReceiptCounters[key]++

    const seq = String(sortedReceiptCounters[key]).padStart(4, '0')
    donation.receiptNo = `DON-${year}${month}-${seq}`
  }

  // DB에 저장
  for (const donation of donations) {
    await prisma.donation.create({
      data: donation,
    })
  }

  // 통계 출력
  const stats = {
    total: donations.length,
    byType: {
      MEMBER: donations.filter((d) => d.donorType === 'MEMBER').length,
      INDIVIDUAL: donations.filter((d) => d.donorType === 'INDIVIDUAL').length,
      CORPORATE: donations.filter((d) => d.donorType === 'CORPORATE').length,
    },
    byPurpose: {
      GENERAL: donations.filter((d) => d.purpose === 'GENERAL').length,
      SCHOLARSHIP: donations.filter((d) => d.purpose === 'SCHOLARSHIP').length,
      OPERATION: donations.filter((d) => d.purpose === 'OPERATION').length,
      WELFARE: donations.filter((d) => d.purpose === 'WELFARE').length,
      PROGRAM: donations.filter((d) => d.purpose === 'PROGRAM').length,
    },
    totalAmount: donations.reduce((sum, d) => sum + d.amount, 0),
  }

  console.log('\n후원금 Mock Data 생성 완료!')
  console.log('─────────────────────────────────────────')
  console.log(`총 ${stats.total}건 생성`)
  console.log(`총 금액: ${stats.totalAmount.toLocaleString()}원`)
  console.log('\n후원자 유형별:')
  console.log(`  - 회원(MEMBER): ${stats.byType.MEMBER}건`)
  console.log(`  - 개인(INDIVIDUAL): ${stats.byType.INDIVIDUAL}건`)
  console.log(`  - 기업(CORPORATE): ${stats.byType.CORPORATE}건`)
  console.log('\n후원 목적별:')
  console.log(`  - 일반(GENERAL): ${stats.byPurpose.GENERAL}건`)
  console.log(`  - 장학(SCHOLARSHIP): ${stats.byPurpose.SCHOLARSHIP}건`)
  console.log(`  - 운영(OPERATION): ${stats.byPurpose.OPERATION}건`)
  console.log(`  - 복지(WELFARE): ${stats.byPurpose.WELFARE}건`)
  console.log(`  - 프로그램(PROGRAM): ${stats.byPurpose.PROGRAM}건`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
