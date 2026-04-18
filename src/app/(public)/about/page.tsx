import Link from 'next/link'
import {
  Heart,
  BookOpen,
  Users,
  Globe,
  Sparkles,
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  ChevronRight,
  Quote,
} from 'lucide-react'

export const metadata = {
  title: '소개 | 하나님나라연구소',
  description: '하나님과 세상을 잇는 가교, 하나님나라연구소를 소개합니다.',
}

export default function AboutPage() {
  return (
    <div className="-mx-4 -mt-6">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-sky-500 via-blue-600 to-violet-600 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 text-center px-6 py-12">
          {/* Logo/Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-8">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-sm font-medium text-white">
              The Institute of God&apos;s Reign
            </span>
          </div>

          {/* Main title */}
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
            하나님나라연구소
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-2 font-medium">하나연</p>

          {/* Slogan */}
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-lg mx-auto leading-relaxed">
            하나님과 세상을 잇는 가교
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/join"
              className="inline-flex items-center justify-center h-11 px-8 rounded-lg bg-white text-blue-600 hover:bg-white/90 font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              회원가입
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
            <a
              href="#support"
              className="inline-flex items-center justify-center h-11 px-8 rounded-lg border border-white/50 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm font-semibold transition-all"
            >
              <Heart className="w-4 h-4 mr-2" />
              후원하기
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/50 flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white/70 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Vision & Mission Section */}
      <section className="py-16 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">비전 & 미션</h2>
            <p className="text-gray-600">하나님 나라의 가치를 연구하고 전파합니다</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Vision Card */}
            <div className="group relative p-8 rounded-3xl bg-gradient-to-br from-sky-500 to-blue-600 text-white overflow-hidden hover:scale-[1.02] transition-transform duration-300">
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6">
                  <Globe className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">비전</h3>
                <p className="text-white/90 leading-relaxed">
                  하나님과 세상을 잇는 가교가 되어, 하나님 나라의 통치가 이 땅에 실현되는 자리를
                  만들어갑니다.
                </p>
              </div>
            </div>

            {/* Mission Card */}
            <div className="group relative p-8 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 text-white overflow-hidden hover:scale-[1.02] transition-transform duration-300">
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6">
                  <Heart className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">미션</h3>
                <p className="text-white/90 leading-relaxed">
                  사랑과 정의의 문을 여는 열쇠가 되어, 모든 사람이 하나님 나라의 복음을 경험하도록
                  섬깁니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Director Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">연구소장</h2>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
              {/* Profile Image Placeholder */}
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shrink-0">
                <GraduationCap className="w-16 h-16 text-white" />
              </div>

              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">김희권 박사</h3>
                <p className="text-blue-600 font-medium mb-6">
                  Ph.D., Princeton Theological Seminary
                </p>

                {/* Quote */}
                <div className="relative bg-white rounded-2xl p-6 mb-6 shadow-sm">
                  <Quote className="absolute -top-3 -left-3 w-8 h-8 text-blue-500/30" />
                  <p className="text-gray-700 leading-relaxed italic">
                    &ldquo;하나님 나라의 복음이 이 땅에 실현되는 그 날을 꿈꾸며, 신학과 삶의
                    연결고리를 찾아 연구하고 나눕니다.&rdquo;
                  </p>
                </div>

                {/* Career */}
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>서울대학교 영어영문학과 졸업</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>장로회신학대학원 교역학 및 신학석사 (M.Div./Th.M.)</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>프린스턴신학대학원 박사 (Ph.D.)</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>숭실대학교 기독교학과 교수 (2003-2026)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="py-16 px-6 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">우리가 하는 일</h2>
            <p className="text-gray-600">하나님 나라의 가치를 연구하고 세상과 소통합니다</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Research */}
            <div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">신학 연구</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                하나님 나라 신학을 깊이 연구하고, 성경의 가르침을 현대적 맥락에서 재조명합니다.
              </p>
            </div>

            {/* Communication */}
            <div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-violet-200 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center mb-4 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">문화/사회와 소통</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                문화, 사회, 과학 분야와 대화하며 하나님 나라의 가치를 세상과 나눕니다.
              </p>
            </div>

            {/* Spreading */}
            <div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-sky-200 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-4 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">복음 확산</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                연구 결과를 통해 하나님 나라 복음이 더 널리 전파되도록 힘씁니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Board Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">이사회</h2>
          </div>

          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
                  이사장
                </span>
                <span className="text-gray-900 font-medium">손영수 원장 (조은에스치과)</span>
              </div>

              <div className="flex flex-wrap items-start gap-2">
                <span className="px-3 py-1 bg-violet-600 text-white text-sm font-medium rounded-full shrink-0">
                  이사
                </span>
                <span className="text-gray-700">
                  김윤정, 박기형, 박상길, 서기태, 이재환, 한규승, 허신옥 박사/목사
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-gray-600 text-white text-sm font-medium rounded-full">
                  감사
                </span>
                <span className="text-gray-700">이명훈, 이호</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section
        id="support"
        className="py-16 px-6 bg-gradient-to-br from-blue-600 via-violet-600 to-purple-600"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-white mb-10">
            <h2 className="text-3xl font-bold mb-4">함께 해주세요</h2>
            <p className="text-white/80">하나님 나라를 향한 여정에 동참해 주세요</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Join Card */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">회원가입</h3>
              <p className="text-white/80 text-sm mb-6 leading-relaxed">
                하나님나라연구소의 회원이 되어 연구와 활동에 함께 참여해 주세요.
              </p>
              <Link
                href="/join"
                className="inline-flex items-center justify-center w-full h-9 px-4 rounded-lg bg-white text-blue-600 hover:bg-white/90 font-semibold transition-all"
              >
                회원가입 신청
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            {/* Donation Card */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">후원 안내</h3>
              <p className="text-white/80 text-sm mb-4 leading-relaxed">
                소중한 후원금은 연구 활동과 복음 확산에 사용됩니다.
              </p>
              <div className="bg-white/10 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3 text-white">
                  <CreditCard className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">카카오뱅크</p>
                    <p className="text-lg font-bold">7942-25-97234</p>
                    <p className="text-sm text-white/70">예금주: 박기형</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-6 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-4">연락처</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3">
                <Phone className="w-5 h-5" />
              </div>
              <p className="text-sm text-gray-400 mb-1">전화</p>
              <p className="font-medium">010-8981-0081</p>
              <p className="text-sm text-gray-500">(박기형)</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3">
                <Mail className="w-5 h-5" />
              </div>
              <p className="text-sm text-gray-400 mb-1">이메일</p>
              <p className="font-medium text-sm">dsplandp@naver.com</p>
              <p className="font-medium text-sm">yeeunee@naver.com</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3">
                <MapPin className="w-5 h-5" />
              </div>
              <p className="text-sm text-gray-400 mb-1">주소</p>
              <p className="font-medium text-sm leading-relaxed">
                서울 동작구 사당로 8, 3층
                <br />
                <span className="text-gray-500 text-xs">(7호선 숭실대입구역 4번 출구 60m)</span>
              </p>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-12 pt-8 border-t border-white/10 text-center">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} 하나님나라연구소. All rights reserved.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
