'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Upload, File, Download, Trash2 } from 'lucide-react'
import { DocumentType } from '@prisma/client'

interface DocumentInfo {
  id: number
  originalName: string
  fileName: string
  fileSize: number
  mimeType: string
  documentType: DocumentType
  description?: string | null
  uploadedAt: string
}

interface DocumentUploadProps {
  memberId: number
  documents: DocumentInfo[]
  onUploadSuccess: (document: DocumentInfo) => void
  onDeleteSuccess: (documentId: number) => void
  className?: string
}

const DOCUMENT_TYPE_LABELS = {
  REGISTRATION_FORM: '회원등록신청서',
  GOOGLE_FORM_RESPONSE: 'Google Forms 응답',
  WEBSITE_SUBMISSION: '홈페이지 신청서',
  PAPER_FORM: '서면 신청서',
  CONSENT_FORM: '동의서',
  ID_COPY: '신분증 사본',
  OTHER: '기타',
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function DocumentUpload({
  memberId,
  documents,
  onUploadSuccess,
  onDeleteSuccess,
  className = '',
}: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState<DocumentType>('REGISTRATION_FORM')
  const [description, setDescription] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 파일 크기 검증 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('파일 크기가 10MB를 초과할 수 없습니다.')
      return
    }

    // 파일 타입 검증
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]

    if (!allowedTypes.includes(file.type)) {
      toast.error(
        '지원되지 않는 파일 형식입니다. PDF, 이미지(JPG, PNG, WebP), Word 문서만 업로드 가능합니다.'
      )
      return
    }

    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('업로드할 파일을 선택해주세요.')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('memberId', memberId.toString())
      formData.append('documentType', documentType)
      if (description.trim()) {
        formData.append('description', description.trim())
      }

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        toast.success('파일이 성공적으로 업로드되었습니다.')
        onUploadSuccess(result.data)

        // 폼 리셋
        setSelectedFile(null)
        setDescription('')
        setDocumentType('REGISTRATION_FORM')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        toast.error(result.error || '파일 업로드에 실패했습니다.')
      }
    } catch (error) {
      console.error('업로드 오류:', error)
      toast.error('파일 업로드 중 오류가 발생했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownload = async (documentId: number, originalName: string) => {
    try {
      const response = await fetch(`/api/documents/download/${documentId}`)

      if (!response.ok) {
        throw new Error('파일 다운로드에 실패했습니다.')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = originalName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('파일이 다운로드되었습니다.')
    } catch (error) {
      console.error('다운로드 오류:', error)
      toast.error('파일 다운로드에 실패했습니다.')
    }
  }

  const handleDelete = async (documentId: number) => {
    if (!confirm('이 문서를 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`/api/documents/delete/${documentId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast.success('문서가 삭제되었습니다.')
        onDeleteSuccess(documentId)
      } else {
        toast.error(result.error || '문서 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('삭제 오류:', error)
      toast.error('문서 삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <File className="h-5 w-5" />
          회원 등록 문서 보관
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 파일 업로드 영역 */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="document-type">문서 유형</Label>
              <select
                id="document-type"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-upload">파일 선택</Label>
              <Input
                id="file-upload"
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                className="cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">파일 설명 (선택사항)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="파일에 대한 간단한 설명을 입력해주세요."
              rows={2}
            />
          </div>

          {selectedFile && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                  <Badge variant="secondary">{formatFileSize(selectedFile.size)}</Badge>
                </div>
                <Button
                  onClick={() => setSelectedFile(null)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <Button onClick={handleUpload} disabled={!selectedFile || isUploading} className="w-full">
            {isUploading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                업로드 중...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                파일 업로드
              </>
            )}
          </Button>
        </div>

        {/* 업로드된 파일 목록 */}
        {documents.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">업로드된 문서</h4>
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <File className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">{doc.originalName}</span>
                        <Badge variant="outline" className="text-xs">
                          {DOCUMENT_TYPE_LABELS[doc.documentType]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>•</span>
                        <span>{new Date(doc.uploadedAt).toLocaleDateString('ko-KR')}</span>
                      </div>
                      {doc.description && (
                        <p className="text-xs text-muted-foreground mt-1">{doc.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => handleDownload(doc.id, doc.originalName)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(doc.id)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• 지원 형식: PDF, 이미지(JPG, PNG, WebP), Word 문서</p>
          <p>• 최대 파일 크기: 10MB</p>
          <p>• 업로드된 문서는 회원 정보와 함께 안전하게 보관됩니다.</p>
        </div>
      </CardContent>
    </Card>
  )
}
