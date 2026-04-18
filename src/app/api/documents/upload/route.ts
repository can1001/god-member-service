import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile, stat } from 'fs/promises'
import path from 'path'
import { DocumentType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// 허용되는 파일 타입
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

// 최대 파일 크기 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

// 업로드 폴더 경로
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'documents')

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const file = formData.get('file') as File
    const memberId = formData.get('memberId') as string
    const documentType = formData.get('documentType') as DocumentType
    const description = formData.get('description') as string | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: '파일이 선택되지 않았습니다.' },
        { status: 400 }
      )
    }

    if (!memberId || !documentType) {
      return NextResponse.json(
        { success: false, error: '회원ID와 문서타입은 필수입니다.' },
        { status: 400 }
      )
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: '파일 크기가 10MB를 초과할 수 없습니다.' },
        { status: 400 }
      )
    }

    // MIME 타입 검증
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error:
            '지원되지 않는 파일 형식입니다. PDF, 이미지(JPG, PNG, WebP), Word 문서만 업로드 가능합니다.',
        },
        { status: 400 }
      )
    }

    // 회원 존재 확인
    const member = await prisma.member.findUnique({
      where: { id: parseInt(memberId) },
    })

    if (!member) {
      return NextResponse.json(
        { success: false, error: '존재하지 않는 회원입니다.' },
        { status: 404 }
      )
    }

    // 업로드 디렉토리 생성
    try {
      await stat(UPLOAD_DIR)
    } catch {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    // 고유한 파일명 생성 (회원ID_문서타입_타임스탬프_해시.확장자)
    const fileExtension = path.extname(file.name)
    const timestamp = Date.now()
    const hash = crypto.randomBytes(8).toString('hex')
    const fileName = `${memberId}_${documentType}_${timestamp}_${hash}${fileExtension}`

    const filePath = path.join(UPLOAD_DIR, fileName)
    const relativePath = path.join('uploads', 'documents', fileName)

    // 파일 저장
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // 데이터베이스에 문서 정보 저장
    const document = await prisma.memberDocument.create({
      data: {
        memberId: parseInt(memberId),
        documentType,
        originalName: file.name,
        fileName,
        filePath: relativePath,
        fileSize: file.size,
        mimeType: file.type,
        description: description || null,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: document.id,
        originalName: document.originalName,
        fileName: document.fileName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        documentType: document.documentType,
        uploadedAt: document.uploadedAt,
      },
    })
  } catch (error) {
    console.error('파일 업로드 오류:', error)
    return NextResponse.json(
      { success: false, error: '파일 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 파일 목록 조회
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const memberId = url.searchParams.get('memberId')

    if (!memberId) {
      return NextResponse.json({ success: false, error: '회원ID가 필요합니다.' }, { status: 400 })
    }

    const documents = await prisma.memberDocument.findMany({
      where: { memberId: parseInt(memberId) },
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        documentType: true,
        originalName: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        description: true,
        uploadedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: documents,
    })
  } catch (error) {
    console.error('문서 목록 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '문서 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
