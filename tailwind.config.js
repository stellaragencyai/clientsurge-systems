/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["selector", "[data-client-surge-dark-disabled]"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		fontFamily: {
  			inter: ['Barlow', 'system-ui', 'sans-serif'],
  			display: ['Raleway', 'system-ui', 'sans-serif'],
  			titles: ['Raleway', 'system-ui', 'sans-serif'],
  			bebas: ['Raleway', 'system-ui', 'sans-serif'],
  			montserrat: ['Raleway', 'system-ui', 'sans-serif'],
  			barlow: ['Barlow', 'system-ui', 'sans-serif'],
  			raleway: ['Raleway', 'system-ui', 'sans-serif'],
  			sans: ['Barlow', 'system-ui', 'sans-serif'],
  		},
  		spacing: {
  			'0': '0px',
  			'1': 'var(--space-1)',   /* 4px */
  			'2': 'var(--space-2)',   /* 8px */
  			'3': 'var(--space-3)',   /* 12px */
  			'4': 'var(--space-4)',   /* 16px */
  			'5': '20px',
  			'6': 'var(--space-6)',   /* 24px */
  			'7': '28px',
  			'8': 'var(--space-8)',   /* 32px */
  			'9': '36px',
  			'10': '40px',
  			'11': '44px',
  			'12': 'var(--space-12)', /* 48px */
  			'14': '56px',
  			'16': 'var(--space-16)', /* 64px */
  			'20': '80px',
  			'24': '96px',
  			'32': '128px',
  			'40': '160px',
  			'48': '192px',
  			'64': '256px',
  			'px': '1px',
  			'0.5': '2px',
  			'1.5': '6px',
  			'2.5': '10px',
  			'3.5': '14px',
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
