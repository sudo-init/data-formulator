/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Custom colors for Data Formulator theme
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Default blue
          600: '#1976d2', // MUI primary.main equivalent
          700: '#1565c0',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          500: '#8e24aa', // MUI purple[700]
          600: '#7b1fa2',
          700: '#6a1b9a',
        },
        derived: {
          500: '#f9a825', // MUI yellow[700]
          600: '#f57f17',
          700: '#ff8f00',
        },
        custom: {
          500: '#ff9800', // MUI orange[700]
          600: '#f57c00',
          700: '#ef6c00',
        },
      },
      
      // Custom fonts
      fontFamily: {
        sans: ['Arial', 'Roboto', 'Helvetica Neue', 'sans-serif'],
      },
      
      // Custom spacing for grid layouts
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // Custom breakpoints for responsive design
      screens: {
        'xs': '475px',
        '3xl': '1600px',
      },
      
      // Animation for smooth transitions
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 0.6s ease-in-out',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      
      // Box shadows for cards and components
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 12px rgba(0, 0, 0, 0.1)',
        'strong': '0 8px 24px rgba(0, 0, 0, 0.15)',
      },
      
      // Border radius for consistent styling
      borderRadius: {
        'xl': '0.875rem',
        '2xl': '1.125rem',
      },
      
      // Z-index scale for layering
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  
  plugins: [
    // Forms plugin for better form styling
    require('@tailwindcss/forms'),
    
    // Typography plugin for rich text content
    require('@tailwindcss/typography'),
    
    // Custom plugin for Data Formulator specific utilities
    function({ addUtilities, addComponents, theme }) {
      // Custom utilities for the application
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.text-balance': {
          'text-wrap': 'balance',
        },
      })
      
      // Custom components for common patterns
      addComponents({
        '.btn-primary': {
          backgroundColor: theme('colors.primary.600'),
          color: theme('colors.white'),
          padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
          borderRadius: theme('borderRadius.md'),
          fontWeight: theme('fontWeight.medium'),
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: theme('colors.primary.700'),
            transform: 'translateY(-1px)',
          },
          '&:focus': {
            outline: 'none',
            boxShadow: `0 0 0 3px ${theme('colors.primary.200')}`,
          },
        },
        
        '.card': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.lg'),
          boxShadow: theme('boxShadow.soft'),
          border: `1px solid ${theme('colors.gray.200')}`,
          overflow: 'hidden',
        },
        
        '.split-pane': {
          display: 'flex',
          height: '100%',
          position: 'relative',
        },
        
        '.split-pane-resizer': {
          backgroundColor: theme('colors.gray.300'),
          cursor: 'col-resize',
          width: '2px',
          opacity: '0.5',
          '&:hover': {
            opacity: '1',
          },
        },
      })
    },
  ],
  
  // Safelist for dynamic classes that might be purged
  safelist: [
    'ag-theme-alpine',
    'vega-embed',
    'vega-chart-container',
    // MUI classes during migration
    'MuiButton-root',
    'MuiPaper-root',
    'MuiDialog-paper',
    // Chart-related classes
    'mark-rect',
    'mark-line',
    'mark-point',
    'mark-bar',
  ],
}