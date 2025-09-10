import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-6 animate-fade-in-up">
        <div className="flex items-center justify-center mb-6">
          <div className="p-4 rounded-full bg-gradient-to-r from-primary to-secondary animate-glow-pulse">
            <AlertCircle className="w-12 h-12 text-white" />
          </div>
        </div>
        <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          404
        </h1>
        <p className="text-xl text-muted-foreground mb-6">
          Страница не найдена
        </p>
        <a 
          href="/" 
          className="btn-glow-primary inline-flex items-center space-x-2"
        >
          <Home className="w-5 h-5" />
          <span>Вернуться на главную</span>
        </a>
      </div>
    </main>
  );
};

export default NotFound;
