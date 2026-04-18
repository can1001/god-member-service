'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Smartphone, Monitor, AlertTriangle, Check } from 'lucide-react'
import { toast } from 'sonner'

interface DeviceInfo {
  deviceId: string
  deviceName: string
  userAgent: string
  ipAddress: string
  isNewDevice: boolean
}

export default function DeviceSecurityAlert() {
  const [showAlert, setShowAlert] = useState(false)
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)
  const [customDeviceName, setCustomDeviceName] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    // 쿠키에서 새 디바이스 감지 확인
    const checkNewDevice = () => {
      const cookies = document.cookie.split(';')
      const newDeviceCookie = cookies.find((cookie) =>
        cookie.trim().startsWith('new-device-detected=')
      )
      const deviceIdCookie = cookies.find((cookie) => cookie.trim().startsWith('device-id='))

      if (newDeviceCookie && deviceIdCookie) {
        const deviceId = deviceIdCookie.split('=')[1]

        // 디바이스 정보 수집
        const userAgent = navigator.userAgent
        const deviceName = generateDeviceName(userAgent)

        setDeviceInfo({
          deviceId,
          deviceName,
          userAgent,
          ipAddress: 'Unknown', // 클라이언트에서는 실제 IP를 알 수 없음
          isNewDevice: true,
        })

        setCustomDeviceName(deviceName)
        setShowAlert(true)

        // 쿠키 삭제 (한 번만 표시)
        document.cookie = 'new-device-detected=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      }
    }

    checkNewDevice()
  }, [])

  const generateDeviceName = (userAgent: string): string => {
    if (userAgent.includes('Chrome')) {
      if (userAgent.includes('Mobile')) return 'Chrome 모바일'
      if (userAgent.includes('Android')) return 'Android Chrome'
      return 'Chrome 브라우저'
    }
    if (userAgent.includes('Firefox')) return 'Firefox 브라우저'
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'Safari iOS'
      return 'Safari 브라우저'
    }
    if (userAgent.includes('Edge')) return 'Microsoft Edge'

    if (userAgent.includes('Windows')) return '윈도우 PC'
    if (userAgent.includes('Mac')) return 'Mac 컴퓨터'
    if (userAgent.includes('Android')) return 'Android 기기'
    if (userAgent.includes('iPhone')) return 'iPhone'
    if (userAgent.includes('iPad')) return 'iPad'

    return '알 수 없는 기기'
  }

  const getDeviceIcon = (deviceName: string) => {
    if (
      deviceName.includes('모바일') ||
      deviceName.includes('iPhone') ||
      deviceName.includes('Android')
    ) {
      return <Smartphone className="h-5 w-5" />
    }
    return <Monitor className="h-5 w-5" />
  }

  const handleTrustDevice = async () => {
    if (!deviceInfo) return

    setIsProcessing(true)

    try {
      const response = await fetch('/api/device/trust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceName: customDeviceName.trim() || deviceInfo.deviceName,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('이 기기가 신뢰할 수 있는 기기로 등록되었습니다.')
        setShowAlert(false)
      } else {
        toast.error(result.error || '기기 등록에 실패했습니다.')
      }
    } catch (error) {
      console.error('기기 신뢰 등록 오류:', error)
      toast.error('기기 등록 중 오류가 발생했습니다.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDismiss = () => {
    setShowAlert(false)
    toast.info('이 기기는 신뢰하지 않은 상태로 남아있습니다.')
  }

  if (!showAlert || !deviceInfo) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Shield className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-lg">새로운 기기에서 접속</CardTitle>
              <CardDescription>보안을 위해 이 기기를 확인해주세요</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              새로운 기기에서 하나님나라연구소 관리 시스템에 접속했습니다.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {getDeviceIcon(deviceInfo.deviceName)}
              <div className="flex-1">
                <p className="font-medium text-sm">{deviceInfo.deviceName}</p>
                <p className="text-xs text-gray-500">현재 접속 기기</p>
              </div>
              <Badge variant="outline" className="text-orange-600">
                <AlertTriangle className="h-3 w-3 mr-1" />
                미등록
              </Badge>
            </div>

            <div className="space-y-2">
              <Label htmlFor="device-name">기기 이름 (선택사항)</Label>
              <Input
                id="device-name"
                value={customDeviceName}
                onChange={(e) => setCustomDeviceName(e.target.value)}
                placeholder="예: 사무실 컴퓨터, 개인 노트북"
                className="text-sm"
              />
              <p className="text-xs text-gray-500">
                이 기기를 쉽게 식별할 수 있는 이름을 입력하세요.
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleDismiss}
            className="flex-1"
            disabled={isProcessing}
          >
            나중에
          </Button>
          <Button onClick={handleTrustDevice} className="flex-1" disabled={isProcessing}>
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                등록 중...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                신뢰할 수 있는 기기로 등록
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
