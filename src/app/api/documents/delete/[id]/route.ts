import { NextRequest, NextResponse } from 'next/server'
import { unlink, stat } from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const documentId = parseInt(id)

    if (isNaN(documentId)) {
      return NextResponse.json({ success: false, error: '잘못된 문서 ID입니다.' }, { status: 400 })
    }

    // 문서 정보 조회
    const document = await prisma.memberDocument.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      return NextResponse.json(
        { success: false, error: '문서를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const filePath = path.join(process.cwd(), document.filePath)

    // 파일이 존재하면 삭제
    try {
      await stat(filePath)
      await unlink(filePath)
    } catch (error) {
      // 파일이 없어도 DB에서는 삭제 진행 (데이터 무결성)
      console.warn('파일 삭제 실패 또는 파일이 존재하지 않음:', error)
    }

    // DB에서 문서 정보 삭제
    await prisma.memberDocument.delete({
      where: { id: documentId },
    })

    return NextResponse.json({
      success: true,
      message: '문서가 성공적으로 삭제되었습니다.',
    })
  } catch (error) {
    console.error('문서 삭제 오류:', error)
    return NextResponse.json(
      { success: false, error: '문서 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
