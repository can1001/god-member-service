import { config } from 'dotenv'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, MemberType, FeeType, PaymentMethod, Gender } from '@prisma/client'

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
// 상수 및 설정
// ─────────────────────────────────────────────────────────────
const TOTAL_MEMBERS = 2000
const BATCH_SIZE = 100

// 회원 유형 분포
const MEMBER_TYPE_DISTRIBUTION = {
  REGULAR: 0.5, // 50% = 1000명
  ASSOCIATE: 0.25, // 25% = 500명
  YOUTH: 0.1, // 10% = 200명
  DONOR: 0.15, // 15% = 300명
}

// 회비 유형 분포 (YOUTH/DONOR 제외)
const FEE_TYPE_DISTRIBUTION = {
  MONTHLY: 0.6, // 60%
  ANNUAL: 0.3, // 30%
  LIFETIME: 0.1, // 10%
}

// 결제 수단 분포 (CMS 제외)
const PAYMENT_METHOD_DISTRIBUTION = {
  DIRECT_TRANSFER: 0.4, // 40%
  CARD: 0.25, // 25%
  KAKAO_PAY: 0.2, // 20%
  NAVER_PAY: 0.1, // 10%
  TOSS_PAY: 0.05, // 5%
}

// ─────────────────────────────────────────────────────────────
// 이름 데이터 (seed-donations.ts에서 재사용)
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

const ADDRESSES = [
  '서울특별시 강남구 테헤란로',
  '서울특별시 서초구 반포대로',
  '서울특별시 송파구 올림픽로',
  '서울특별시 마포구 월드컵로',
  '서울특별시 영등포구 여의대로',
  '경기도 성남시 분당구 정자동',
  '경기도 수원시 영통구 광교로',
  '경기도 고양시 일산동구 중앙로',
  '인천광역시 연수구 송도동',
  '부산광역시 해운대구 우동',
  '대구광역시 수성구 달구벌대로',
  '대전광역시 유성구 봉명동',
  '광주광역시 서구 상무대로',
  '울산광역시 남구 삼산로',
  '제주특별자치도 제주시 연동',
]

const CHURCHES = [
  '서울중앙교회',
  '반포교회',
  '분당우리교회',
  '송도교회',
  '해운대교회',
  '대전교회',
  '광주교회',
  '수원중앙교회',
  '일산교회',
  '수성교회',
  '강남교회',
  '여의도순복음교회',
  '사랑의교회',
  '온누리교회',
  '새문안교회',
  '영락교회',
  '소망교회',
  '명성교회',
  '충신교회',
  '광림교회',
  null,
  null,
  null, // 일부 회원은 교회 없음
]

const POSITIONS = [
  '집사',
  '권사',
  '장로',
  '목사',
  '전도사',
  '선교사',
  '청년',
  '학생',
  '교사',
  '성가대원',
  '구역장',
  null,
  null,
  null,
  null, // 일부 회원은 직분 없음
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

function randomPhone(): string {
  return `010-${String(randomInt(1000, 9999))}-${String(randomInt(1000, 9999))}`
}

function randomName(): string {
  return randomElement(SURNAMES) + randomElement(FIRST_NAMES)
}

function randomAddress(): string {
  return `${randomElement(ADDRESSES)} ${randomInt(1, 999)}`
}

/**
 * 회원 유형에 맞는 생년월일 생성
 * YOUTH: 만 13~18세 (2008~2013년생)
 * REGULAR/ASSOCIATE: 만 19세 이상 (1945~2007년생)
 * DONOR: 제한 없음 (1945~2013년생)
 */
function randomBirthDate(memberType: MemberType): Date {
  const currentYear = new Date().getFullYear()
  let birthYear: number

  if (memberType === 'YOUTH') {
    // 만 13~18세: 현재년도 - 18 ~ 현재년도 - 13
    birthYear = randomInt(currentYear - 18, currentYear - 13)
  } else if (memberType === 'DONOR') {
    // 제한 없음: 1945~현재년도-13
    birthYear = randomInt(1945, currentYear - 13)
  } else {
    // REGULAR/ASSOCIATE: 만 19세 이상
    birthYear = randomInt(1945, currentYear - 19)
  }

  const month = randomInt(1, 12)
  const day = randomInt(1, 28) // 안전하게 28일까지
  return new Date(birthYear, month - 1, day)
}

/**
 * 가입일 생성 (2020년 ~ 현재)
 */
function randomJoinDate(): Date {
  const currentYear = new Date().getFullYear()
  const year = randomInt(2020, currentYear)
  const month = year === currentYear ? randomInt(1, new Date().getMonth() + 1) : randomInt(1, 12)
  const day = randomInt(1, 28)
  return new Date(year, month - 1, day)
}

/**
 * 가중치 기반 랜덤 선택
 */
function weightedRandom<T extends string>(distribution: Record<T, number>): T {
  const random = Math.random()
  let cumulative = 0

  for (const [key, weight] of Object.entries(distribution) as [T, number][]) {
    cumulative += weight
    if (random < cumulative) {
      return key
    }
  }

  // 마지막 키 반환 (부동소수점 오차 대비)
  return Object.keys(distribution).pop() as T
}

// ─────────────────────────────────────────────────────────────
// 회비 레코드 생성 함수
// ─────────────────────────────────────────────────────────────
async function createFeesForMember(
  memberId: number,
  feeType: FeeType,
  memberType: MemberType,
  joinDate: Date,
  paymentMethod: PaymentMethod
) {
  // YOUTH, DONOR는 회비 없음
  if (memberType === 'YOUTH' || memberType === 'DONOR') {
    return
  }

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const joinYear = joinDate.getFullYear()
  const joinMonth = joinDate.getMonth() + 1

  const feeAmount = feeType === 'MONTHLY' ? 10000 : feeType === 'ANNUAL' ? 120000 : 1000000

  if (feeType === 'MONTHLY') {
    // 가입 월 ~ 현재 월까지 회비 레코드 생성
    for (let year = joinYear; year <= currentYear; year++) {
      const startMonth = year === joinYear ? joinMonth : 1
      const endMonth = year === currentYear ? currentMonth : 12

      for (let month = startMonth; month <= endMonth; month++) {
        // 랜덤하게 일부는 납부, 일부는 미납
        const isPaid = Math.random() < 0.7 // 70% 납부율

        await prisma.memberFee.create({
          data: {
            memberId,
            year,
            month,
            feeType: 'MONTHLY',
            amount: feeAmount,
            status: isPaid ? 'PAID' : 'UNPAID',
            paymentMethod: isPaid ? paymentMethod : null,
            paidDate: isPaid ? new Date(year, month - 1, randomInt(1, 28)) : null,
          },
        })
      }
    }
  } else if (feeType === 'ANNUAL') {
    // 가입 연도 ~ 현재 연도까지 연납 레코드 생성
    for (let year = joinYear; year <= currentYear; year++) {
      const isPaid = Math.random() < 0.7

      await prisma.memberFee.create({
        data: {
          memberId,
          year,
          month: null,
          feeType: 'ANNUAL',
          amount: feeAmount,
          status: isPaid ? 'PAID' : 'UNPAID',
          paymentMethod: isPaid ? paymentMethod : null,
          paidDate: isPaid ? new Date(year, randomInt(0, 11), randomInt(1, 28)) : null,
        },
      })
    }
  } else if (feeType === 'LIFETIME') {
    // 평생회비 1건
    const isPaid = Math.random() < 0.8 // 80% 납부율

    await prisma.memberFee.create({
      data: {
        memberId,
        year: joinYear,
        month: null,
        feeType: 'LIFETIME',
        amount: feeAmount,
        status: isPaid ? 'PAID' : 'UNPAID',
        paymentMethod: isPaid ? paymentMethod : null,
        paidDate: isPaid ? joinDate : null,
      },
    })
  }
}

// ─────────────────────────────────────────────────────────────
// 메인 함수
// ─────────────────────────────────────────────────────────────
async function main() {
  const withFees = process.argv.includes('--with-fees')

  console.log('테스트 회원 2000명 생성 시작...')
  console.log(`회비 레코드 생성: ${withFees ? 'YES' : 'NO'}`)
  console.log('─────────────────────────────────────────')

  // 기존 테스트 회원 삭제 (test0001@god.or.kr ~ test9999@god.or.kr)
  const deleteResult = await prisma.member.deleteMany({
    where: {
      email: {
        startsWith: 'test',
        endsWith: '@god.or.kr',
        not: 'test@god.or.kr', // 기존 test@god.or.kr은 유지
      },
    },
  })
  console.log(`기존 테스트 회원 ${deleteResult.count}명 삭제 완료`)

  // 회원 데이터 생성
  const stats = {
    total: 0,
    byType: { REGULAR: 0, ASSOCIATE: 0, YOUTH: 0, DONOR: 0 },
    byFeeType: { MONTHLY: 0, ANNUAL: 0, LIFETIME: 0 },
    byPaymentMethod: {
      DIRECT_TRANSFER: 0,
      CARD: 0,
      KAKAO_PAY: 0,
      NAVER_PAY: 0,
      TOSS_PAY: 0,
    },
  }

  const batchCount = Math.ceil(TOTAL_MEMBERS / BATCH_SIZE)

  for (let batch = 0; batch < batchCount; batch++) {
    const startIndex = batch * BATCH_SIZE + 1
    const endIndex = Math.min((batch + 1) * BATCH_SIZE, TOTAL_MEMBERS)
    const batchMembers = []

    for (let i = startIndex; i <= endIndex; i++) {
      const email = `test${String(i).padStart(4, '0')}@god.or.kr`
      const memberType = weightedRandom(MEMBER_TYPE_DISTRIBUTION) as MemberType

      // 회비 유형 결정 (YOUTH/DONOR는 MONTHLY 고정, 실제로는 회비 없음)
      let feeType: FeeType
      if (memberType === 'YOUTH' || memberType === 'DONOR') {
        feeType = 'MONTHLY'
      } else {
        feeType = weightedRandom(FEE_TYPE_DISTRIBUTION) as FeeType
        stats.byFeeType[feeType]++
      }

      // 결제 수단 결정
      const paymentMethod = weightedRandom(PAYMENT_METHOD_DISTRIBUTION) as PaymentMethod

      const gender = Math.random() < 0.5 ? 'MALE' : 'FEMALE'
      const joinDate = randomJoinDate()

      batchMembers.push({
        name: randomName(),
        email,
        birthDate: randomBirthDate(memberType),
        gender: gender as Gender,
        address: randomAddress(),
        phone: randomPhone(),
        smsConsent: Math.random() < 0.7,
        memberType,
        church: randomElement(CHURCHES),
        position: randomElement(POSITIONS),
        joinDate,
        feeType,
        paymentMethod,
        consentPrivacy: true,
        consentMarketing: Math.random() < 0.5,
        marketingChannel: Math.random() < 0.5 ? 'EMAIL' : Math.random() < 0.5 ? 'SMS' : 'BOTH',
        consentThirdParty: false,
        consentDate: joinDate,
        isActive: true,
      })

      // 통계 업데이트
      stats.total++
      stats.byType[memberType]++
      stats.byPaymentMethod[paymentMethod as keyof typeof stats.byPaymentMethod]++
    }

    // 배치 생성
    await prisma.member.createMany({
      data: batchMembers,
      skipDuplicates: true,
    })

    console.log(`배치 ${batch + 1}/${batchCount} 완료 (${startIndex}~${endIndex})`)

    // 회비 레코드 생성 (--with-fees 옵션)
    if (withFees) {
      // 방금 생성한 회원 조회
      const createdMembers = await prisma.member.findMany({
        where: {
          email: {
            in: batchMembers.map((m) => m.email),
          },
        },
        select: {
          id: true,
          email: true,
          memberType: true,
          feeType: true,
          joinDate: true,
          paymentMethod: true,
        },
      })

      for (const member of createdMembers) {
        await createFeesForMember(
          member.id,
          member.feeType,
          member.memberType,
          member.joinDate,
          member.paymentMethod
        )
      }
      console.log(`  └─ 회비 레코드 생성 완료`)
    }
  }

  // 최종 통계 출력
  console.log('\n테스트 회원 생성 완료!')
  console.log('─────────────────────────────────────────')
  console.log(`총 ${stats.total}명 생성`)
  console.log('\n회원 유형별:')
  console.log(`  - 정회원(REGULAR): ${stats.byType.REGULAR}명`)
  console.log(`  - 준회원(ASSOCIATE): ${stats.byType.ASSOCIATE}명`)
  console.log(`  - 청소년(YOUTH): ${stats.byType.YOUTH}명`)
  console.log(`  - 후원회원(DONOR): ${stats.byType.DONOR}명`)
  console.log('\n회비 유형별 (REGULAR/ASSOCIATE만):')
  console.log(`  - 월납(MONTHLY): ${stats.byFeeType.MONTHLY}명`)
  console.log(`  - 연납(ANNUAL): ${stats.byFeeType.ANNUAL}명`)
  console.log(`  - 평생(LIFETIME): ${stats.byFeeType.LIFETIME}명`)
  console.log('\n결제 수단별:')
  console.log(`  - 직접입금(DIRECT_TRANSFER): ${stats.byPaymentMethod.DIRECT_TRANSFER}명`)
  console.log(`  - 카드(CARD): ${stats.byPaymentMethod.CARD}명`)
  console.log(`  - 카카오페이(KAKAO_PAY): ${stats.byPaymentMethod.KAKAO_PAY}명`)
  console.log(`  - 네이버페이(NAVER_PAY): ${stats.byPaymentMethod.NAVER_PAY}명`)
  console.log(`  - 토스페이(TOSS_PAY): ${stats.byPaymentMethod.TOSS_PAY}명`)

  if (withFees) {
    const feeCount = await prisma.memberFee.count({
      where: {
        member: {
          email: {
            startsWith: 'test',
            endsWith: '@god.or.kr',
            not: 'test@god.or.kr',
          },
        },
      },
    })
    console.log(`\n회비 레코드: ${feeCount}건`)
  }

  // DB 검증 쿼리
  const dbCount = await prisma.member.count({
    where: {
      email: {
        startsWith: 'test',
        endsWith: '@god.or.kr',
        not: 'test@god.or.kr',
      },
    },
  })
  console.log(`\nDB 검증: ${dbCount}명 확인`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
