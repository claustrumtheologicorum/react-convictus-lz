import './globals.css';

export default function RootLayout({children}:{children:React.ReactNode}) {
  return (
    <html lang="fi">
      <body>{children}</body>
    </html>
  );
}
