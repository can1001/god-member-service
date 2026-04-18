import { prisma } from '@/lib/prisma'
import { EmptyFees } from '@/components/server/EmptyState'
import { FeesTable } from '@/components/client/FeesTable'
import { Prisma, FeeType, FeeStatus, MemberType } from '@prisma/client'

interface FeesListProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function FeesList({ searchParams }: FeesListProps) {
  const params = await searchParams
  const year = typeof params.year === 'string' ? parseInt(params.year) : new Date().getFullYear()
  const month =
    typeof params.month === 'string'
      ? params.month
        ? parseInt(params.month)
        : undefined
      : undefined
  const feeType = typeof params.feeType === 'string' ? params.feeType : ''
  const status = typeof params.status === 'string' ? params.status : ''
  const memberType = typeof params.memberType === 'string' ? params.memberType : ''

  const fees = await getFees({ year, month, feeType, status, memberType })

  if (fees.length === 0) {
    return <EmptyFees />
  }

  return <FeesTable fees={fees} />
}

async function getFees({
  year,
  month,
  feeType,
  status,
  memberType,
}: {
  year: number
  month?: number
  feeType: string
  status: string
  memberType: string
}) {
  try {
    const where: Prisma.MemberFeeWhereInput = {
      year,
    }

    // Month filter (only for monthly fees)
    if (month) {
      where.month = month
    }

    // Fee type filter
    if (feeType) {
      where.feeType = feeType as FeeType
    }

    // Status filter
    if (status) {
      where.status = status as FeeStatus
    }

    // Member type filter (through member relation)
    if (memberType) {
      where.member = {
        memberType: memberType as MemberType,
      }
    }

    const fees = await prisma.memberFee.findMany({
      where,
      include: {
        member: {
          select: {
            id: true,
            name: true,
            memberType: true,
            email: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // UNPAID first
        { year: 'desc' },
        { month: 'desc' },
        { member: { name: 'asc' } },
      ],
      take: 100, // Limit to 100 results for performance
    })

    return fees
  } catch (error) {
    console.error('Error fetching fees:', error)
    return []
  }
}
