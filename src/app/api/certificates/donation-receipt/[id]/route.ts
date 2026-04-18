import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { formatDate, formatAmount } from '@/lib/utils'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const donationId = parseInt(id)

    if (isNaN(donationId)) {
      return NextResponse.json(
        { success: false, error: '잘못된 후원금 ID입니다.' },
        { status: 400 }
      )
    }

    // 후원금 정보 조회
    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
      },
    })

    if (!donation) {
      return NextResponse.json(
        { success: false, error: '후원금 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const purposeLabels = {
      GENERAL: '일반기금',
      SCHOLARSHIP: '장학금',
      OPERATION: '운영비',
      WELFARE: '복지사업',
      PROGRAM: '프로그램',
    }

    const donorTypeLabels = {
      MEMBER: '회원',
      INDIVIDUAL: '개인',
      CORPORATE: '법인',
    }

    // HTML 기부금영수증 생성
    const html = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>기부금영수증 - ${donation.receiptNo}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: 'Malgun Gothic', '맑은 고딕', Arial, sans-serif;
                font-size: 14px;
                line-height: 1.6;
                color: #333;
                background: white;
            }

            .certificate {
                width: 210mm;
                min-height: 297mm;
                margin: 0 auto;
                padding: 30mm;
                background: white;
            }

            .header {
                text-align: center;
                margin-bottom: 40px;
                border-bottom: 3px solid #2563eb;
                padding-bottom: 20px;
            }

            .title {
                font-size: 28px;
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 10px;
            }

            .subtitle {
                font-size: 18px;
                color: #6b7280;
            }

            .info-section {
                margin: 30px 0;
            }

            .info-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }

            .info-table th,
            .info-table td {
                padding: 12px;
                border: 1px solid #d1d5db;
                text-align: left;
            }

            .info-table th {
                background-color: #f9fafb;
                font-weight: bold;
                width: 150px;
            }

            .amount-highlight {
                background-color: #fef3c7;
                font-weight: bold;
                font-size: 16px;
                text-align: center;
            }

            .footer {
                margin-top: 50px;
                text-align: center;
            }

            .issue-date {
                margin: 30px 0;
                text-align: right;
                font-size: 16px;
            }

            .organization {
                margin-top: 40px;
                text-align: center;
            }

            .org-name {
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 10px;
            }

            .org-info {
                color: #6b7280;
                margin-bottom: 5px;
            }

            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                .certificate {
                    margin: 0;
                    padding: 20mm;
                    width: 100%;
                    min-height: auto;
                }

                @page {
                    margin: 0;
                    size: A4;
                }
            }
        </style>
    </head>
    <body>
        <div class="certificate">
            <div class="header">
                <div class="title">기부금영수증</div>
                <div class="subtitle">Donation Receipt</div>
            </div>

            <div class="info-section">
                <table class="info-table">
                    <tr>
                        <th>영수증 번호</th>
                        <td>${donation.receiptNo}</td>
                    </tr>
                    <tr>
                        <th>기부자 성명</th>
                        <td>${donation.donorName}</td>
                    </tr>
                    <tr>
                        <th>기부자 구분</th>
                        <td>${donorTypeLabels[donation.donorType]}</td>
                    </tr>
                    ${
                      donation.member
                        ? `
                    <tr>
                        <th>주소</th>
                        <td>${donation.member.address}</td>
                    </tr>
                    <tr>
                        <th>연락처</th>
                        <td>${donation.member.phone}</td>
                    </tr>
                    `
                        : ''
                    }
                    <tr>
                        <th>기부일자</th>
                        <td>${formatDate(donation.date)}</td>
                    </tr>
                    <tr>
                        <th>기부 목적</th>
                        <td>${purposeLabels[donation.purpose] || donation.purpose}</td>
                    </tr>
                    <tr>
                        <th>기부 금액</th>
                        <td class="amount-highlight">${formatAmount(donation.amount)}원</td>
                    </tr>
                    ${
                      donation.note
                        ? `
                    <tr>
                        <th>비고</th>
                        <td>${donation.note}</td>
                    </tr>
                    `
                        : ''
                    }
                </table>
            </div>

            <div class="issue-date">
                발급일자: ${formatDate(new Date())}
            </div>

            <div class="organization">
                <div class="org-name">하나님나라연구소</div>
                <div class="org-info">Kingdom of God Research Institute</div>
                <div class="org-info">[주소]</div>
                <div class="org-info">[연락처]</div>
                <div class="org-info">[홈페이지]</div>
            </div>

            <div class="footer">
                <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">
                    이 영수증은 소득공제 및 세액공제를 위한 공식 증명서입니다.<br>
                    국세청 연말정산 간소화서비스에서 확인하실 수 있습니다.
                </p>
            </div>
        </div>

        <script>
            // 자동 인쇄 대화상자 표시 (선택사항)
            // window.onload = function() {
            //     window.print();
            // }
        </script>
    </body>
    </html>`

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('기부금영수증 생성 오류:', error)
    return NextResponse.json(
      { success: false, error: '기부금영수증 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
