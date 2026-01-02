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

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setIsGenerating(true);
        try {
            // 确保字体和图片都已加载
            const images = Array.from(cardRef.current.querySelectorAll('img')) as HTMLImageElement[];
            await Promise.all([
                document.fonts?.ready || Promise.resolve(),
                ...images.map(img => {
                    if (img.complete) return Promise.resolve();
                    return new Promise(resolve => {
                        img.onload = resolve;
                        img.onerror = resolve;
                    });
                })
            ]);

            const cardElement = cardRef.current;
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
                    // 仅在图片有效且有尺寸时应用背景图技巧
                    if (image?.parentElement && image.complete && image.naturalWidth > 0) {
                        const container = image.parentElement as HTMLElement;
                        container.style.backgroundImage = `url("${image.src}")`;
                        container.style.backgroundSize = 'cover';
                        container.style.backgroundPosition = 'center';
                        container.style.backgroundRepeat = 'no-repeat';
                        image.style.visibility = 'hidden';
                    }

                    clonedElement
                        .querySelectorAll('[data-share-text="true"]')
                        .forEach((node) => {
                            (node as HTMLElement).style.transform = 'translateY(-6px)';
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
                        className="w-[400px] bg-[#0f172a] rounded-[24px] overflow-hidden shadow-2xl border border-slate-700/50 flex flex-col relative"
                        style={{
                            fontFamily:
                                "'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif"
                        }}
                    >
                        {/* Top Shine Effect */}
                        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none"></div>

                        {/* Generated Image - 使用固定高度确保坐标计算准确 */}
                        <div className="relative w-full h-[400px] overflow-hidden bg-slate-900">
                            {version.imageUrl ? (
                                <img
                                    data-share-image="true"
                                    src={version.imageUrl}
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
                                className="absolute top-4 left-4 h-6 px-3 bg-[#1a1a1a]/80 rounded-full border border-white/10 text-[10px] font-bold text-white/90 tracking-widest uppercase z-20 flex items-center justify-center"
                                style={{
                                    lineHeight: '24px', // 与高度 h-6 (24px) 一致
                                    paddingTop: '1px'   // 视觉微调，补偿字体重心
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
                                        className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                        style={{ lineHeight: '12px' }}
                                    >
                                        <span data-share-text="true">#{tag}</span>
                                    </span>
                                ))}
                            </div>

                            {/* Prompt Text (Truncated) */}
                            <div className="relative">
                                <Icons.Maximize className="absolute -left-1 -top-1 w-8 h-8 text-indigo-500/5 rotate-12" />
                                <p
                                    className="text-slate-300 text-sm line-clamp-4 italic relative z-10 pl-2 border-l-2 border-indigo-500/30"
                                    style={{ lineHeight: '22px' }}
                                    data-share-text="true"
                                >
                                    "{version.text}"
                                </p>
                            </div>

                            {/* Divider */}
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-700/50 to-transparent my-2"></div>

                            {/* Footer */}
                            <div className="flex items-end justify-between gap-4">
                                {/* User Info */}
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white border-2 border-slate-800 shadow-lg"
                                        style={{ lineHeight: '36px' }} // 补偿边框后的实际内部高度 (40px - 4px border)
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
                                <div className="p-1.5 bg-white rounded-lg shadow-inner">
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
                        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 opacity-50"></div>
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
