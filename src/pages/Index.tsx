import { useState } from "react";
import { Download, Youtube, Music, Video, FileAudio, Zap, Shield, Globe } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState<"mp3" | "mp4">("mp3");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    title: string;
    thumbnail: string;
    duration: string;
    quality: string;
    format: "mp3" | "mp4";
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
        quality: format === "mp3" ? "320 kbps" : "1080p HD",
        format: format
      });
      setIsLoading(false);
      toast({
        title: "Готово!",
        description: `${format.toUpperCase()} файл готов к скачиванию`,
      });
    }, 2000);
  };

  const handleDownload = () => {
    toast({
      title: "Скачивание начато",
      description: `${result?.format.toUpperCase()} файл загружается...`,
    });
  };

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-animated"></div>
      
      {/* Main Content */}
      <main className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-8 animate-fade-in-up">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="p-3 rounded-full bg-gradient-to-r from-primary to-secondary animate-glow-pulse">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                You2All
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Конвертируйте YouTube видео в MP3 или MP4 за считанные секунды
            </p>
          </div>

          {/* Format Selector */}
          <div className="card-elegant p-4">
            <div className="flex items-center justify-center space-x-4">
              <span className="text-sm text-muted-foreground">Выберите формат:</span>
              <div className="flex bg-input rounded-[var(--radius)] p-1">
                <button
                  type="button"
                  onClick={() => setFormat("mp3")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-[calc(var(--radius)-4px)] transition-all ${
                    format === "mp3" 
                      ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow-primary)]" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileAudio className="w-4 h-4" />
                  <span>MP3</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormat("mp4")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-[calc(var(--radius)-4px)] transition-all ${
                    format === "mp4" 
                      ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow-primary)]" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span>MP4</span>
                </button>
              </div>
            </div>
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
                  <div className="flex items-center space-x-2 mt-2">
                    {result.format === "mp3" ? (
                      <FileAudio className="w-4 h-4 text-primary" />
                    ) : (
                      <Video className="w-4 h-4 text-primary" />
                    )}
                    <span className="text-xs text-primary font-medium">
                      {result.format.toUpperCase()} формат
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleDownload}
                  className="btn-glow-secondary flex items-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Скачать {result.format.toUpperCase()}</span>
                </button>
              </div>
            </div>
          )}

          {/* Scroll to Features Button */}
          <div className="text-center mt-16">
            <button
              onClick={scrollToFeatures}
              className="btn-glow-secondary flex items-center space-x-2 mx-auto"
            >
              <Zap className="w-5 h-5" />
              <span>Узнать больше</span>
            </button>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
              Почему выбирают You2All?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Самый быстрый и надёжный способ конвертировать YouTube видео в любой формат
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { 
                icon: Zap, 
                title: "Молниеносная скорость", 
                desc: "Конвертация за секунды без ожидания",
                color: "from-yellow-500 to-orange-500"
              },
              { 
                icon: Shield, 
                title: "Полная безопасность", 
                desc: "Никаких вирусов и регистрации",
                color: "from-green-500 to-emerald-500"
              },
              { 
                icon: FileAudio, 
                title: "MP3 высокого качества", 
                desc: "До 320 kbps для лучшего звучания",
                color: "from-purple-500 to-pink-500"
              },
              { 
                icon: Video, 
                title: "Видео в HD качестве", 
                desc: "Скачивайте в разрешении до 1080p",
                color: "from-blue-500 to-cyan-500"
              },
              { 
                icon: Globe, 
                title: "Работает везде", 
                desc: "На любом устройстве и в любом браузере",
                color: "from-indigo-500 to-purple-500"
              },
              { 
                icon: Download, 
                title: "Без ограничений", 
                desc: "Скачивайте сколько угодно файлов",
                color: "from-teal-500 to-green-500"
              }
            ].map((feature, index) => (
              <div key={index} className="card-elegant p-6 text-center hover:scale-105 transition-transform duration-300">
                <div className={`inline-flex p-3 rounded-full bg-gradient-to-r ${feature.color} mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-lg mb-2">{feature.title}</h4>
                <p className="text-muted-foreground text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-4 border-t border-border/50">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-muted-foreground">
            © 2024 You2All. Быстрое и качественное конвертирование видео.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;