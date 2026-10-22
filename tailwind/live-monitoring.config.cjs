/* Tailwind build for the Live Monitoring dashboard (standalone page, so preflight is ON).
   Colour VALUES live in public/live-monitoring/css/live-monitoring.src.css (dark + light);
   this file only maps the token NAMES. Rebuild with: npm run build:css:monitoring */
module.exports={
  content:['./public/live-monitoring/index.html','./public/live-monitoring/js/*.js'],
  theme:{extend:{
    colors:{
      'surface-dark':'rgb(var(--lm-surface-dark) / <alpha-value>)',
      'surface-dark-dim':'rgb(var(--lm-surface-dark-dim) / <alpha-value>)',
      'surface-dark-bright':'rgb(var(--lm-surface-dark-bright) / <alpha-value>)',
      'surface-container-dark':'rgb(var(--lm-surface-container-dark) / <alpha-value>)',
      'surface-container-lowest':'rgb(var(--lm-surface-container-lowest) / <alpha-value>)',
      'surface-container':'rgb(var(--lm-surface-container) / <alpha-value>)',
      'surface-container-high':'rgb(var(--lm-surface-container-high) / <alpha-value>)',
      'surface-container-highest-dark':'rgb(var(--lm-surface-container-highest-dark) / <alpha-value>)',
      'outline':'rgb(var(--lm-outline) / <alpha-value>)',
      'outline-variant':'rgb(var(--lm-outline-variant) / <alpha-value>)',
      'outline-dark':'rgb(var(--lm-outline-dark) / <alpha-value>)',
      'on-surface':'rgb(var(--lm-on-surface) / <alpha-value>)',
      'on-surface-variant':'rgb(var(--lm-on-surface-variant) / <alpha-value>)',
      'primary':'rgb(var(--lm-primary) / <alpha-value>)',
      'primary-container':'rgb(var(--lm-primary-container) / <alpha-value>)',
      'on-primary-container':'rgb(var(--lm-on-primary-container) / <alpha-value>)',
      'on-primary':'rgb(var(--lm-on-primary) / <alpha-value>)',
      'secondary':'rgb(var(--lm-secondary) / <alpha-value>)',
      'secondary-container':'rgb(var(--lm-secondary-container) / <alpha-value>)',
      'accent-teal-bright':'rgb(var(--lm-accent-teal-bright) / <alpha-value>)',
      'accent-lavender':'rgb(var(--lm-accent-lavender) / <alpha-value>)',
      'warning-dark':'rgb(var(--lm-warning-dark) / <alpha-value>)',
      'error':'rgb(var(--lm-error) / <alpha-value>)',
      'error-container':'rgb(var(--lm-error-container) / <alpha-value>)'
    },
    borderRadius:{DEFAULT:'0.125rem',lg:'0.25rem',xl:'0.5rem',full:'9999px'},
    fontFamily:{
      sans:['Plus Jakarta Sans','system-ui','-apple-system','Segoe UI','sans-serif'],
      mono:['JetBrains Mono','ui-monospace','Menlo','Consolas','monospace']
    },
    fontSize:{
      'display-lg':['36px',{lineHeight:'44px',letterSpacing:'-0.025em',fontWeight:'800'}],
      'headline-lg':['20px',{lineHeight:'28px',letterSpacing:'-0.015em',fontWeight:'700'}],
      'headline-md':['18px',{lineHeight:'24px',letterSpacing:'-0.01em',fontWeight:'700'}],
      'title-md':['16px',{lineHeight:'24px',fontWeight:'600'}],
      'body-md':['14px',{lineHeight:'22px',fontWeight:'400'}],
      'body-sm':['13px',{lineHeight:'18px',fontWeight:'400'}],
      'label-md':['12px',{lineHeight:'16px',letterSpacing:'0.05em',fontWeight:'600'}],
      'label-sm':['10px',{lineHeight:'14px',letterSpacing:'0.08em',fontWeight:'600'}]
    }
  }},
  plugins:[]
};
