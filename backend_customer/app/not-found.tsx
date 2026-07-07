// app/not-found.tsx
'use client';

export default function NotFound() {
  return (
    <div
      className="flex flex-col items-center justify-center w-full max-h-screen overflow-hidden"
      style={{
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
        height: '100vh',       // force the page to be exactly the viewport height
        maxHeight: '80vh',    // ensure it never grows beyond
      }}
    >
      {/* 404 Illustration */}
      <div className="w-48 h-48 sm:w-60 sm:h-60 md:w-72 md:h-72 mb-6">
        <img
          src="/404.png"
          alt="Page not found"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Subheading */}
      <p
        className="text-base sm:text-lg md:text-xl text-center max-w-md mb-6"
        style={{ color: 'var(--text)' }}
      >
        Oops! The page you are looking for doesn’t exist or has been moved.
      </p>
    </div>
  );
}