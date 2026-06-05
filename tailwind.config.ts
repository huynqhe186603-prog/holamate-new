import type { Config } from 'tailwindcss'

function hsl(variable: string) {
  return `hsl(var(${variable}))`
}

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: hsl('--border'),
        input: hsl('--input'),
        ring: hsl('--ring'),
        background: hsl('--background'),
        foreground: hsl('--foreground'),
        primary: {
          DEFAULT: hsl('--primary'),
          foreground: hsl('--primary-foreground'),
        },
        secondary: {
          DEFAULT: hsl('--secondary'),
          foreground: hsl('--secondary-foreground'),
        },
        destructive: {
          DEFAULT: hsl('--destructive'),
          foreground: hsl('--destructive-foreground'),
        },
        muted: {
          DEFAULT: hsl('--muted'),
          foreground: hsl('--muted-foreground'),
        },
        accent: {
          DEFAULT: hsl('--accent'),
          foreground: hsl('--accent-foreground'),
        },
        popover: {
          DEFAULT: hsl('--popover'),
          foreground: hsl('--popover-foreground'),
        },
        card: {
          DEFAULT: hsl('--card'),
          foreground: hsl('--card-foreground'),
        },
        brand: {
          DEFAULT: hsl('--brand'),
          hover: hsl('--brand-hover'),
          light: hsl('--brand-light'),
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [],
}

export default config
