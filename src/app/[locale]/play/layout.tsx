export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        #main-nav { display: none !important; }
        #main-sidebar { display: none !important; }
        #main-content { padding: 0 !important; max-width: 100% !important; display: flex; flex-direction: column; min-height: 100vh;}
      `}</style>
      {children}
    </>
  );
}
