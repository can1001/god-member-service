import { prisma } from '@/lib/prisma'
import { EmptyDonations } from '@/components/server/EmptyState'
import { DonationsTable } from '@/components/client/DonationsTable'
import { Prisma, DonorType, DonationPurpose } from '@prisma/client'

interface DonationsListProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function DonationsList({ searchParams }: DonationsListProps) {
  const params = await searchParams
  const search = typeof params.search === 'string' ? params.search : ''
  const donorType = typeof params.donorType === 'string' ? params.donorType : ''
  const purpose = typeof params.purpose === 'string' ? params.purpose : ''
  const year = typeof params.year === 'string' ? parseInt(params.year) : new Date().getFullYear()
  const month =
    typeof params.month === 'string'
      ? params.month
        ? parseInt(params.month)
        : undefined
      : undefined

  const donations = await getDonations({ search, donorType, purpose, year, month })

  if (donations.length === 0) {
    return <EmptyDonations />
  }

  return <DonationsTable donations={donations} />
}

async function getDonations({
  search,
  donorType,
  purpose,
  year,
  month,
}: {
  search: string
  donorType: string
  purpose: string
  year: number
  month?: number
}) {
  try {
    const where: Prisma.DonationWhereInput = {}

    // Search filter (donor name)
    if (search) {
      where.donorName = {
        contains: search,
        mode: 'insensitive',
      }
    }

    // Donor type filter
    if (donorType) {
      where.donorType = donorType as DonorType
    }

    // Purpose filter
    if (purpose) {
      where.purpose = purpose as DonationPurpose
    }

    // Date filter
    const startDate = new Date(year, month ? month - 1 : 0, 1)
    const endDate = new Date(year, month ? month : 12, 0, 23, 59, 59, 999)

    where.date = {
      gte: startDate,
      lte: endDate,
    }

    const donations = await prisma.donation.findMany({
      where,
      include: {
        member: {
          select: {
            name: true,
            memberType: true,
            email: true,
          },
        },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: 100, // Limit to 100 results for performance
    })

    return donations
  } catch (error) {
    console.error('Error fetching donations:', error)
    return []
  }
}
