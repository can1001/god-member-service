import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined. Make sure .env.local is loaded.')
}

const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // 기존 데이터 삭제
  await prisma.donation.deleteMany()
  await prisma.memberFee.deleteMany()
  await prisma.cmsInfo.deleteMany()
  await prisma.member.deleteMany()

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  // ─────────────────────────────────────────────────────────────
  // 정회원 3명 (CMS 월납)
  // ─────────────────────────────────────────────────────────────
  const regularMembers = await Promise.all([
    prisma.member.create({
      data: {
        name: '김성서',
        birthDate: new Date('1985-03-15'),
        gender: 'MALE',
        address: '서울특별시 강남구 테헤란로 123',
        phone: '010-1234-5678',
        smsConsent: true,
        email: 'kim.ss@example.com',
        memberType: 'REGULAR',
        church: '서울중앙교회',
        position: '집사',
        joinDate: new Date('2024-01-15'),
        feeType: 'MONTHLY',
        paymentMethod: 'CMS',
        consentPrivacy: true,
        consentMarketing: true,
        marketingChannel: 'BOTH',
        consentThirdParty: true,
        consentDate: new Date('2024-01-15'),
        cmsInfo: {
          create: {
            bankName: '국민은행',
            accountNo: '[ENCRYPTED]',
            accountHolder: '김성서',
            holderBirthNo: '[ENCRYPTED]',
            holderPhone: '010-1234-5678',
            scheduledAmount: 10000,
            withdrawDay: 10,
          },
        },
      },
    }),
    prisma.member.create({
      data: {
        name: '이유니',
        birthDate: new Date('1990-07-22'),
        gender: 'FEMALE',
        address: '서울특별시 서초구 반포대로 456',
        phone: '010-2345-6789',
        smsConsent: true,
        email: 'lee.yn@example.com',
        memberType: 'REGULAR',
        church: '반포교회',
        position: '권사',
        joinDate: new Date('2024-03-01'),
        feeType: 'MONTHLY',
        paymentMethod: 'CMS',
        consentPrivacy: true,
        consentMarketing: true,
        marketingChannel: 'EMAIL',
        consentThirdParty: true,
        consentDate: new Date('2024-03-01'),
        cmsInfo: {
          create: {
            bankName: '신한은행',
            accountNo: '[ENCRYPTED]',
            accountHolder: '이유니',
            holderBirthNo: '[ENCRYPTED]',
            holderPhone: '010-2345-6789',
            scheduledAmount: 20000,
            withdrawDay: 20,
          },
        },
      },
    }),
    prisma.member.create({
      data: {
        name: '박온누리',
        birthDate: new Date('1978-11-30'),
        gender: 'MALE',
        address: '경기도 성남시 분당구 정자동 789',
        phone: '010-3456-7890',
        smsConsent: false,
        email: 'park.on@example.com',
        memberType: 'REGULAR',
        church: '분당우리교회',
        position: '장로',
        joinDate: new Date('2025-01-10'),
        feeType: 'MONTHLY',
        paymentMethod: 'CMS',
        consentPrivacy: true,
        consentMarketing: false,
        consentThirdParty: true,
        consentDate: new Date('2025-01-10'),
        cmsInfo: {
          create: {
            bankName: '하나은행',
            accountNo: '[ENCRYPTED]',
            accountHolder: '박온누리',
            holderBirthNo: '[ENCRYPTED]',
            holderPhone: '010-3456-7890',
            scheduledAmount: 10000,
            withdrawDay: 25,
          },
        },
      },
    }),
  ])

  // ─────────────────────────────────────────────────────────────
  // 준회원 2명 (직접입금 연납)
  // ─────────────────────────────────────────────────────────────
  const associateMembers = await Promise.all([
    prisma.member.create({
      data: {
        name: '최말씀',
        birthDate: new Date('1995-05-10'),
        gender: 'FEMALE',
        address: '인천광역시 연수구 송도동 123',
        phone: '010-4567-8901',
        smsConsent: true,
        email: 'choi.ms@example.com',
        memberType: 'ASSOCIATE',
        church: '송도교회',
        joinDate: new Date('2024-06-01'),
        feeType: 'ANNUAL',
        paymentMethod: 'DIRECT_TRANSFER',
        consentPrivacy: true,
        consentMarketing: true,
        marketingChannel: 'SMS',
        consentThirdParty: false,
        consentDate: new Date('2024-06-01'),
      },
    }),
    prisma.member.create({
      data: {
        name: '정복음',
        birthDate: new Date('2000-12-25'),
        gender: 'MALE',
        address: '부산광역시 해운대구 우동 456',
        phone: '010-5678-9012',
        smsConsent: true,
        email: 'jung.by@example.com',
        memberType: 'ASSOCIATE',
        church: '해운대교회',
        joinDate: new Date('2025-02-15'),
        feeType: 'ANNUAL',
        paymentMethod: 'DIRECT_TRANSFER',
        consentPrivacy: true,
        consentMarketing: false,
        consentThirdParty: false,
        consentDate: new Date('2025-02-15'),
      },
    }),
  ])

  // ─────────────────────────────────────────────────────────────
  // 청소년회원 1명
  // ─────────────────────────────────────────────────────────────
  const youthMember = await prisma.member.create({
    data: {
      name: '한빛나',
      birthDate: new Date('2010-08-20'),
      gender: 'FEMALE',
      address: '대전광역시 유성구 봉명동 789',
      phone: '010-6789-0123',
      smsConsent: true,
      email: 'han.bn@example.com',
      memberType: 'YOUTH',
      church: '대전교회',
      joinDate: new Date('2025-03-01'),
      feeType: 'MONTHLY', // 청소년은 회비 없음, 형식상 MONTHLY
      paymentMethod: 'DIRECT_TRANSFER',
      consentPrivacy: true,
      consentMarketing: true,
      marketingChannel: 'SMS',
      consentThirdParty: false,
      consentDate: new Date('2025-03-01'),
    },
  })

  // ─────────────────────────────────────────────────────────────
  // 회비 레코드 생성
  // ─────────────────────────────────────────────────────────────

  // 정회원 월납 회비 (김성서 - 2024년 1월~12월)
  const kim = regularMembers[0]
  for (let month = 1; month <= 12; month++) {
    await prisma.memberFee.create({
      data: {
        memberId: kim.id,
        year: 2024,
        month,
        feeType: 'MONTHLY',
        amount: 10000,
        status: month <= 10 ? 'PAID' : 'UNPAID', // 1~10월 납부, 11~12월 미납
        paymentMethod: 'CMS',
        paidDate: month <= 10 ? new Date(2024, month - 1, 10) : null,
      },
    })
  }

  // 정회원 월납 회비 (이유니 - 2024년 3월~12월)
  const lee = regularMembers[1]
  for (let month = 3; month <= 12; month++) {
    await prisma.memberFee.create({
      data: {
        memberId: lee.id,
        year: 2024,
        month,
        feeType: 'MONTHLY',
        amount: 20000,
        status: month <= 9 ? 'PAID' : 'UNPAID', // 3~9월 납부, 10~12월 미납
        paymentMethod: 'CMS',
        paidDate: month <= 9 ? new Date(2024, month - 1, 20) : null,
      },
    })
  }

  // 정회원 월납 회비 (박온누리 - 2025년 1월~현재월)
  const park = regularMembers[2]
  for (let month = 1; month <= currentMonth; month++) {
    await prisma.memberFee.create({
      data: {
        memberId: park.id,
        year: currentYear,
        month,
        feeType: 'MONTHLY',
        amount: 10000,
        status: month < currentMonth ? 'PAID' : 'UNPAID',
        paymentMethod: 'CMS',
        paidDate: month < currentMonth ? new Date(currentYear, month - 1, 25) : null,
      },
    })
  }

  // 준회원 연납 회비 (최말씀 - 2024년)
  const choi = associateMembers[0]
  await prisma.memberFee.create({
    data: {
      memberId: choi.id,
      year: 2024,
      month: null,
      feeType: 'ANNUAL',
      amount: 120000,
      status: 'PAID',
      paymentMethod: 'DIRECT_TRANSFER',
      paidDate: new Date('2024-06-15'),
    },
  })

  // 준회원 연납 회비 (정복음 - 2025년 미납)
  const jung = associateMembers[1]
  await prisma.memberFee.create({
    data: {
      memberId: jung.id,
      year: currentYear,
      month: null,
      feeType: 'ANNUAL',
      amount: 120000,
      status: 'UNPAID',
      paymentMethod: 'DIRECT_TRANSFER',
    },
  })

  // 청소년회원은 회비 없음

  // ─────────────────────────────────────────────────────────────
  // 후원금 5건
  // ─────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.donation.create({
      data: {
        receiptNo: 'DON-202501-0001',
        donorName: '김성서',
        donorType: 'MEMBER',
        amount: 100000,
        date: new Date('2025-01-20'),
        purpose: 'GENERAL',
        memberId: kim.id,
      },
    }),
    prisma.donation.create({
      data: {
        receiptNo: 'DON-202502-0001',
        donorName: '이유니',
        donorType: 'MEMBER',
        amount: 50000,
        date: new Date('2025-02-15'),
        purpose: 'SCHOLARSHIP',
        memberId: lee.id,
      },
    }),
    prisma.donation.create({
      data: {
        receiptNo: 'DON-202502-0002',
        donorName: '홍길동',
        donorType: 'INDIVIDUAL',
        amount: 200000,
        date: new Date('2025-02-28'),
        purpose: 'WELFARE',
        note: '익명 후원',
      },
    }),
    prisma.donation.create({
      data: {
        receiptNo: 'DON-202503-0001',
        donorName: '(주)은혜기업',
        donorType: 'CORPORATE',
        amount: 1000000,
        date: new Date('2025-03-05'),
        purpose: 'PROGRAM',
        note: '2025년 청소년 캠프 후원',
      },
    }),
    prisma.donation.create({
      data: {
        receiptNo: 'DON-202503-0002',
        donorName: '박온누리',
        donorType: 'MEMBER',
        amount: 300000,
        date: new Date('2025-03-10'),
        purpose: 'OPERATION',
        memberId: park.id,
      },
    }),
  ])

  console.log('Seed completed successfully!')
  console.log(`- Members: 6 (Regular: 3, Associate: 2, Youth: 1)`)
  console.log(`- MemberFees: ${await prisma.memberFee.count()}`)
  console.log(`- CmsInfo: ${await prisma.cmsInfo.count()}`)
  console.log(`- Donations: ${await prisma.donation.count()}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
