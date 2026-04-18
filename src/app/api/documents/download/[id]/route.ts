import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { logAccess, getClientInfo } from '@/lib/access-log'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const documentId = parseInt(id)

    if (isNaN(documentId)) {
      return NextResponse.json({ success: false, error: '잘못된 문서 ID입니다.' }, { status: 400 })
    }

    // 문서 정보 조회
    const document = await prisma.memberDocument.findUnique({
      where: { id: documentId },
      include: {
        member: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!document) {
      // 실패 접근 로그
      const clientInfo = getClientInfo(request)
      await logAccess({
        action: 'DOCUMENT_DOWNLOAD_FAILED',
        resource: `document_${documentId}`,
        ...clientInfo,
        successful: false,
        details: { error: 'Document not found' },
      })

      return NextResponse.json(
        { success: false, error: '문서를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const filePath = path.join(process.cwd(), document.filePath)

    // 파일 존재 확인
    try {
      await stat(filePath)
    } catch {
      return NextResponse.json(
        { success: false, error: '파일이 존재하지 않습니다.' },
        { status: 404 }
      )
    }

    // 파일 읽기
    const fileBuffer = await readFile(filePath)

    // 성공 접근 로그
    const clientInfo = getClientInfo(request)
    await logAccess({
      action: 'DOCUMENT_DOWNLOAD',
      resource: `document_${documentId}`,
      ...clientInfo,
      successful: true,
      details: {
        fileName: document.originalName,
        fileSize: document.fileSize,
        memberName: document.member.name,
        memberId: document.member.id,
      },
    })

    // 응답 헤더 설정
    const headers = new Headers()
    headers.set('Content-Type', document.mimeType)
    headers.set('Content-Length', document.fileSize.toString())
    headers.set(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(document.originalName)}"`
    )

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('파일 다운로드 오류:', error)
    return NextResponse.json(
      { success: false, error: '파일 다운로드 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
