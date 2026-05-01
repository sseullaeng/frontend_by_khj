// Tailwind CSS 설정 파일: 커스텀 테마, 디자인 토큰, 확장 기능 설정
import type { Config } from 'tailwindcss'  // Tailwind 설정 타입

// Tailwind CSS 설정 객체
const config: Config = {
  // Tailwind CSS가 스캔할 파일 경로들
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  
  theme: {
    extend: {
      // ===== 디자인 토큰 (D1 PM 합의 후 채움) =====
      colors: {
        // Primary 컬러 팔레트: 브랜드 메인 컬러 및 파생 색상
        primary: {
          50:  '#fef3ee',  // 가장 밝은 파생색
          100: '#fde3d2',
          200: '#fbc4a4',
          300: '#f89d6b',
          400: '#f46b2f',
          500: '#f14d10', // 메인 브랜드 컬러
          600: '#e23408',
          700: '#bb2609',
          800: '#951f0f',
          900: '#781d10',  // 가장 어두운 파생색
        },
        // Gray 컬러 팔레트: 중성 색상 (텍스트, 배경, 테두리 등)
        gray: {
          50:  '#f9fafb',  // 가장 밝은 회색
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',  // 가장 어두운 회색
        },
      },
      
      // 폰트 패밀리 설정: Pretendard 폰트 우선 적용
      fontFamily: {
        sans: [
          'Pretendard',        // 한국어 최적화 폰트
          '-apple-system',     // Apple 시스템 폰트
          'BlinkMacSystemFont', // macOS 시스템 폰트
          'system-ui',        // 시스템 기본 폰트
          'sans-serif',       // 기본 산세리프 폰트
        ],
      },
      
      // 테두리 라운드 설정: 기본값 및 크기별 라운드
      borderRadius: {
        DEFAULT: '8px',  // 기본 라운드
        lg: '12px',      // 큰 라운드
        xl: '16px',      // 더 큰 라운드
        '2xl': '20px',   // 가장 큰 라운드
      },
    },
  },
  
  // Tailwind 플러그인 설정 (현재는 없음)
  plugins: [],
}

export default config
