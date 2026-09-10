import Script from 'next/script'

export default function Head() {
	return (
		<head>
			<meta name='viewport' content='width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no' />
			<link rel='manifest' href='/manifest.json' />

			<link rel='icon' href='/favicon.png' />

			<Script src='https://www.googletagmanager.com/gtag/js?id=G-ZNSFR7C9PM' strategy='lazyOnload' />
			<Script id='google-analytics' strategy='lazyOnload'>
				{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'G-ZNSFR7C9PM');
        `}
			</Script>
			<script
				dangerouslySetInnerHTML={{
					__html: `
						(function() {
							try {
								var stored = localStorage.getItem('blog-theme');
								var theme = stored || 'system';
								var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
								if (isDark) {
									document.documentElement.classList.add('dark');
								} else {
									document.documentElement.classList.remove('dark');
								}
							} catch (e) {}
						})();
					`
				}}
			/>
		</head>
	)
}
