import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        midnight: {
          ink: "hsl(var(--color-midnight-ink))",
          violet: "hsl(var(--color-midnight-violet))",
        },
        canvas: {
          white: "hsl(var(--color-canvas-white))",
        },
        surface: {
          charcoal: "hsl(var(--color-surface-charcoal))",
        },
        ash: {
          DEFAULT: "hsl(var(--color-muted-ash))",
        },
        whisper: {
          gray: "hsl(var(--color-whisper-gray))",
        },
        taupe: {
          light: "hsl(var(--color-light-taupe))",
        },
        phoenix: {
          orange: "hsl(var(--color-phoenix-orange))",
        },
        cyan: {
          glow: "hsl(var(--color-cyan-glow))",
        },
        deep: {
          indigo: "hsl(var(--color-deep-indigo))",
        },
        soft: {
          pink: "hsl(var(--color-petal-pink))",
          mint: "hsl(var(--color-mint-green))",
          yellow: "hsl(var(--color-canary-yellow))",
          lavender: "hsl(var(--color-subtle-lavender))",
        },
        pillar: {
          gold: "hsl(var(--color-engagement-gold))",
          red: "hsl(var(--color-leadgen-red))",
          blue: "hsl(var(--color-intelligence-blue))",
          green: "hsl(var(--color-deliver-green))",
        },
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "4px",
        xl: "16px",
      },
      boxShadow: {
        'card': 'rgba(17, 17, 17, 0.02) 0px -6px 6px 0px, rgba(17, 17, 17, 0.01) 0px -23px 9px 0px',
        'elevated': 'rgba(17, 17, 17, 0.04) 0px 1px 2px 0px, rgba(17, 17, 17, 0.04) 0px 4px 8px 0px',
        'nav': 'rgba(17, 17, 17, 0.05) 0px 0px 1px 0px, rgba(17, 17, 17, 0.04) 1px 1px 1px 0px',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(40px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "float": "float 4s ease-in-out infinite",
        "fade-in": "fade-in 0.8s ease-out forwards",
        "fade-in-up": "fade-in-up 0.8s ease-out forwards",
        "shimmer": "shimmer 3s linear infinite",
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            '--tw-prose-body': 'hsl(var(--foreground))',
            '--tw-prose-headings': 'hsl(var(--foreground))',
            '--tw-prose-links': 'hsl(var(--foreground))',
            '--tw-prose-bold': 'hsl(var(--foreground))',
            '--tw-prose-counters': 'hsl(var(--muted-foreground))',
            '--tw-prose-bullets': 'hsl(var(--muted-foreground))',
            '--tw-prose-hr': 'hsl(var(--border))',
            '--tw-prose-quotes': 'hsl(var(--foreground))',
            '--tw-prose-quote-borders': 'hsl(var(--primary))',
            '--tw-prose-captions': 'hsl(var(--muted-foreground))',
            '--tw-prose-code': 'hsl(var(--foreground))',
            '--tw-prose-pre-code': 'hsl(var(--foreground))',
            '--tw-prose-pre-bg': 'hsl(var(--secondary))',
            '--tw-prose-th-borders': 'hsl(var(--border))',
            '--tw-prose-td-borders': 'hsl(var(--border))',
            h1: { fontFamily: 'Inter, ui-sans-serif, sans-serif', fontWeight: '700' },
            h2: { fontFamily: 'Inter, ui-sans-serif, sans-serif', fontWeight: '700' },
            h3: { fontFamily: 'Inter, ui-sans-serif, sans-serif', fontWeight: '600' },
            'h1 a, h2 a, h3 a, h4 a, h5 a, h6 a': {
              color: 'hsl(var(--primary))',
              textDecoration: 'none',
            },
            blockquote: {
              borderLeftColor: 'hsl(var(--primary) / 0.5)',
              fontStyle: 'normal',
            },
            code: {
              backgroundColor: 'hsl(var(--secondary))',
              padding: '0.2em 0.4em',
              borderRadius: '0.25rem',
              fontWeight: '400',
            },
          },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
}

export default config
