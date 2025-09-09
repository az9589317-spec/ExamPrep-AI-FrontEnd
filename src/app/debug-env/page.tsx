
// src/app/debug-env/page.tsx
const DebugEnvPage = () => {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Firebase Configuration Check</h1>
      <p>
        The application is configured to use the following Firebase Project ID:
      </p>
      <pre
        style={{
          backgroundColor: '#f5f5f5',
          padding: '10px',
          borderRadius: '5px',
          border: '1px solid #ccc',
          color: '#333',
        }}
      >
        {projectId ? projectId : 'NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set!'}
      </pre>
      <p>
        Please compare this ID with the Project ID in your Firebase Console.
      </p>
    </div>
  );
};

export default DebugEnvPage;
