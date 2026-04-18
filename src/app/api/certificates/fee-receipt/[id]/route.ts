import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { formatDate, formatAmount } from '@/lib/utils'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const feeId = parseInt(id)

    if (isNaN(feeId)) {
      return NextResponse.json({ success: false, error: '잘못된 회비 ID입니다.' }, { status: 400 })
    }

    // 회비 정보 조회
    const fee = await prisma.memberFee.findUnique({
      where: { id: feeId },
      include: {
        member: true,
      },
    })

    if (!fee) {
      return NextResponse.json(
        { success: false, error: '회비 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (fee.status !== 'PAID') {
      return NextResponse.json(
        { success: false, error: '납부되지 않은 회비에 대해서는 납부확인서를 발급할 수 없습니다.' },
        { status: 400 }
      )
    }

    const feeTypeLabels = {
      MONTHLY: '월납',
      ANNUAL: '연납',
      LIFETIME: '평생',
    }

    const memberTypeLabels: Record<string, string> = {
      REGULAR: '정회원',
      ASSOCIATE: '준회원',
      YOUTH: '청소년회원',
      DONOR: '후원회원',
    }

    const paymentMethodLabels: Record<string, string> = {
      CMS: 'CMS 자동이체',
      DIRECT_TRANSFER: '직접입금',
      CARD: '신용카드',
      KAKAO_PAY: '카카오페이',
      NAVER_PAY: '네이버페이',
      TOSS_PAY: '토스페이',
      PHONE: '휴대폰 결제',
      BILLING: '카드 정기결제',
    }

    // 회비 기간 표시
    const feePeroid =
      fee.feeType === 'MONTHLY'
        ? `${fee.year}년 ${fee.month}월`
        : fee.feeType === 'ANNUAL'
          ? `${fee.year}년`
          : '평생'

    // HTML 납부확인서 생성
    const html = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>회비 납부확인서 - ${fee.member.name}</title>
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
                border-bottom: 3px solid #059669;
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
                background-color: #dcfce7;
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

            .confirmation-text {
                background-color: #f0f9ff;
                border-left: 4px solid #0ea5e9;
                padding: 20px;
                margin: 30px 0;
                font-size: 16px;
                line-height: 1.8;
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
                <div class="title">회비 납부확인서</div>
                <div class="subtitle">Membership Fee Payment Certificate</div>
            </div>

            <div class="confirmation-text">
                아래 회원이 하나님나라연구소 회비를 정상적으로 납부하였음을 확인합니다.
            </div>

            <div class="info-section">
                <table class="info-table">
                    <tr>
                        <th>회원 성명</th>
                        <td>${fee.member.name}</td>
                    </tr>
                    <tr>
                        <th>회원 구분</th>
                        <td>${memberTypeLabels[fee.member.memberType]}</td>
                    </tr>
                    <tr>
                        <th>가입일</th>
                        <td>${formatDate(fee.member.joinDate)}</td>
                    </tr>
                    <tr>
                        <th>주소</th>
                        <td>${fee.member.address}</td>
                    </tr>
                    <tr>
                        <th>연락처</th>
                        <td>${fee.member.phone}</td>
                    </tr>
                    <tr>
                        <th>이메일</th>
                        <td>${fee.member.email}</td>
                    </tr>
                    <tr>
                        <th>회비 구분</th>
                        <td>${feeTypeLabels[fee.feeType]}</td>
                    </tr>
                    <tr>
                        <th>납부 기간</th>
                        <td>${feePeroid}</td>
                    </tr>
                    <tr>
                        <th>납부 금액</th>
                        <td class="amount-highlight">${formatAmount(fee.amount)}원</td>
                    </tr>
                    <tr>
                        <th>납부 방법</th>
                        <td>${paymentMethodLabels[fee.paymentMethod || 'DIRECT_TRANSFER']}</td>
                    </tr>
                    <tr>
                        <th>납부일</th>
                        <td>${fee.paidDate ? formatDate(fee.paidDate) : '-'}</td>
                    </tr>
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
                    이 확인서는 하나님나라연구소 회비 납부를 증명하는 공식 문서입니다.<br>
                    문의사항이 있으시면 위의 연락처로 문의하시기 바랍니다.
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
    console.error('납부확인서 생성 오류:', error)
    return NextResponse.json(
      { success: false, error: '납부확인서 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
