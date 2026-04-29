import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // ===== 디자인 토큰 (D1 PM 합의 후 채움) =====
      colors: {
        // Primary
        primary: {
          50:  '#fef3ee',
          100: '#fde3d2',
          200: '#fbc4a4',
          300: '#f89d6b',
          400: '#f46b2f',
          500: '#f14d10', // 메인 브랜드
          600: '#e23408',
          700: '#bb2609',
          800: '#951f0f',
          900: '#781d10',
        },
        // Gray (neutral)
        gray: {
          50:  '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: [
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif',
        ],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
}

export default config
