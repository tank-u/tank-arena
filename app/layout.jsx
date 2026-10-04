import './globals.css'

export const metadata = {
  title: 'Tank U - Local 4P Tank Battle',
  description: 'Local same-device 4-player multiplayer tank battle game with Phaser & Supabase',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  )
}
