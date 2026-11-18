import { AuthInitializer } from './features/auth/components/AuthInitializer';
import { AppRouter } from './routes/AppRouter';

function App() {
  return (
    <AuthInitializer>
      <AppRouter />
    </AuthInitializer>
  );
}

export default App;