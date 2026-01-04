import React, { useRef, useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { PromptItem, PromptVersion, User } from '../types';
import { Icons } from './Icons';

interface PromptShareModalProps {
    prompt: PromptItem;
    version: PromptVersion;
    user: User | null;
    onClose: () => void;
}

export const PromptShareModal: React.FC<PromptShareModalProps> = ({ prompt, version, user, onClose }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    const shareUrl = `${window.location.origin}${window.location.pathname}${window.location.hash}`;

    /**
     * 将远程图片加载为 Base64 Data URL，解决跨域问题
     * 优先尝试 canvas 方式，失败则使用 fetch 代理
     */
    const loadImageAsDataUrl = async (imageUrl: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                try {
                    // 尝试使用 canvas 转换
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        throw new Error('无法获取 canvas context');
                    }
                    ctx.drawImage(img, 0, 0);
                    // 尝试读取像素数据，如果 CORS 被阻止会抛出异常
                    ctx.getImageData(0, 0, 1, 1);
                    const dataUrl = canvas.toDataURL('image/png');
                    resolve(dataUrl);
                } catch (e) {
                    // Canvas CORS 失败，尝试 fetch 代理
                    console.warn('Canvas CORS 失败，尝试 fetch 代理:', e);
                    fetchImageAsDataUrl(imageUrl).then(resolve).catch(reject);
                }
            };

            img.onerror = () => {
                // 图片加载失败，尝试 fetch 代理
                console.warn('图片直接加载失败，尝试 fetch 代理');
                fetchImageAsDataUrl(imageUrl).then(resolve).catch(reject);
            };

            img.src = imageUrl;
        });
    };

    /**
     * 使用 fetch 获取图片并转换为 Base64
     */
    const fetchImageAsDataUrl = async (imageUrl: string): Promise<string> => {
        try {
            const response = await fetch(imageUrl, {
                mode: 'cors',
                credentials: 'omit',
            });
            if (!response.ok) {
                throw new Error(`Fetch 失败: ${response.status}`);
            }
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.error('Fetch 代理也失败:', e);
            throw new Error('无法加载图片，请检查网络连接');
        }
    };

    // 预加载的图片 Data URL
    const [preloadedImageUrl, setPreloadedImageUrl] = useState<string | null>(null);
    const [imageLoadError, setImageLoadError] = useState<string | null>(null);

    // 在组件挂载时预加载图片
    useEffect(() => {
        if (version.imageUrl) {
            setImageLoadError(null);
            loadImageAsDataUrl(version.imageUrl)
                .then(dataUrl => {
                    setPreloadedImageUrl(dataUrl);
                })
                .catch(err => {
                    console.error('预加载图片失败:', err);
                    setImageLoadError(err.message || '图片加载失败');
                    // 即使失败，也设置原始 URL 作为降级
                    setPreloadedImageUrl(version.imageUrl || null);
                });
        }
    }, [version.imageUrl]);

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setIsGenerating(true);
        try {
            // 给浏览器一点渲染时间，确保所有样式和二维码都已就绪
            await new Promise(resolve => setTimeout(resolve, 300));

            const cardElement = cardRef.current;
            if (!cardElement || cardElement.offsetWidth === 0) {
                throw new Error('卡片容器尚未准备好，请稍后重试');
            }

            // 如果有图片但预加载失败，给用户一个警告但仍尝试继续
            if (version.imageUrl && imageLoadError) {
                console.warn('图片预加载有问题，尝试继续生成:', imageLoadError);
            }

            // 确保字体已加载
            await document.fonts?.ready;

            // 等待所有图片加载完成
            const images = Array.from(cardElement.querySelectorAll('img')) as HTMLImageElement[];
            await Promise.all(
                images.map(img => {
                    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
                    return new Promise<void>((resolve) => {
                        const timeout = setTimeout(() => {
                            console.warn('图片加载超时:', img.src);
                            resolve();
                        }, 5000);
                        img.onload = () => {
                            clearTimeout(timeout);
                            resolve();
                        };
                        img.onerror = () => {
                            clearTimeout(timeout);
                            console.warn('图片加载失败:', img.src);
                            resolve();
                        };
                    });
                })
            );

            const width = cardElement.offsetWidth || 400;
            const height = cardElement.offsetHeight || 600;
            const scale = Math.max(window.devicePixelRatio || 1, 3);

            const canvas = await html2canvas(cardElement, {
                useCORS: true,
                allowTaint: false,
                backgroundColor: '#0f172a',
                scale,
                logging: false,
                width,
                height,
                windowWidth: width,
                windowHeight: height,
                scrollX: 0,
                scrollY: 0,
                onclone: (clonedDoc, clonedElement) => {
                    clonedElement.style.transform = 'none';
                    clonedElement.style.margin = '0';
                    clonedElement.style.position = 'relative';
                    clonedElement.style.top = '0';
                    clonedElement.style.left = '0';

                    const image = clonedElement.querySelector('[data-share-image="true"]') as HTMLImageElement | null;
                    if (image) {
                        // 使用预加载的 Data URL (已经过 CORS 处理) 替换原图片
                        const imageToUse = preloadedImageUrl || image.src;
                        image.crossOrigin = 'anonymous';
                        if (imageToUse && image.src !== imageToUse) {
                            image.src = imageToUse;
                        }
                        image.style.display = 'block';
                        image.style.visibility = 'visible';
                        image.style.opacity = '1';
                        image.style.width = '100%';
                        image.style.height = '100%';
                        image.style.objectFit = 'cover';

                        // 始终使用背景图方式，避免 img 标签的 CORS 问题
                        // 隐藏原图片元素，防止 html2canvas 尝试绘制它
                    }

                    clonedElement
                        .querySelectorAll('[data-share-text="true"]')
                        .forEach((node) => {
                            (node as HTMLElement).style.transform = 'translateY(-6px)';
                        });

                    // 修复 html2canvas 不支持 oklab/oklch 的问题
                    const allElements = clonedElement.querySelectorAll('*');
                    allElements.forEach(el => {
                        const element = el as HTMLElement;
                        const computedStyle = clonedDoc.defaultView?.getComputedStyle(element) || window.getComputedStyle(element);
                        const properties = ['color', 'backgroundColor', 'borderColor', 'fill', 'stroke', 'backgroundImage'];

                        if (computedStyle.backgroundImage !== 'none') {
                            const rect = element.getBoundingClientRect();
                            if (rect.width < 1 || rect.height < 1) {
                                element.style.setProperty('background-image', 'none', 'important');
                            }
                        }

                        properties.forEach(prop => {
                            const value = computedStyle.getPropertyValue(prop === 'backgroundColor' ? 'background-color' : prop === 'borderColor' ? 'border-color' : prop);
                            if (value && (value.includes('oklch') || value.includes('oklab'))) {
                                // 如果发现 oklab/oklch，尝试强制降级为 rgb (通过设置一个简单的值)
                                // 或者如果它是一个渐变，我们在这里可以简化处理
                                if (value.includes('gradient')) {
                                    element.style.setProperty(prop, 'none', 'important');
                                } else {
                                    // 简单的正则替换，如果能找到数字，尝试简单模拟一个 rgb
                                    // 但最安全的是直接设置一个固定色或继承
                                    element.style.setProperty(prop, 'inherit', 'important');
                                }
                            }
                        });
                    });
                }
            });

            const dataUrl = canvas.toDataURL('image/png');
            setGeneratedImage(dataUrl);

            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `观想阁_${prompt.title.substring(0, 10)}_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Failed to generate share card:', error);
            alert('生成分享卡片失败，请重试');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="relative w-full max-w-4xl flex flex-col md:flex-row gap-8 items-start justify-center py-8">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute -top-4 -right-4 md:top-0 md:right-0 bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-full shadow-xl z-10 transition-transform hover:scale-110"
                >
                    <Icons.X className="w-6 h-6" />
                </button>

                {/* The Card (Hidden/Off-screen if already generated, but we need it for html2canvas) */}
                <div className="flex-shrink-0">
                    <div
                        ref={cardRef}
                        className="w-[400px] bg-[#0f172a] rounded-[24px] overflow-hidden shadow-2xl flex flex-col relative"
                        style={{
                            fontFamily:
                                "'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif",
                            border: '1px solid rgba(51, 65, 85, 0.5)'
                        }}
                    >
                        {/* Top Shine Effect */}
                        <div
                            className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
                            style={{ background: 'linear-gradient(to bottom, rgba(99, 102, 241, 0.1), transparent)' }}
                        ></div>

                        {/* Generated Image - 使用固定高度确保坐标计算准确 */}
                        <div className="relative w-full h-[400px] overflow-hidden bg-slate-900">
                            {(preloadedImageUrl || version.imageUrl) ? (
                                <img
                                    data-share-image="true"
                                    src={preloadedImageUrl || version.imageUrl}
                                    alt="Shared focus"
                                    className="w-full h-full object-cover"
                                    crossOrigin="anonymous"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-700">
                                    <Icons.Image className="w-16 h-16 opacity-20" />
                                </div>
                            )}
                            {/* Overlay Badge - 使用显式高度和行高确保垂直居中 */}
                            <div
                                className="absolute top-4 left-4 h-6 px-3 rounded-full text-[10px] font-bold text-white/90 tracking-widest uppercase z-20 flex items-center justify-center"
                                style={{
                                    lineHeight: '24px',
                                    paddingTop: '1px',
                                    backgroundColor: 'rgba(26, 26, 26, 0.8)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}
                            >
                                <span data-share-text="true">观想阁 · Insight Gallery</span>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="p-6 pt-8 flex flex-col gap-4 relative">
                            {/* Prompt Tags / Keywords */}
                            <div className="flex flex-wrap gap-2">
                                {prompt.tags.map(tag => (
                                    <span
                                        key={tag}
                                        className="text-[10px] px-2 py-0.5 rounded-md"
                                        style={{
                                            lineHeight: '12px',
                                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                            color: '#818cf8',
                                            border: '1px solid rgba(99, 102, 241, 0.2)'
                                        }}
                                    >
                                        <span data-share-text="true">#{tag}</span>
                                    </span>
                                ))}
                            </div>

                            {/* Prompt Text (Truncated) */}
                            <div className="relative">
                                <Icons.Maximize
                                    className="absolute -left-1 -top-1 w-8 h-8 rotate-12"
                                    style={{ color: 'rgba(99, 102, 241, 0.05)' }}
                                />
                                <p
                                    className="text-slate-300 text-sm line-clamp-4 italic relative z-10 pl-2"
                                    style={{
                                        lineHeight: '22px',
                                        borderLeft: '2px solid rgba(99, 102, 241, 0.3)'
                                    }}
                                    data-share-text="true"
                                >
                                    "{version.text}"
                                </p>
                            </div>

                            {/* Divider */}
                            <div
                                className="h-px w-full my-2"
                                style={{ background: 'linear-gradient(to right, transparent, rgba(51, 65, 85, 0.5), transparent)' }}
                            ></div>

                            {/* Footer */}
                            <div className="flex items-end justify-between gap-4">
                                {/* User Info */}
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-lg"
                                        style={{
                                            lineHeight: '36px',
                                            background: 'linear-gradient(to bottom right, #6366f1, #9333ea)',
                                            border: '2px solid #1e293b'
                                        }} // 补偿边框后的实际内部高度 (40px - 4px border)
                                    >
                                        <span data-share-text="true" style={{ display: 'block', height: '100%' }}>
                                            {(prompt.author?.username || user?.username || '观想阁用户').substring(0, 2).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-white" style={{ lineHeight: '16px' }} data-share-text="true">
                                            {prompt.author?.username || user?.username || '观想阁用户'}
                                        </span>
                                        <span
                                            className="text-[10px] text-slate-500 uppercase tracking-tighter"
                                            style={{ lineHeight: '12px' }}
                                            data-share-text="true"
                                        >
                                            Verified Prompt Engineer
                                        </span>
                                    </div>
                                </div>

                                {/* QR Code */}
                                <div className="p-1.5 bg-white rounded-lg shadow-inner overflow-hidden">
                                    <QRCodeCanvas
                                        value={shareUrl}
                                        size={64}
                                        level="H"
                                        includeMargin={false}
                                    />
                                </div>
                            </div>

                            {/* Slogan & Branding */}
                            <div
                                className="mt-4 flex items-center justify-between text-[9px] text-slate-600 font-medium"
                                style={{ lineHeight: '12px' }}
                            >
                                <span data-share-text="true">人人智学社出品</span>
                                <span data-share-text="true">{new Date().toLocaleDateString('zh-CN')}</span>
                            </div>
                        </div>

                        {/* Bottom Glow */}
                        <div
                            className="h-1.5 w-full opacity-50"
                            style={{ background: 'linear-gradient(to right, #4f46e5, #a855f7, #ec4899)' }}
                        ></div>
                    </div>
                </div>

                {/* Controls / Preview Panel */}
                <div className="flex flex-col gap-6 max-w-[300px]">
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white tracking-tight">分享你的灵感</h2>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            将你的创作及其背后的 Prompt 打包成精美卡片。这不仅是展示作品，更是展示你的“思考过程”。
                        </p>
                    </div>

                    <div className="space-y-4 pt-4">
                        <button
                            onClick={handleDownload}
                            disabled={isGenerating}
                            className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                        >
                            {isGenerating ? (
                                <Icons.Refresh className="w-5 h-5 animate-spin" />
                            ) : (
                                <Icons.Download className="w-5 h-5" />
                            )}
                            {isGenerating ? '生成中...' : '保存为图片'}
                        </button>

                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2 uppercase tracking-widest leading-none">
                                <Icons.Globe className="w-3 h-3 text-blue-400" />
                                扫描二维码访问
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed md:break-all">
                                {shareUrl}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
