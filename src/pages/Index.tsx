import { useState } from "react";
import { Download, Youtube, Music } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    title: string;
    thumbnail: string;
    duration: string;
    quality: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите ссылку на YouTube видео",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Симуляция API запроса
    setTimeout(() => {
      setResult({
        title: "Example Song - Artist Name",
        thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
        duration: "3:32",
        quality: "320 kbps"
      });
      setIsLoading(false);
      toast({
        title: "Готово!",
        description: "MP3 файл готов к скачиванию",
      });
    }, 2000);
  };

  const handleDownload = () => {
    toast({
      title: "Скачивание начато",
      description: "MP3 файл загружается...",
    });
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="p-3 rounded-full bg-gradient-to-r from-primary to-secondary animate-glow-pulse">
              <Music className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              YouTube to MP3
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Быстрое и качественное конвертирование YouTube видео в MP3
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="card-input">
          <div className="flex items-center space-x-4">
            <Youtube className="w-6 h-6 text-muted-foreground flex-shrink-0" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Вставьте ссылку на YouTube видео..."
              className="input-smooth"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="btn-glow-primary flex-shrink-0"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>

        {/* Result Card */}
        {result && (
          <div className="card-elegant p-6 animate-fade-in-up">
            <div className="flex items-center space-x-4">
              <img
                src={result.thumbnail}
                alt={result.title}
                className="w-20 h-20 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{result.title}</h3>
                <p className="text-muted-foreground text-sm">
                  Длительность: {result.duration} • Качество: {result.quality}
                </p>
              </div>
              <button
                onClick={handleDownload}
                className="btn-glow-secondary flex items-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>Скачать MP3</span>
              </button>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
          {[
            { 
              icon: Music, 
              title: "Высокое качество", 
              desc: "До 320 kbps" 
            },
            { 
              icon: Download, 
              title: "Быстрая конвертация", 
              desc: "За несколько секунд" 
            },
            { 
              icon: Youtube, 
              title: "Поддержка YouTube", 
              desc: "Любые видео" 
            }
          ].map((feature, index) => (
            <div key={index} className="card-elegant p-4 text-center">
              <feature.icon className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h4 className="font-semibold mb-1">{feature.title}</h4>
              <p className="text-muted-foreground text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Index;