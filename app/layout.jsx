import './globals.css';

export const metadata = {
  title: 'OpsTask Pro',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
