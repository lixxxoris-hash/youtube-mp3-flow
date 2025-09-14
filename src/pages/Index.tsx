import { useState, useEffect, useRef } from "react";
import { Download, Youtube, Music, Video, FileAudio, Zap, Shield, Globe, Clock, User, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState<"mp3" | "mp4">("mp3");
  const [quality, setQuality] = useState<"720p" | "1080p" | "1440p" | "2160p">("1080p");
  const [isLoading, setIsLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState<{
    title: string;
    thumbnail: string;
    duration: number;
    uploader: string;
    view_count: number;
  } | null>(null);
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<{
    status: string;
    progress: number;
    message: string;
    filename?: string;
  } | null>(null);
  const [notificationsShown, setNotificationsShown] = useState<{
    completed: boolean;
    error: boolean;
  }>({ completed: false, error: false });

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
    setVideoInfo(null);
    setDownloadProgress(null);
    setNotificationsShown({ completed: false, error: false });
    
    try {
      // Получаем информацию о видео
      const infoResponse = await fetch('http://localhost:5000/api/info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
        mode: 'cors',
        signal: AbortSignal.timeout(15000), // 15 секунд таймаут
      });
      
      const infoData = await infoResponse.json();
      
      if (!infoData.success) {
        throw new Error(infoData.error || 'Ошибка получения информации');
      }
      
      setVideoInfo(infoData.data);
      
      // Начинаем скачивание
      const downloadResponse = await fetch('http://localhost:5000/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, format, quality }),
        mode: 'cors',
        signal: AbortSignal.timeout(15000), // 15 секунд таймаут
      });
      
      const downloadData = await downloadResponse.json();
      
      if (!downloadData.success) {
        throw new Error(downloadData.error || 'Ошибка начала скачивания');
      }
      
      setDownloadId(downloadData.download_id);
      
      toast({
        title: "Скачивание начато",
        description: `${format.toUpperCase()} файл загружается...`,
      });
      
    } catch (error) {
      let errorMessage = "Произошла ошибка";
      
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          errorMessage = "Превышено время ожидания. Попробуйте еще раз.";
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = "Не удается подключиться к серверу. Проверьте, что API сервер запущен.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Отслеживание прогресса скачивания с поддержкой отмены и экспоненциальным бэкоффом
  const pollControllerRef = useRef<AbortController | null>(null);
  const pollTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!downloadId) return;

    let isActive = true;
    let attempts = 0;
    let delay = 1000; // ms
    const maxAttempts = 20;

    const poll = async () => {
      if (!isActive) return;
      attempts++;

      // Abort previous controller
      pollControllerRef.current?.abort();
      const controller = new AbortController();
      pollControllerRef.current = controller;

      try {
        const resp = await fetch(`http://localhost:5000/api/progress/${downloadId}`, {
          signal: controller.signal,
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();

        if (!isActive) return;

        if (data.error) {
          setDownloadProgress({ status: 'error', progress: 0, message: data.error });
          toast({ title: 'Ошибка', description: data.error, variant: 'destructive' });
          return;
        }

        setDownloadProgress(data);
        attempts = 0; // reset on success
        delay = 1000;

        if (data.status === 'completed') {
          if (!notificationsShown.completed) {
            setNotificationsShown(prev => ({ ...prev, completed: true }));
            toast({ title: 'Загрузка завершена', description: `Файл ${format.toUpperCase()} готов к скачиванию` });
          }
          return;
        }

        if (data.status === 'failed' || data.status === 'error') {
          if (!notificationsShown.error) {
            setNotificationsShown(prev => ({ ...prev, error: true }));
            toast({ title: 'Ошибка скачивания', description: data.message || data.error, variant: 'destructive' });
          }
          return;
        }

        // schedule next poll
        const nextDelay = Math.min(5000, delay * 1.5);
        delay = nextDelay;
        pollTimeoutRef.current = window.setTimeout(poll, nextDelay);

      } catch (err: any) {
        if (!isActive) return;
        console.error('Poll error', err);
        if (err.name === 'AbortError') return; // cancelled

        attempts++;
        if (attempts >= maxAttempts) {
          setDownloadProgress({ status: 'error', progress: downloadProgress?.progress ?? 0, message: 'Не удалось получить статус загрузки. Попробуйте снова.' });
          toast({ title: 'Ошибка', description: 'Не удалось получить статус загрузки после нескольких попыток.', variant: 'destructive' });
          return;
        }

        // exponential backoff retry
        delay = Math.min(10000, delay * 1.5);
        pollTimeoutRef.current = window.setTimeout(poll, delay);
      }
    };

    poll();

    return () => {
      isActive = false;
      pollControllerRef.current?.abort();
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, [downloadId, format, notificationsShown]);

  const handleDownload = async () => {
    if (!downloadId) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/download/${downloadId}`, {
        signal: AbortSignal.timeout(15000), // 15 секунд таймаут
      });
      
      if (!response.ok) {
        // Если это JSON с ошибкой, прочитаем его
        if (response.headers.get('content-type')?.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка получения файла');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Получаем имя файла из заголовка
      const contentDisposition = response.headers.get('content-disposition');
      const filenameMatch = contentDisposition?.match(/filename=([^;]+)/);
      const filename = filenameMatch ? filenameMatch[1].replace(/["']/g, '') : `download.${format}`;
      
      // Получаем блоб
      const blob = await response.blob();
      
      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Очищаем
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Скачивание завершено",
        description: `Файл ${filename} сохранен`,
      });
    } catch (error) {
      let errorMessage = "Ошибка при скачивании файла";
      
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          errorMessage = "Превышено время ожидания. Попробуйте еще раз.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    }
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

          {/* Format and Quality Selector Container */}
          <div className="relative">
            {/* Format Selector */}
            <div className="card-elegant p-6">
              <div className="flex items-center justify-center space-x-6">
                <span className="text-lg font-medium text-muted-foreground">Выберите формат:</span>
                <div className="flex bg-input/50 rounded-[var(--radius)] p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setFormat("mp3");
                      // Сбрасываем состояние при смене формата
                      setDownloadId(null);
                      setDownloadProgress(null);
                      setNotificationsShown({ completed: false, error: false });
                    }}
                    className={`flex items-center space-x-3 px-6 py-3 rounded-[calc(var(--radius)-4px)] transition-all text-lg font-semibold ${
                      format === "mp3" 
                        ? "bg-primary/80 text-primary-foreground shadow-[var(--shadow-glow-primary)] backdrop-blur-sm" 
                        : "text-muted-foreground hover:text-foreground hover:bg-input/30"
                    }`}
                  >
                    <FileAudio className="w-5 h-5" />
                    <span>MP3</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormat("mp4");
                      // Сбрасываем состояние при смене формата
                      setDownloadId(null);
                      setDownloadProgress(null);
                      setNotificationsShown({ completed: false, error: false });
                    }}
                    className={`flex items-center space-x-3 px-6 py-3 rounded-[calc(var(--radius)-4px)] transition-all text-lg font-semibold ${
                      format === "mp4" 
                        ? "bg-primary/80 text-primary-foreground shadow-[var(--shadow-glow-primary)] backdrop-blur-sm" 
                        : "text-muted-foreground hover:text-foreground hover:bg-input/30"
                    }`}
                  >
                    <Video className="w-5 h-5" />
                    <span>MP4</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quality Selector - только для MP4 */}
            {format === "mp4" && (
              <div className="absolute top-0 left-full ml-4 card-elegant p-6 animate-slide-from-right whitespace-nowrap">
                <div className="flex items-center justify-center space-x-6">
                  <span className="text-lg font-medium text-muted-foreground">Выберите качество:</span>
                  <div className="flex bg-input/50 rounded-[var(--radius)] p-1">
                    <button
                      type="button"
                      onClick={() => setQuality("720p")}
                      className={`flex items-center space-x-2 px-5 py-3 rounded-[calc(var(--radius)-4px)] transition-all text-lg font-semibold ${
                        quality === "720p" 
                          ? "bg-primary/80 text-primary-foreground shadow-[var(--shadow-glow-primary)] backdrop-blur-sm" 
                          : "text-muted-foreground hover:text-foreground hover:bg-input/30"
                      }`}
                    >
                      <span>720p</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuality("1080p")}
                      className={`flex items-center space-x-2 px-5 py-3 rounded-[calc(var(--radius)-4px)] transition-all text-lg font-semibold ${
                        quality === "1080p" 
                          ? "bg-primary/80 text-primary-foreground shadow-[var(--shadow-glow-primary)] backdrop-blur-sm" 
                          : "text-muted-foreground hover:text-foreground hover:bg-input/30"
                      }`}
                    >
                      <span>1080p</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuality("1440p")}
                      className={`flex items-center space-x-2 px-5 py-3 rounded-[calc(var(--radius)-4px)] transition-all text-lg font-semibold ${
                        quality === "1440p" 
                          ? "bg-primary/80 text-primary-foreground shadow-[var(--shadow-glow-primary)] backdrop-blur-sm" 
                          : "text-muted-foreground hover:text-foreground hover:bg-input/30"
                      }`}
                    >
                      <span>1440p</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuality("2160p")}
                      className={`flex items-center space-x-2 px-5 py-3 rounded-[calc(var(--radius)-4px)] transition-all text-lg font-semibold ${
                        quality === "2160p" 
                          ? "bg-primary/80 text-primary-foreground shadow-[var(--shadow-glow-primary)] backdrop-blur-sm" 
                          : "text-muted-foreground hover:text-foreground hover:bg-input/30"
                      }`}
                    >
                      <span>2160p</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
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

          {/* Video Info Card */}
          {videoInfo && (
            <div className="card-elegant p-6 animate-fade-in-up">
              <div className="flex items-center space-x-4">
                <img
                  src={videoInfo.thumbnail}
                  alt={videoInfo.title}
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{videoInfo.title}</h3>
                  <div className="flex items-center space-x-4 text-muted-foreground text-sm mb-2">
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{videoInfo.uploader}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{Math.floor(videoInfo.duration / 60)}:{(videoInfo.duration % 60).toString().padStart(2, '0')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{videoInfo.view_count.toLocaleString()} просмотров</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    {format === "mp3" ? (
                      <FileAudio className="w-4 h-4 text-primary" />
                    ) : (
                      <Video className="w-4 h-4 text-primary" />
                    )}
                    <span className="text-xs text-primary font-medium">
                      {format.toUpperCase()} {format === "mp4" ? quality : "формат"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Download Progress */}
          {downloadProgress && (
            <div className="card-elegant p-6 animate-fade-in-up">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Статус скачивания</h3>
                  <div className="flex items-center space-x-2">
                    {downloadProgress.status === 'downloading' && (
                      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    )}
                    {downloadProgress.status === 'completed' && (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">OK</span>
                      </div>
                    )}
                    {downloadProgress.status === 'error' && (
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">!</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground">{downloadProgress.message}</p>
                    {downloadProgress.status === 'downloading' && (
                      <span className="text-sm text-primary font-medium">
                        {downloadProgress.progress}%
                      </span>
                    )}
                  </div>
                  
                  {downloadProgress.status === 'downloading' && (
                    <div className="w-full bg-muted/50 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-primary via-secondary to-primary h-3 rounded-full transition-all duration-500 ease-out relative"
                        style={{ width: `${downloadProgress.progress}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                      </div>
                    </div>
                  )}
                </div>
                
                {downloadProgress.status === 'completed' && (
                  <button
                    onClick={handleDownload}
                    className="btn-glow-secondary flex items-center space-x-2 w-full justify-center"
                  >
                    <Download className="w-5 h-5" />
                    <span>Скачать {format.toUpperCase()}</span>
                  </button>
                )}
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