/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0fdfa',
                    100: '#ccfbf1',
                    200: '#99f6e4',
                    300: '#5eead4',
                    400: '#2dd4bf',
                    500: '#14b8a6',
                    600: '#0d9488',
                    700: '#0f766e',
                    800: '#115e59',
                    900: '#134e4a',
                    950: '#042f2e',
                },
                slate: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                },
                aurora: {
                    teal: '#0EA5A0',
                    deep: '#0D7377',
                    ice: '#3B82F6',
                    sage: '#10B981',
                    amber: '#F59E0B',
                    coral: '#EF4444',
                    lavender: '#8B5CF6',
                    rose: '#EC4899',
                    surface: '#F5F7FA',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                heading: ['Outfit', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'slide-up': 'slideUp 0.5s ease-out forwards',
                'slide-down': 'slideDown 0.4s ease-out forwards',
                'slide-left': 'slideLeft 0.5s ease-out forwards',
                'slide-right': 'slideRight 0.5s ease-out forwards',
                'scale-in': 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'gradient-x': 'gradient-x 15s ease infinite',
                'float': 'float 6s ease-in-out infinite',
                'float-delayed': 'float 6s ease-in-out 2s infinite',
                'float-slow': 'float 8s ease-in-out 1s infinite',
                'counter': 'counterPop 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'shimmer': 'shimmer 1.8s ease-in-out infinite',
                'glow-pulse': 'glowPulse 2s ease-in-out infinite',
                'spin-slow': 'spin 8s linear infinite',
                'status-pulse': 'statusPulse 2s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(24px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-24px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideLeft: {
                    '0%': { transform: 'translateX(-24px)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                slideRight: {
                    '0%': { transform: 'translateX(24px)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.92)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                counterPop: {
                    '0%': { transform: 'translateY(8px)', opacity: '0' },
                    '60%': { transform: 'translateY(-2px)', opacity: '1' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                glowPulse: {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(14, 165, 160, 0.3)' },
                    '50%': { boxShadow: '0 0 40px rgba(14, 165, 160, 0.6)' },
                },
                'gradient-x': {
                    '0%, 100%': { 'background-position': '0% 50%' },
                    '50%': { 'background-position': '100% 50%' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-12px)' },
                },
                statusPulse: {
                    '0%, 100%': { transform: 'scale(1)', opacity: '1' },
                    '50%': { transform: 'scale(1.3)', opacity: '0.7' },
                },
            },
            boxShadow: {
                'glass': '0 4px 24px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                'glass-hover': '0 8px 40px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
                'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06)',
                'glow-teal': '0 0 20px rgba(14, 165, 160, 0.3)',
                'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
                'glow-green': '0 0 20px rgba(16, 185, 129, 0.3)',
                'glow-purple': '0 0 20px rgba(139, 92, 246, 0.3)',
                'glow-rose': '0 0 20px rgba(236, 72, 153, 0.3)',
            },
            backdropBlur: {
                'glass': '24px',
                'glass-sm': '16px',
                'glass-xs': '8px',
            },
            transitionTimingFunction: {
                'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
                'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            },
        },
    },
    plugins: [],
}
