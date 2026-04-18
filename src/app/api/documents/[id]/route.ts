import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logAccess } from '@/lib/audit'
import fs from 'fs/promises'
import path from 'path'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const docId = parseInt(id, 10)

    if (isNaN(docId)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 })
    }

    // 문서 정보 조회
    const document = await prisma.memberDocument.findUnique({
      where: { id: docId },
      include: { member: true },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // 감사 로그 기록
    await logAccess({
      action: 'DOCUMENT_DOWNLOAD',
      resourceType: 'DOCUMENT',
      resourceId: docId,
      details: `Downloaded document: ${document.fileName} for member ${document.member.name}`,
    })

    // 파일 경로 확인
    const filePath = document.filePath

    // filePath가 URL인 경우 (외부 저장소)
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return NextResponse.redirect(filePath)
    }

    // 로컬 파일인 경우
    const absolutePath = path.join(process.cwd(), 'uploads', filePath)

    try {
      const fileBuffer = await fs.readFile(absolutePath)

      // Content-Type 결정
      const ext = path.extname(document.fileName).toLowerCase()
      const contentTypes: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }

      const contentType = contentTypes[ext] || 'application/octet-stream'

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(document.fileName)}"`,
        },
      })
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('Document download error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
